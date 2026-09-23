import { getSmeApiBaseUrl } from "@/apis/config";
import { parseApiEnvelope } from "@/apis/api-result";
import { normalizeOrder } from "@/apis/orders";
import type { Order } from "@/types/cart";

export type CancellationRequest = {
  status: "none" | "requested" | "approved" | "rejected";
  reason: string | null;
  reviewNote: string | null;
  requestedAt: string | null;
  reviewedAt: string | null;
  canRequest: boolean;
  unavailableReason: string | null;
};

async function call<T>(path: string, headers: Record<string, string> = {}, body?: unknown): Promise<T> {
  const res = await fetch(`${getSmeApiBaseUrl()}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Accept: "application/json", ...headers, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    cache: "no-store",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await parseApiEnvelope<T>(res, "Could not update the cancellation request. Please try again.");
  if (!result.ok) throw new Error(result.errorMessage);
  return result.data;
}
const publicOrders = (slug: string) => `/public/storefronts/${encodeURIComponent(slug)}/orders`;
const customerHeaders = (token: string) => ({ "X-Order-Access-Token": token });

export function requestOrderAccessLink(slug: string, orderNumber: string, email: string) {
  return call<{ message: string }>(`${publicOrders(slug)}/access-link`, {}, { orderNumber, email });
}
export async function getSecureCustomerOrder(slug: string, id: string, token: string) {
  return normalizeOrder(await call<Order>(`${publicOrders(slug)}/${encodeURIComponent(id)}/customer-access`, customerHeaders(token)));
}
export function customerCancellation(slug: string, id: string, token: string, reason?: string) {
  return call<CancellationRequest>(`${publicOrders(slug)}/${encodeURIComponent(id)}/cancellation-request`,
    customerHeaders(token), reason === undefined ? undefined : { reason });
}
export function merchantCancellation(workspaceId: string, id: string, token: string,
  review?: { decision: "approve" | "reject"; note: string }) {
  return call<CancellationRequest>(`/workspaces/${encodeURIComponent(workspaceId)}/orders/${encodeURIComponent(id)}/cancellation-request${review ? "/review" : ""}`,
    { Authorization: `Bearer ${token}` }, review);
}
