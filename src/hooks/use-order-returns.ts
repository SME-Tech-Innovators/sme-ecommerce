"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requestOrderReturn } from "@/apis/order-returns";
import { getMerchantOrderShipping } from "@/apis/shipping";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import { merchantOrderKeys } from "@/hooks/use-orders";
import type { OrderReturn, ReturnAction, ReturnQuoteRequest } from "@/types/order-returns";

export const orderReturnKey = (workspaceId: string, orderId: string) => ["order-return", workspaceId, orderId] as const;
function token() {
  const value = getStoredAuthSession()?.accessToken;
  if (!value) throw new Error("Sign in to manage returns.");
  return value;
}
// Survives panel unmounts: an in-flight command cannot be repeated on reopening.
const commands = new Set<string>();
export function useOrderReturn(workspaceId: string, orderId: string) {
  const client = useQueryClient();
  const key = orderReturnKey(workspaceId, orderId);
  const commandKey = JSON.stringify(key);
  const [unverified, setUnverified] = useState(false);
  const busy = useRef(false);
  async function store(data: OrderReturn | null) {
    client.setQueryData(key, data);
    if (data?.refundStatus === "PROCESSED") {
      await client.invalidateQueries({ queryKey: merchantOrderKeys.list(workspaceId) });
    }
  }
  const query = useQuery({
    queryKey: key, retry: false, refetchOnWindowFocus: false, refetchOnMount: "always",
    queryFn: async () => {
      const result = await requestOrderReturn(workspaceId, orderId, token());
      if (!result.ok) throw new Error(result.errorMessage);
      if (result.data?.refundStatus === "PROCESSED") void client.invalidateQueries({ queryKey: merchantOrderKeys.list(workspaceId) });
      return result.data;
    },
  });
  const mutation = useMutation({
    retry: false,
    mutationFn: async ({ action, body }: { action: ReturnAction; body?: ReturnQuoteRequest | { optionId: string } }) => {
      if (busy.current || commands.has(commandKey)) throw new Error("An operation is already in progress. Refresh the recorded status shortly.");
      busy.current = true;
      commands.add(commandKey);
      try {
        await client.cancelQueries({ queryKey: key });
        const result = await requestOrderReturn(workspaceId, orderId, token(), action, body);
        if (!result.ok) {
          setUnverified(true);
          const recorded = await requestOrderReturn(workspaceId, orderId, token());
          if (recorded.ok) {
            await store(recorded.data);
            setUnverified(false);
          }
          throw new Error(result.errorMessage);
        }
        await store(result.data);
        setUnverified(false);
        return result.data;
      } finally {
        commands.delete(commandKey);
        busy.current = false;
      }
    },
  });
  async function verify() {
    if (busy.current || commands.has(commandKey)) return;
    const result = await query.refetch();
    if (result.isSuccess) setUnverified(false);
  }
  return { query, mutation, verify, blocked: unverified || query.isError || query.isFetching || mutation.isPending || commands.has(commandKey) };
}
export function useReturnShipping(workspaceId: string, orderId: string) {
  return useQuery({
    queryKey: ["merchant-order-shipping", workspaceId, orderId], retry: false,
    queryFn: async () => {
      const result = await getMerchantOrderShipping(workspaceId, orderId, token());
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
  });
}
