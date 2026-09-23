import type { Order } from "@/types/cart";
import type { OrderReturn, ReturnQuoteRequest } from "@/types/order-returns";
import type { OrderShippingStatus } from "@/types/shipping";

export const QUOTE_LIFETIME = 15 * 60_000;
export const REFUND_POLL_LIMIT = 5 * 60_000;
export function canReturnOrder(order: Order, shipping?: OrderShippingStatus): boolean {
  return order.status === "fulfilled" && order.paymentStatus === "paid" && shipping?.provider?.toLowerCase() === "bobgo";
}
export function canRefundReturn(value: OrderReturn): boolean {
  return value.shipmentStatus === "RECEIVED" && Boolean(value.receivedAt) && value.refundStatus === "NOT_REQUESTED";
}
export function shouldPollRefund(value: OrderReturn | null | undefined, elapsed: number): boolean {
  return Boolean(value?.refundId && ["PENDING", "PROCESSING"].includes(value.refundStatus) && elapsed < REFUND_POLL_LIMIT);
}
export function shipmentLabel(status: string): string {
  return ({ QUOTED: "Rates available", CREATED: "Return booked — awaiting receipt", RECEIVED: "Return received" } as Record<string, string>)[status] ?? "Provider verification required. Contact support before taking further action.";
}
export function refundLabel(status: string): string {
  return ({ NOT_REQUESTED: "Refund not requested", PENDING: "Refund in progress", PROCESSING: "Refund in progress", PROCESSED: "Refunded", FAILED: "Refund failed — contact support", NEEDS_ATTENTION: "Refund needs attention — contact support" } as Record<string, string>)[status] ?? "Refund requires provider verification. Contact support; do not request another refund.";
}
export function validateReturnQuote(value: ReturnQuoteRequest): string[] {
  const errors: string[] = [];
  for (const [key, label, max] of [["reason", "Reason", 1000], ["merchantContactName", "Contact name", 255], ["merchantContactEmail", "Contact email", 255], ["merchantContactPhone", "Contact phone", 50]] as const) {
    if (!value[key].trim() || value[key].length > max) errors.push(`${label} is required (maximum ${max} characters).`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.merchantContactEmail)) errors.push("Enter a valid contact email.");
  if (value.parcels.length < 1 || value.parcels.length > 50) errors.push("Provide between 1 and 50 parcels.");
  value.parcels.forEach((parcel, index) => {
    if (!parcel.description.trim() || parcel.description.length > 255) errors.push(`Parcel ${index + 1}: description is required (maximum 255 characters).`);
    if ([parcel.lengthCm, parcel.widthCm, parcel.heightCm, parcel.weightKg].some(n => !Number.isFinite(n) || n < 0.01)) errors.push(`Parcel ${index + 1}: dimensions and weight must be at least 0.01.`);
  });
  return errors;
}

/** A single delayed check; React schedules the next only after the previous completes. */
export function scheduleRefundRefresh(value: OrderReturn | null | undefined, startedAt: number, refresh: () => void): () => void {
  if (!shouldPollRefund(value, Date.now() - startedAt)) return () => {};
  const timer = setTimeout(() => {
    if (shouldPollRefund(value, Date.now() - startedAt)) refresh();
  }, 10_000);
  return () => clearTimeout(timer);
}

export function selectedReturnOption(value: OrderReturn | null | undefined, optionId: string, unchanged: boolean, expiresAt: number, now = Date.now()) {
  if (!unchanged || now >= expiresAt || value?.shipmentStatus !== "QUOTED" || value.refundStatus !== "NOT_REQUESTED") return undefined;
  return value.options?.find(option => option.id === optionId);
}
