"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomerDeliveryOptions } from "@/apis/delivery";
import type { CustomerDeliveryOptionsInput } from "@/types/delivery";

export const deliveryOptionsKeys = {
  list: (storeSlug: string, input: CustomerDeliveryOptionsInput | null) =>
    ["customer-delivery-options", storeSlug, input] as const,
};

export function useCustomerDeliveryOptions(
  storeSlug: string,
  input: CustomerDeliveryOptionsInput | null,
) {
  return useQuery({
    queryKey: deliveryOptionsKeys.list(storeSlug, input),
    enabled: Boolean(input),
    retry: false,
    queryFn: async () => {
      if (!input) throw new Error("A complete delivery address is required.");
      const result = await getCustomerDeliveryOptions(storeSlug, input);
      if (!result.ok) throw new Error(result.errorMessage);
      return result.data;
    },
  });
}