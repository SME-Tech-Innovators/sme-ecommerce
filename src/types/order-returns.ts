import type { ShippingOption } from "@/types/shipping";

export type ReturnQuoteRequest = {
  reason: string;
  merchantContactName: string;
  merchantContactEmail: string;
  merchantContactPhone: string;
  parcels: Array<{ description: string; lengthCm: number; widthCm: number; heightCm: number; weightKg: number }>;
};

export type OrderReturn = {
  orderId: string;
  shipmentStatus: string;
  refundStatus: string;
  trackingReference?: string | null;
  shipmentId?: string | null;
  refundId?: string | null;
  receivedAt?: string | null;
  options?: ShippingOption[] | null;
};
export type ReturnAction = "quote" | "shipment" | "receive" | "refund" | "refund/refresh";
