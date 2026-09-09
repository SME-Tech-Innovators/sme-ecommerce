import { getSmeApiBaseUrl } from "@/apis/config";
import { networkFailure, parseApiEnvelope } from "@/apis/api-result";
import type {
  UpdateWhatsAppIntegrationBody,
  WhatsAppIntegration,
  WhatsAppSyncResult,
  WhatsAppSyncStatus,
  WhatsAppIntegrationStatus,
} from "@/types/whatsapp-integration";

export type WhatsAppIntegrationResult =
  | { ok: true; data: WhatsAppIntegration }
  | { ok: false; errorMessage: string };

export type WhatsAppSyncResultResponse =
  | { ok: true; data: WhatsAppSyncResult }
  | { ok: false; errorMessage: string };

function authHeaders(accessToken: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

function asStatus(raw: unknown): WhatsAppIntegrationStatus {
  const value = String(raw ?? "not_connected").toLowerCase();
  if (value === "connected" || value === "error") return value;
  return "not_connected";
}

function asSyncStatus(raw: unknown): WhatsAppSyncStatus {
  const value = String(raw ?? "idle").toLowerCase();
  if (
    value === "running" ||
    value === "success" ||
    value === "partial" ||
    value === "failed"
  ) {
    return value;
  }
  return "idle";
}

function asSummary(raw: unknown): WhatsAppIntegration["lastSyncSummary"] {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    synced: Number(o.synced ?? 0),
    skipped: Number(o.skipped ?? 0),
    failed: Number(o.failed ?? 0),
  };
}

function asIntegration(raw: WhatsAppIntegration): WhatsAppIntegration {
  return {
    status: asStatus(raw.status),
    metaCatalogId:
      raw.metaCatalogId == null ? null : String(raw.metaCatalogId),
    metaWabaId: raw.metaWabaId == null ? null : String(raw.metaWabaId),
    hasAccessToken: Boolean(raw.hasAccessToken),
    lastSyncAt: raw.lastSyncAt == null ? null : String(raw.lastSyncAt),
    lastSyncStatus: asSyncStatus(raw.lastSyncStatus),
    lastSyncSummary: asSummary(raw.lastSyncSummary),
    lastError: raw.lastError == null ? null : String(raw.lastError),
  };
}

function asSyncResult(raw: WhatsAppSyncResult): WhatsAppSyncResult {
  const errors = Array.isArray(raw.errors)
    ? raw.errors.map((item) => ({
        productId: String(item.productId ?? ""),
        title: String(item.title ?? ""),
        message: String(item.message ?? ""),
      }))
    : [];
  return {
    lastSyncStatus: asSyncStatus(raw.lastSyncStatus),
    lastSyncSummary: asSummary(raw.lastSyncSummary) ?? {
      synced: 0,
      skipped: 0,
      failed: 0,
    },
    errors,
  };
}

/** GET /workspaces/{workspaceId}/integrations/whatsapp */
export async function getWhatsAppIntegration(
  workspaceId: string,
  accessToken: string,
): Promise<WhatsAppIntegrationResult> {
  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/integrations/whatsapp`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not load WhatsApp integration. Check your connection and try again.",
    );
  }

  const parsed = await parseApiEnvelope<WhatsAppIntegration>(
    res,
    "WhatsApp integration could not be loaded.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asIntegration(parsed.data) };
}

/** PUT /workspaces/{workspaceId}/integrations/whatsapp */
export async function updateWhatsAppIntegration(
  workspaceId: string,
  accessToken: string,
  body: UpdateWhatsAppIntegrationBody,
): Promise<WhatsAppIntegrationResult> {
  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/integrations/whatsapp`;
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
      "Could not save WhatsApp settings. Check your connection and try again.",
    );
  }

  const parsed = await parseApiEnvelope<WhatsAppIntegration>(
    res,
    "WhatsApp settings could not be saved.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asIntegration(parsed.data) };
}

/** DELETE /workspaces/{workspaceId}/integrations/whatsapp */
export async function disconnectWhatsAppIntegration(
  workspaceId: string,
  accessToken: string,
): Promise<WhatsAppIntegrationResult> {
  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/integrations/whatsapp`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "DELETE",
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not disconnect WhatsApp. Check your connection and try again.",
    );
  }

  const parsed = await parseApiEnvelope<WhatsAppIntegration>(
    res,
    "WhatsApp could not be disconnected.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asIntegration(parsed.data) };
}

/** POST /workspaces/{workspaceId}/integrations/whatsapp/sync */
export async function syncWhatsAppCatalog(
  workspaceId: string,
  accessToken: string,
): Promise<WhatsAppSyncResultResponse> {
  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/integrations/whatsapp/sync`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not sync the WhatsApp catalog. Check your connection and try again.",
    );
  }

  const parsed = await parseApiEnvelope<WhatsAppSyncResult>(
    res,
    "WhatsApp catalog sync failed.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asSyncResult(parsed.data) };
}
