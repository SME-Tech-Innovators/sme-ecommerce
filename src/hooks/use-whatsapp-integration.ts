"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  disconnectWhatsAppIntegration,
  getWhatsAppIntegration,
  syncWhatsAppCatalog,
  updateWhatsAppIntegration,
} from "@/apis/whatsapp-integration";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import type { UpdateWhatsAppIntegrationBody } from "@/types/whatsapp-integration";

export function whatsappIntegrationQueryKey(workspaceId: string) {
  return ["whatsapp-integration", workspaceId] as const;
}

function requireAccessToken(): string {
  const session = getStoredAuthSession();
  if (!session?.accessToken) {
    throw new Error("Sign in to manage WhatsApp integration.");
  }
  return session.accessToken;
}

export function useWhatsAppIntegration(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: whatsappIntegrationQueryKey(workspaceId),
    enabled: enabled && Boolean(workspaceId),
    queryFn: async () => {
      const result = await getWhatsAppIntegration(
        workspaceId,
        requireAccessToken(),
      );
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
  });
}

export function useUpdateWhatsAppIntegration(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateWhatsAppIntegrationBody) => {
      const result = await updateWhatsAppIntegration(
        workspaceId,
        requireAccessToken(),
        body,
      );
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(whatsappIntegrationQueryKey(workspaceId), data);
    },
  });
}

export function useDisconnectWhatsAppIntegration(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await disconnectWhatsAppIntegration(
        workspaceId,
        requireAccessToken(),
      );
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(whatsappIntegrationQueryKey(workspaceId), data);
    },
  });
}

export function useSyncWhatsAppCatalog(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await syncWhatsAppCatalog(
        workspaceId,
        requireAccessToken(),
      );
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: whatsappIntegrationQueryKey(workspaceId),
      });
    },
  });
}
