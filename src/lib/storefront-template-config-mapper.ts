import { normalizeStorefrontConfigFromApi } from "@/lib/storefront-config-normalizer";
import { upgradeStorefrontConfig } from "@/lib/storefront-storage";
import type { StorefrontConfig, StorefrontTemplateId } from "@/types/storefront";

/** Maps backend `default_config` into a render-ready storefront config. */
export function templateDefaultConfigToStorefrontConfig(
  defaultConfig: Record<string, unknown>,
  templateId: string,
): StorefrontConfig {
  const normalized = normalizeStorefrontConfigFromApi(defaultConfig);
  return upgradeStorefrontConfig({
    ...normalized,
    templateId: (String(normalized.templateId || templateId) ||
      "classic-boutique") as StorefrontTemplateId,
    updatedAt: Date.now(),
  } as StorefrontConfig);
}

/** Maps draft/public API config into a render-ready storefront config. */
export function apiStorefrontConfigToStorefrontConfig(
  raw: Record<string, unknown>,
  meta: {
    templateId?: string;
    configVersion?: number;
    updatedAt?: number;
  } = {},
): StorefrontConfig {
  const normalized = normalizeStorefrontConfigFromApi({
    ...raw,
    templateId: raw.templateId ?? meta.templateId,
    configVersion: raw.configVersion ?? meta.configVersion,
  });
  return upgradeStorefrontConfig({
    ...normalized,
    updatedAt: meta.updatedAt ?? Date.now(),
  } as StorefrontConfig);
}
