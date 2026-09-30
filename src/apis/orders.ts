import { getSmeApiBaseUrl } from "@/apis/config";
import { networkFailure, parseApiEnvelope } from "@/apis/api-result";
import type {
  Order,
  OrderStatus,
  PaymentStatus,
} from "@/types/cart";
import type { ParsedApiFailure } from "@/apis/api-result";

export type MerchantOrdersListResult =
  | { ok: true; data: Order[] }
  | ParsedApiFailure;

export type MerchantOrderResult =
  | { ok: true; data: Order }
  | ParsedApiFailure;

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };
}

function asOrderStatus(raw: unknown): OrderStatus {
  const value = String(raw ?? "pending_payment").toLowerCase();
  if (
    value === "paid" ||
    value === "processing" ||
    value === "fulfilled" ||
    value === "cancelled" ||
    value === "pending_payment"
  ) {
    return value;
  }
  return "pending_payment";
}

function asPaymentStatus(raw: unknown): PaymentStatus {
  const value = String(raw ?? "unpaid").toLowerCase();
  if (
    value === "paid" ||
    value === "initialized" ||
    value === "failed" ||
    value === "refunded" ||
    value === "unpaid"
  ) {
    return value;
  }
  return "unpaid";
}

function asOrder(raw: Order): Order {
  return {
    id: String(raw.id),
    workspaceId: String(raw.workspaceId),
    cartId: raw.cartId == null ? null : String(raw.cartId),
    orderNumber: String(raw.orderNumber ?? ""),
    cancellationRequestStatus: raw.cancellationRequestStatus ?? null,
    customerName: String(raw.customerName ?? ""),
    customerEmail: raw.customerEmail == null ? null : String(raw.customerEmail),
    customerPhone: String(raw.customerPhone ?? ""),
    shippingAddress: {
      line1: String(raw.shippingAddress?.line1 ?? ""),
      line2: raw.shippingAddress?.line2
        ? String(raw.shippingAddress.line2)
        : undefined,
      city: String(raw.shippingAddress?.city ?? ""),
      province: String(raw.shippingAddress?.province ?? ""),
      postalCode: String(raw.shippingAddress?.postalCode ?? ""),
      country: String(raw.shippingAddress?.country ?? ""),
    },
    subtotalAmount: Number(raw.subtotalAmount ?? 0),
    shippingAmount: Number(raw.shippingAmount ?? 0),
    totalAmount: Number(raw.totalAmount ?? 0),
    currency: String(raw.currency ?? "ZAR"),
    status: asOrderStatus(raw.status),
    paymentStatus: asPaymentStatus(raw.paymentStatus),
    items: Array.isArray(raw.items)
      ? raw.items.map((item) => ({
          id: String(item.id),
          orderId: String(item.orderId ?? raw.id),
          productId: item.productId == null ? null : String(item.productId),
          title: String(item.title ?? ""),
          sku: String(item.sku ?? ""),
          quantity: Number(item.quantity ?? 0),
          unitPriceAmount: Number(item.unitPriceAmount ?? 0),
          totalAmount: Number(item.totalAmount ?? 0),
          currency: String(item.currency ?? raw.currency ?? "ZAR"),
        }))
      : [],
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  };
}

/** Normalize API order payloads (public + merchant). */
export function normalizeOrder(raw: Order): Order {
  return asOrder(raw);
}

function unwrapOrders(raw: unknown): Order[] {
  if (Array.isArray(raw)) return raw as Order[];
  if (raw && typeof raw === "object") {
    const obj = raw as { items?: Order[]; orders?: Order[]; content?: Order[] };
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.orders)) return obj.orders;
    if (Array.isArray(obj.content)) return obj.content;
  }
  return [];
}

/** GET /workspaces/{workspaceId}/orders */
export async function listWorkspaceOrders(
  workspaceId: string,
  accessToken: string,
): Promise<MerchantOrdersListResult> {
  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/orders`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not load orders. Check your connection and try again.",
    );
  }

  const parsed = await parseApiEnvelope<unknown>(
    res,
    "Orders could not be loaded.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: unwrapOrders(parsed.data).map(asOrder) };
}

/** GET /workspaces/{workspaceId}/orders/{orderId} */
export async function getWorkspaceOrder(
  workspaceId: string,
  orderId: string,
  accessToken: string,
): Promise<MerchantOrderResult> {
  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/orders/${encodeURIComponent(orderId)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not load this order. Check your connection and try again.",
    );
  }

  const parsed = await parseApiEnvelope<Order>(
    res,
    "Order could not be loaded.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asOrder(parsed.data) };
}

export type UpdateMerchantOrderStatusBody = {
  status: Extract<OrderStatus, "processing" | "fulfilled" | "cancelled">;
};

/** PATCH /workspaces/{workspaceId}/orders/{orderId} */
export async function updateMerchantOrderStatus(
  workspaceId: string,
  orderId: string,
  accessToken: string,
  body: UpdateMerchantOrderStatusBody,
): Promise<MerchantOrderResult> {
  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/orders/${encodeURIComponent(orderId)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: {
        ...authHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not update this order. Check your connection and try again.",
    );
  }

  const parsed = await parseApiEnvelope<Order>(
    res,
    "Order status could not be updated.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asOrder(parsed.data) };
}
