import { getSmeApiBaseUrl } from "@/apis/config";
import { networkFailure, parseApiEnvelope, type ParsedApiFailure } from "@/apis/api-result";
import type { OrderReturn, ReturnAction, ReturnQuoteRequest } from "@/types/order-returns";

export function isReturnAbsent(error: ParsedApiFailure): boolean {
  return error.status === 400 && error.errorCode === "VALIDATION_ERROR" &&
    error.errorMessage === "Return not found; request a return quote first";
}

export async function requestOrderReturn(
  workspaceId: string, orderId: string, accessToken: string,
  action?: ReturnAction, body?: ReturnQuoteRequest | { optionId: string },
): Promise<{ ok: true; data: OrderReturn | null } | ParsedApiFailure> {
  let response: Response;
  try {
    response = await fetch(`${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/orders/${encodeURIComponent(orderId)}/return${action ? `/${action}` : ""}`, {
      method: action ? "POST" : "GET",
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store",
    });
  } catch {
    return networkFailure("Could not contact the server. Check the recorded return status before trying again.");
  }
  const result = await parseApiEnvelope<OrderReturn>(response, "Could not load or update the return.");
  if (!action && !result.ok && isReturnAbsent(result)) return { ok: true, data: null };
  return result;
}
