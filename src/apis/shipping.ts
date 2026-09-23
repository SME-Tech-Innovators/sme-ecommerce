import { getSmeApiBaseUrl } from "@/apis/config";
import { networkFailure, parseApiEnvelope } from "@/apis/api-result";
import type {
  OrderShippingStatus,
  OrderShippingStatusResult,
  ShippingAddress,
  ShippingQuote,
  ShippingQuoteResult,
  ShippingSettings,
  ShippingSettingsResult,
  UpdateShippingSettingsBody,
} from "@/types/shipping";

function authHeaders(accessToken: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

function publicHeaders(json = false): HeadersInit {
  return {
    Accept: "application/json",
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

function asShippingOption(raw: unknown): ShippingQuote["options"][number] {
  const o = raw as Record<string, unknown>;
  return {
    id: String(o.id ?? ""),
    provider: String(o.provider ?? ""),
    label: String(o.label ?? "Delivery"),
    amount: Number(o.amount ?? 0),
    currency: String(o.currency ?? "ZAR"),
    estimatedDays:
      o.estimatedDays == null ? null : Number(o.estimatedDays),
    bobgoRateToken:
      o.bobgoRateToken == null ? null : String(o.bobgoRateToken),
  };
}

function asQuote(raw: ShippingQuote): ShippingQuote {
  const options = Array.isArray(raw.options)
    ? raw.options.map(asShippingOption)
    : [];
  return { options };
}

function asAddress(raw: unknown): ShippingAddress | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const line1 = String(o.line1 ?? "").trim();
  if (!line1) return null;
  return {
    line1,
    line2: o.line2 ? String(o.line2) : undefined,
    city: String(o.city ?? ""),
    province: o.province ? String(o.province) : undefined,
    postalCode: o.postalCode ? String(o.postalCode) : undefined,
    country: String(o.country ?? "ZA"),
  };
}

function asSettings(raw: ShippingSettings): ShippingSettings {
  return {
    provider: String(raw.provider ?? "bobgo"),
    enabled: Boolean(raw.enabled),
    collectionAddress: asAddress(raw.collectionAddress),
    fallbackFlatRateAmount:
      raw.fallbackFlatRateAmount == null
        ? null
        : Number(raw.fallbackFlatRateAmount),
    fallbackFlatRateCurrency: String(raw.fallbackFlatRateCurrency ?? "ZAR"),
    allowPickup: Boolean(raw.allowPickup),
    pickupLabel: raw.pickupLabel == null ? null : String(raw.pickupLabel),
  };
}

function asOrderShipping(raw: OrderShippingStatus): OrderShippingStatus {
  return {
    canCancel: raw.canCancel === true,
    provider: raw.provider == null ? null : String(raw.provider),
    status: raw.status == null ? null : String(raw.status),
    statusLabel: raw.statusLabel == null ? null : String(raw.statusLabel),
    trackingReference:
      raw.trackingReference == null ? null : String(raw.trackingReference),
    trackingUrl: raw.trackingUrl == null ? null : String(raw.trackingUrl),
    carrierName: raw.carrierName == null ? null : String(raw.carrierName),
    shippingOptionLabel:
      raw.shippingOptionLabel == null ? null : String(raw.shippingOptionLabel),
    lastError: raw.lastError == null ? null : String(raw.lastError),
  };
}

/** GET /workspaces/{workspaceId}/shipping/settings */
export async function getShippingSettings(
  workspaceId: string,
  accessToken: string,
): Promise<ShippingSettingsResult> {
  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/shipping/settings`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not load shipping settings. Check your connection and try again.",
    );
  }
  const parsed = await parseApiEnvelope<ShippingSettings>(
    res,
    "Shipping settings could not be loaded.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asSettings(parsed.data) };
}

/** PUT /workspaces/{workspaceId}/shipping/settings */
export async function updateShippingSettings(
  workspaceId: string,
  accessToken: string,
  body: UpdateShippingSettingsBody,
): Promise<ShippingSettingsResult> {
  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/shipping/settings`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "PUT",
      headers: authHeaders(accessToken, true),
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not save shipping settings. Check your connection and try again.",
    );
  }
  const parsed = await parseApiEnvelope<ShippingSettings>(
    res,
    "Shipping settings could not be saved.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asSettings(parsed.data) };
}

/** POST /public/storefronts/{storeSlug}/shipping/quote */
export async function postShippingQuote(
  storeSlug: string,
  body: { cartId: string; shippingAddress: ShippingAddress },
): Promise<ShippingQuoteResult> {
  const url = `${getSmeApiBaseUrl()}/public/storefronts/${encodeURIComponent(storeSlug)}/shipping/quote`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: publicHeaders(true),
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not fetch delivery options. Check your connection and try again.",
    );
  }
  const parsed = await parseApiEnvelope<ShippingQuote>(
    res,
    "Delivery options could not be loaded.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asQuote(parsed.data) };
}

/** GET /public/storefronts/{storeSlug}/orders/{orderId}/shipping */
export async function getPublicOrderShipping(
  storeSlug: string,
  orderId: string,
): Promise<OrderShippingStatusResult> {
  const url = `${getSmeApiBaseUrl()}/public/storefronts/${encodeURIComponent(storeSlug)}/orders/${encodeURIComponent(orderId)}/shipping`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: publicHeaders(),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not load delivery status. Check your connection and try again.",
    );
  }
  const parsed = await parseApiEnvelope<OrderShippingStatus>(
    res,
    "Delivery status could not be loaded.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asOrderShipping(parsed.data) };
}

/** Authenticated provider source; the order DTO does not include shippingProvider. */
export async function getMerchantOrderShipping(
  workspaceId: string, orderId: string, accessToken: string,
): Promise<OrderShippingStatusResult> {
  let res: Response;
  try {
    res = await fetch(`${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/orders/${encodeURIComponent(orderId)}/shipping`, {
      headers: authHeaders(accessToken), cache: "no-store",
    });
  } catch {
    return networkFailure("Could not verify the shipping provider.");
  }
  const result = await parseApiEnvelope<OrderShippingStatus>(res, "Could not verify the shipping provider.");
  return result.ok ? { ok: true, data: asOrderShipping(result.data) } : result;
}

/** Backend-mediated provider commands. No provider secrets are sent to the browser. */
export async function postMerchantShippingAction(
  workspaceId: string, orderId: string, accessToken: string, action: "refresh" | "cancel",
): Promise<OrderShippingStatusResult> {
  let res: Response;
  try {
    res = await fetch(`${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/orders/${encodeURIComponent(orderId)}/shipping/${action}`, {
      method: "POST", headers: authHeaders(accessToken), cache: "no-store",
    });
  } catch {
    return networkFailure("Could not confirm the shipping update. Check recorded status before trying again.");
  }
  const result = await parseApiEnvelope<OrderShippingStatus>(res, "Could not update Bob Go shipping.");
  return result.ok ? { ok: true, data: asOrderShipping(result.data) } : result;
}
