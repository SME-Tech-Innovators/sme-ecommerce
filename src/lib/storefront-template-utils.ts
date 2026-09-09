import type { StorefrontTemplateId } from "@/types/storefront";

export type StorefrontLayoutVariant = "boutique" | "catalogue";

const CATALOGUE_TEMPLATE_IDS = new Set<StorefrontTemplateId>([
  "minimal-catalogue",
  "fresh-market",
]);

/** Product-first layouts (grid, “specials”, category chips). */
export function isCatalogueTemplate(
  templateId: StorefrontTemplateId | string | undefined,
): boolean {
  return CATALOGUE_TEMPLATE_IDS.has(
    (templateId ?? "classic-boutique") as StorefrontTemplateId,
  );
}

export function storefrontLayoutVariant(
  templateId: StorefrontTemplateId | string | undefined,
): StorefrontLayoutVariant {
  return isCatalogueTemplate(templateId) ? "catalogue" : "boutique";
}
