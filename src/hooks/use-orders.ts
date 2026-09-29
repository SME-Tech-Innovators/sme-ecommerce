"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWorkspaceOrder,
  listWorkspaceOrders,
  updateMerchantOrderStatus,
  type UpdateMerchantOrderStatusBody,
} from "@/apis/orders";
import { bookUberDirectDelivery } from "@/apis/delivery";
import { refreshUberDirectDeliveryStatus } from "@/apis/delivery";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import type { Order } from "@/types/cart";

export const merchantOrderKeys = {
  list: (workspaceId: string) => ["merchant-orders", workspaceId] as const,
  detail: (workspaceId: string, orderId: string) =>
    ["merchant-orders", workspaceId, orderId] as const,
};

function requireAccessToken(): string {
  const session = getStoredAuthSession();
  if (!session?.accessToken) {
    throw new Error("Sign in to view orders.");
  }
  return session.accessToken;
}

export function useMerchantOrders(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: merchantOrderKeys.list(workspaceId),
    enabled: enabled && Boolean(workspaceId),
    refetchInterval: 15_000,
    queryFn: async () => {
      const result = await listWorkspaceOrders(
        workspaceId,
        requireAccessToken(),
      );
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
  });
}

export function useMerchantOrder(
  workspaceId: string,
  orderId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: merchantOrderKeys.detail(workspaceId, orderId ?? ""),
    enabled: enabled && Boolean(workspaceId && orderId),
    queryFn: async () => {
      const result = await getWorkspaceOrder(
        workspaceId,
        orderId!,
        requireAccessToken(),
      );
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
  });
}

export function useUpdateMerchantOrderStatus(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      orderId: string;
      status: UpdateMerchantOrderStatusBody["status"];
    }) => {
      const result = await updateMerchantOrderStatus(
        workspaceId,
        input.orderId,
        requireAccessToken(),
        { status: input.status },
      );
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
    onSuccess: (order) => {
      queryClient.setQueryData(
        merchantOrderKeys.detail(workspaceId, order.id),
        order,
      );
      void queryClient.invalidateQueries({
        queryKey: merchantOrderKeys.list(workspaceId),
      });
    },
  });
}

export function useBookUberDirectDelivery(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { orderId: string; quoteId: string }) => {
      const result = await bookUberDirectDelivery(
        workspaceId,
        input.orderId,
        input.quoteId,
        requireAccessToken(),
      );
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
    onSuccess: (delivery, input) => {
      queryClient.setQueriesData<Order[]>(
        { queryKey: merchantOrderKeys.list(workspaceId) },
        (orders) =>
          orders?.map((order) =>
            order.id === input.orderId ? { ...order, delivery } : order,
          ),
      );
      queryClient.setQueryData<Order>(
        merchantOrderKeys.detail(workspaceId, input.orderId),
        (order) => (order ? { ...order, delivery } : order),
      );
    },
  });
}

export function useRefreshUberDirectDeliveryStatus(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { orderId: string }) => {
      const result = await refreshUberDirectDeliveryStatus(
        workspaceId,
        input.orderId,
        requireAccessToken(),
      );
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
    onSuccess: (delivery, input) => {
      queryClient.setQueriesData<Order[]>(
        { queryKey: merchantOrderKeys.list(workspaceId) },
        (orders) =>
          orders?.map((order) =>
            order.id === input.orderId ? { ...order, delivery } : order,
          ),
      );
      queryClient.setQueryData<Order>(
        merchantOrderKeys.detail(workspaceId, input.orderId),
        (order) => (order ? { ...order, delivery } : order),
      );
    },
  });
}
