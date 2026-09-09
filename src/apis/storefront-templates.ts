import { getSmeApiBaseUrl } from "@/apis/config";
import { networkFailure, parseApiEnvelope } from "@/apis/api-result";
import type {
  StorefrontTemplateListItem,
  StorefrontTemplateVersionPayload,
} from "@/types/storefront-template-api";

export type StorefrontTemplatesListResult =
  | { ok: true; data: StorefrontTemplateListItem[] }
  | { ok: false; errorMessage: string };

export type StorefrontTemplateVersionResult =
  | { ok: true; data: StorefrontTemplateVersionPayload }
  | { ok: false; errorMessage: string };

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((item): item is string => typeof item === "string");
}

function asTemplateListItem(raw: unknown): StorefrontTemplateListItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = str(o.id);
  if (!id) return null;
  const defaultConfig =
    o.defaultConfig && typeof o.defaultConfig === "object"
      ? (o.defaultConfig as Record<string, unknown>)
      : o.default_config && typeof o.default_config === "object"
        ? (o.default_config as Record<string, unknown>)
        : undefined;

  return {
    id,
    name: str(o.name, id),
    description: str(o.description),
    vibe: str(o.vibe),
    status: str(o.status, "available"),
    latestVersion: num(o.latestVersion ?? o.templateVersion, 1),
    previewImageUrl: str(o.previewImageUrl ?? o.preview_image_url),
    supportedThemeIds: strArray(o.supportedThemeIds ?? o.supported_theme_ids),
    defaultConfig,
  };
}

function asTemplateVersion(raw: unknown): StorefrontTemplateVersionPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const templateId = str(o.templateId ?? o.template_id);
  const version = num(o.version ?? o.templateVersion ?? o.template_version, 1);
  const defaultConfig =
    o.defaultConfig && typeof o.defaultConfig === "object"
      ? (o.defaultConfig as Record<string, unknown>)
      : o.default_config && typeof o.default_config === "object"
        ? (o.default_config as Record<string, unknown>)
        : null;
  if (!templateId || !defaultConfig) return null;
  return { templateId, version, defaultConfig };
}

function authHeaders(accessToken?: string): HeadersInit {
  const headers: HeadersInit = { Accept: "application/json" };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

/** GET /storefront-templates — requires merchant auth. */
export async function getStorefrontTemplates(
  accessToken: string,
): Promise<StorefrontTemplatesListResult> {
  if (!accessToken.trim()) {
    return {
      ok: false,
      errorMessage: "Sign in to load storefront templates.",
    };
  }
  const url = `${getSmeApiBaseUrl()}/storefront-templates`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not load storefront templates. Check your connection and try again.",
    );
  }

  const parsed = await parseApiEnvelope<unknown[]>(
    res,
    "Storefront templates could not be loaded.",
  );
  if (!parsed.ok) return parsed;
  const data = (Array.isArray(parsed.data) ? parsed.data : [])
    .map(asTemplateListItem)
    .filter((item): item is StorefrontTemplateListItem => item != null)
    .filter((item) => item.status === "available");
  return { ok: true, data };
}

/** GET /storefront-templates/{templateId}/versions/{version} */
export async function getStorefrontTemplateVersion(
  templateId: string,
  version: number,
  accessToken?: string,
): Promise<StorefrontTemplateVersionResult> {
  const url = `${getSmeApiBaseUrl()}/storefront-templates/${encodeURIComponent(templateId)}/versions/${encodeURIComponent(String(version))}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not load the template preview. Check your connection and try again.",
    );
  }

  const parsed = await parseApiEnvelope<unknown>(
    res,
    "Template version could not be loaded.",
  );
  if (!parsed.ok) return parsed;
  const data = asTemplateVersion(parsed.data);
  if (!data) {
    return {
      ok: false,
      errorMessage: "Template version response was missing default config.",
    };
  }
  return { ok: true, data };
}
