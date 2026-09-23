"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMerchantOrderShipping, postMerchantShippingAction } from "@/apis/shipping";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import { merchantOrderKeys } from "@/hooks/use-orders";
import type { OrderShippingStatus } from "@/types/shipping";

export const merchantShippingKey = (workspaceId: string, orderId: string) =>
  ["merchant-order-shipping", workspaceId, orderId] as const;
const activeCommands = new Set<string>();
// An ambiguous cancellation must be reconciled even after closing/reopening the panel.
const uncertainCancellations = new Set<string>();
function token() {
  const value = getStoredAuthSession()?.accessToken;
  if (!value) throw new Error("Sign in to manage shipping.");
  return value;
}
export function shouldPollMerchantShipping(data?: OrderShippingStatus) {
  return data?.provider?.toLowerCase() === "bobgo" &&
    !["delivered", "cancelled", "failed", "not_required"].includes(data.status ?? "");
}
export function useMerchantShipping(workspaceId: string, orderId: string) {
  const client = useQueryClient();
  const key = merchantShippingKey(workspaceId, orderId);
  const id = JSON.stringify(key);
  function observe(data: OrderShippingStatus) {
    if (["cancelled", "delivered", "in_transit"].includes(data.status ?? "")) uncertainCancellations.delete(id);
    return data;
  }
  const query = useQuery({
    queryKey: key, retry: false, refetchOnWindowFocus: false,
    queryFn: async () => {
      const result = await getMerchantOrderShipping(workspaceId, orderId, token());
      if (!result.ok) throw new Error(result.errorMessage);
      return observe(result.data);
    },
  });
  const mutation = useMutation({
    retry: false,
    mutationFn: async (action: "refresh" | "cancel") => {
      if (activeCommands.has(id)) throw new Error("A shipping update is already in progress.");
      if (action === "cancel" && uncertainCancellations.has(id)) throw new Error("Verify the previous cancellation with Bob Go before trying again.");
      activeCommands.add(id);
      try {
        await client.cancelQueries({ queryKey: key });
        const result = await postMerchantShippingAction(workspaceId, orderId, token(), action);
        if (!result.ok) {
          if (action === "cancel") uncertainCancellations.add(id);
          const recorded = await getMerchantOrderShipping(workspaceId, orderId, token());
          if (recorded.ok) client.setQueryData(key, observe(recorded.data));
          throw new Error(result.errorMessage);
        }
        client.setQueryData(key, observe(result.data));
        await client.invalidateQueries({ queryKey: merchantOrderKeys.list(workspaceId) });
        return result.data;
      } finally { activeCommands.delete(id); }
    },
  });
  return {
    query, mutation,
    canCancel: query.data?.canCancel === true && !query.isError && !query.isFetching &&
      !mutation.isPending && !activeCommands.has(id) && !uncertainCancellations.has(id),
    uncertain: uncertainCancellations.has(id),
  };
}
