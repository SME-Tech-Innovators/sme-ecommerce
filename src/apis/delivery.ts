import { networkFailure, parseApiEnvelope } from "@/apis/api-result";
import { getSmeApiBaseUrl } from "@/apis/config";
import type {
  CustomerDeliveryOptionsInput,
  CustomerDeliveryOptionsResponse,
  DeliveryApiResult,
  DeliverySettings,
  UpdateDeliverySettingsBody,
  UberDirectDelivery,
} from "@/types/delivery";

function authHeaders(accessToken: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

function publicJsonHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function workspaceDeliverySettingsBase(workspaceId: string): string {
  return `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/delivery-settings`;
}

const deliveryNetworkError =
  "Unable to connect to the delivery service. Please try again.";

function mapDeliveryHttpFailure<T>(
  result: DeliveryApiResult<T>,
): DeliveryApiResult<T> {
  if (result.ok) return result;
  if (result.status === 502) {
    return {
      ...result,
      errorMessage: "Delivery service is temporarily unavailable. Please try again.",
    };
  }
  if (result.status === 503) {
    return { ...result, errorMessage: "Uber Direct is currently unavailable." };
  }
  return result;
}

async function parseDeliveryApiEnvelope<T>(
  res: Response,
  fallbackMessage: string,
): Promise<DeliveryApiResult<T>> {
  return mapDeliveryHttpFailure(
    await parseApiEnvelope<T>(res, fallbackMessage),
  );
}

export function normalizeUberDirectDelivery(raw: unknown): UberDirectDelivery {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const rawCourier = data.courier;
  const courier =
    rawCourier && typeof rawCourier === "object"
      ? (rawCourier as Record<string, unknown>)
      : null;
  const asEta = (value: unknown): number | null => {
    if (value == null || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    id: String(data.id ?? ""),
    status: String(data.status ?? "unknown"),
    trackingUrl:
      data.trackingUrl == null && data.tracking_url == null
        ? null
        : String(data.trackingUrl ?? data.tracking_url),
    courier: courier
      ? {
          name: courier.name == null ? null : String(courier.name),
          phone: courier.phone == null ? null : String(courier.phone),
        }
      : null,
    pickupEta: asEta(data.pickupEta ?? data.pickup_eta),
    dropoffEta: asEta(data.dropoffEta ?? data.dropoff_eta),
  };
}

async function parseUberDirectDeliveryResponse(
  res: Response,
  fallbackMessage: string,
): Promise<DeliveryApiResult<UberDirectDelivery>> {
  const envelopeResponse = res.clone();
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return parseDeliveryApiEnvelope<UberDirectDelivery>(
      envelopeResponse,
      fallbackMessage,
    );
  }

  if (
    res.ok &&
    payload &&
    typeof payload === "object" &&
    !("success" in payload) &&
    "data" in payload
  ) {
    return {
      ok: true,
      data: normalizeUberDirectDelivery(
        (payload as { data: unknown }).data,
      ),
    };
  }

  const parsed = await parseDeliveryApiEnvelope<unknown>(
    envelopeResponse,
    fallbackMessage,
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: normalizeUberDirectDelivery(parsed.data) };
}

/** GET /workspaces/{workspaceId}/delivery-settings */
export async function getDeliverySettings(
  workspaceId: string,
  accessToken: string,
): Promise<DeliveryApiResult<DeliverySettings>> {
  let res: Response;
  try {
    res = await fetch(workspaceDeliverySettingsBase(workspaceId), {
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(deliveryNetworkError);
  }

  return parseDeliveryApiEnvelope<DeliverySettings>(
    res,
    "Delivery settings could not be loaded.",
  );
}

/** PUT /workspaces/{workspaceId}/delivery-settings */
export async function updateDeliverySettings(
  workspaceId: string,
  accessToken: string,
  body: UpdateDeliverySettingsBody,
): Promise<DeliveryApiResult<DeliverySettings>> {
  let res: Response;
  try {
    res = await fetch(workspaceDeliverySettingsBase(workspaceId), {
      method: "PUT",
      headers: authHeaders(accessToken, true),
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return networkFailure(deliveryNetworkError);
  }

  return parseDeliveryApiEnvelope<DeliverySettings>(
    res,
    "Delivery settings could not be saved.",
  );
}

/** POST /public/storefronts/{storeSlug}/checkout/delivery-options */
export async function getCustomerDeliveryOptions(
  storeSlug: string,
  input: CustomerDeliveryOptionsInput,
): Promise<DeliveryApiResult<CustomerDeliveryOptionsResponse>> {
  const url = `${getSmeApiBaseUrl()}/public/storefronts/${encodeURIComponent(storeSlug)}/checkout/delivery-options`;
  const { cartTotal, ...dropoffAddress } = input;
  const body = {
    ...dropoffAddress,
    manifestTotalValueCents: Math.round(cartTotal * 100),
  };
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: publicJsonHeaders(),
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return networkFailure(deliveryNetworkError);
  }

  const envelopeResponse = res.clone();
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return parseDeliveryApiEnvelope<CustomerDeliveryOptionsResponse>(
      envelopeResponse,
      "Delivery options could not be loaded.",
    );
  }

  if (
    res.ok &&
    payload &&
    typeof payload === "object" &&
    !("success" in payload) &&
    "data" in payload
  ) {
    return {
      ok: true,
      data: (payload as { data: CustomerDeliveryOptionsResponse }).data,
    };
  }

  return parseDeliveryApiEnvelope<CustomerDeliveryOptionsResponse>(
    envelopeResponse,
    "Delivery options could not be loaded.",
  );
}

/** POST /workspaces/{workspaceId}/delivery-settings/uber-direct/orders/{orderId}/book */
export async function bookUberDirectDelivery(
  workspaceId: string,
  orderId: string,
  quoteId: string,
  accessToken: string,
): Promise<DeliveryApiResult<UberDirectDelivery>> {
  const url = `${workspaceDeliverySettingsBase(workspaceId)}/uber-direct/orders/${encodeURIComponent(orderId)}/book?quoteId=${encodeURIComponent(quoteId)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(deliveryNetworkError);
  }

  const envelopeResponse = res.clone();
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return parseDeliveryApiEnvelope<UberDirectDelivery>(
      envelopeResponse,
      "Delivery could not be booked.",
    );
  }

  if (
    res.ok &&
    payload &&
    typeof payload === "object" &&
    !("success" in payload) &&
    "data" in payload
  ) {
    return {
      ok: true,
      data: normalizeUberDirectDelivery(
        (payload as { data: unknown }).data,
      ),
    };
  }

  const parsed = await parseDeliveryApiEnvelope<unknown>(
    envelopeResponse,
    "Delivery could not be booked.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: normalizeUberDirectDelivery(parsed.data) };
}

/** POST /workspaces/{workspaceId}/delivery-settings/uber-direct/orders/{orderId}/refresh-status */
export async function refreshUberDirectDeliveryStatus(
  workspaceId: string,
  orderId: string,
  accessToken: string,
): Promise<DeliveryApiResult<UberDirectDelivery>> {
  const url = `${workspaceDeliverySettingsBase(workspaceId)}/uber-direct/orders/${encodeURIComponent(orderId)}/refresh-status`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(deliveryNetworkError);
  }

  return parseUberDirectDeliveryResponse(
    res,
    "Delivery status could not be refreshed.",
  );
}