"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getShippingSettings,
  updateShippingSettings,
} from "@/apis/shipping";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import type { UpdateShippingSettingsBody } from "@/types/shipping";

export function shippingSettingsQueryKey(workspaceId: string) {
  return ["shipping-settings", workspaceId] as const;
}

function requireAccessToken(): string {
  const session = getStoredAuthSession();
  if (!session?.accessToken) {
    throw new Error("Sign in to manage shipping settings.");
  }
  return session.accessToken;
}

export function useShippingSettings(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: shippingSettingsQueryKey(workspaceId),
    enabled: enabled && Boolean(workspaceId),
    queryFn: async () => {
      const result = await getShippingSettings(
        workspaceId,
        requireAccessToken(),
      );
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
  });
}

export function useUpdateShippingSettings(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateShippingSettingsBody) => {
      const result = await updateShippingSettings(
        workspaceId,
        requireAccessToken(),
        body,
      );
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(shippingSettingsQueryKey(workspaceId), data);
    },
  });
}
