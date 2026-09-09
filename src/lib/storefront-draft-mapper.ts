import { apiStorefrontConfigToStorefrontConfig } from "@/lib/storefront-template-config-mapper";
import type { StorefrontConfig } from "@/types/storefront";
import type { StorefrontDraft, UpdateStorefrontDraftBody } from "@/types/workspace";

function parseUpdatedAt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const ms = Date.parse(value);
    if (!Number.isNaN(ms)) return ms;
  }
  // Jackson sometimes serializes LocalDateTime as [y,m,d,h,min,s,nano]
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d, h = 0, min = 0, s = 0] = value.map(Number);
    const ms = Date.UTC(y, (m || 1) - 1, d || 1, h, min, s);
    if (!Number.isNaN(ms)) return ms;
  }
  return Date.now();
}

/**
 * Maps a backend draft payload into the frontend `StorefrontConfig` shape.
 * Runs `upgradeStorefrontConfig` so older/simpler backend seeds still render.
 */
export function storefrontDraftToConfig(draft: StorefrontDraft): StorefrontConfig {
  const raw = draft.config ?? {};
  return apiStorefrontConfigToStorefrontConfig(raw, {
    templateId: draft.templateId,
    configVersion: draft.configVersion,
    updatedAt: parseUpdatedAt(raw.updatedAt ?? draft.updatedAt),
  });
}

/** Builds the PUT body expected by Step 01 `UpdateStorefrontDraftRequest`. */
export function configToUpdateDraftBody(
  config: StorefrontConfig,
  templateVersion: number,
): UpdateStorefrontDraftBody {
  const { updatedAt: _updatedAt, ...rest } = config;
  return {
    templateId: config.templateId,
    templateVersion,
    configVersion: config.configVersion,
    config: {
      ...rest,
      templateId: config.templateId,
      configVersion: config.configVersion,
      updatedAt: Date.now(),
    },
  };
}
