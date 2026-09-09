import { apiStorefrontConfigToStorefrontConfig } from "@/lib/storefront-template-config-mapper";
import type { PublicStorefront } from "@/types/public-storefront";
import type { StorefrontSection } from "@/types/storefront";
import type { StorefrontConfig } from "@/types/storefront";

function parseUpdatedAt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const ms = Date.parse(value);
    if (!Number.isNaN(ms)) return ms;
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d, h = 0, min = 0, s = 0] = value.map(Number);
    const ms = Date.UTC(y, (m || 1) - 1, d || 1, h, min, s);
    if (!Number.isNaN(ms)) return ms;
  }
  return Date.now();
}

function normalizePublicHomeSections(
  rawSections: unknown,
): StorefrontSection[] | undefined {
  if (!Array.isArray(rawSections)) return undefined;
  const sections = rawSections as StorefrontSection[];
  const heroIndex = sections.findIndex(
    (section) =>
      section &&
      typeof section === "object" &&
      "type" in section &&
      section.type === "hero",
  );
  if (heroIndex <= 0) return sections;

  const hero = sections[heroIndex];
  return [
    hero,
    ...sections.slice(0, heroIndex),
    ...sections.slice(heroIndex + 1),
  ];
}

/** Maps a published public storefront payload into `StorefrontConfig`. */
export function publicStorefrontToConfig(
  storefront: PublicStorefront,
): StorefrontConfig {
  const raw = { ...(storefront.config ?? {}) };
  const rawSections = normalizePublicHomeSections(raw.sections);
  if (rawSections) {
    raw.sections = rawSections;
  }
  if (!raw.shopName && storefront.storeName) {
    raw.shopName = storefront.storeName;
  }
  return apiStorefrontConfigToStorefrontConfig(raw, {
    templateId: storefront.templateId,
    configVersion: storefront.configVersion,
    updatedAt: parseUpdatedAt(raw.updatedAt ?? storefront.publishedAt),
  });
}
