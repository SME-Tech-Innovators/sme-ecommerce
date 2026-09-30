"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDeliverySettings,
  updateDeliverySettings,
} from "@/apis/delivery";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import type { UpdateDeliverySettingsBody } from "@/types/delivery";

export const deliverySettingsKeys = {
  settings: (workspaceId: string) =>
    ["delivery-settings", workspaceId] as const,
};

function requireAccessToken(): string {
  const session = getStoredAuthSession();
  if (!session?.accessToken) {
    throw new Error("Sign in to manage delivery settings.");
  }
  return session.accessToken;
}

export function useDeliverySettings(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: deliverySettingsKeys.settings(workspaceId),
    enabled: enabled && Boolean(workspaceId),
    queryFn: async () => {
      const result = await getDeliverySettings(
        workspaceId,
        requireAccessToken(),
      );
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
  });
}

export function useUpdateDeliverySettings(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateDeliverySettingsBody) => {
      const result = await updateDeliverySettings(
        workspaceId,
        requireAccessToken(),
        body,
      );
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(deliverySettingsKeys.settings(workspaceId), data);
    },
  });
}