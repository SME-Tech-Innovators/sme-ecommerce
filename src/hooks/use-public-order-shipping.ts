"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicOrderShipping } from "@/apis/shipping";
import type { OrderShippingStatus } from "@/types/shipping";

const POLL_INTERVAL_MS = 3_000;
/** Bob Go shipment creation + webhook can take longer than a single quote. */
const MAX_POLL_MS = 120_000;

/** Keep polling until tracking exists or shipment reaches a terminal state. */
export function shouldPollPublicOrderShipping(
  data: OrderShippingStatus | undefined,
): boolean {
  if (!data) return true;
  if (data.status === "not_required") return false;
  if (data.lastError || data.status === "failed") return false;
  if (data.trackingReference) return false;
  if (
    data.status === "created" ||
    data.status === "in_transit" ||
    data.status === "delivered"
  ) {
    return false;
  }
  return true;
}

export function usePublicOrderShipping(
  storeSlug: string,
  orderId: string | null,
  enabled = true,
  options?: { pollWhilePending?: boolean },
) {
  const pollWhilePending = options?.pollWhilePending ?? true;
  const pollStartedAt = useRef<number | null>(null);

  useEffect(() => {
    pollStartedAt.current = null;
  }, [storeSlug, orderId]);

  return useQuery({
    queryKey: ["public-order-shipping", storeSlug, orderId],
    queryFn: async () => {
      if (!orderId) throw new Error("Missing order id");
      const result = await getPublicOrderShipping(storeSlug, orderId);
      if (!result.ok) {
        throw new Error(result.errorMessage);
      }
      return result.data;
    },
    enabled: Boolean(storeSlug && orderId && enabled),
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
    refetchInterval: pollWhilePending
      ? (query) => {
          if (!shouldPollPublicOrderShipping(query.state.data)) {
            pollStartedAt.current = null;
            return false;
          }
          if (pollStartedAt.current == null) {
            pollStartedAt.current = Date.now();
          }
          if (Date.now() - pollStartedAt.current > MAX_POLL_MS) {
            return false;
          }
          return POLL_INTERVAL_MS;
        }
      : false,
  });
}
