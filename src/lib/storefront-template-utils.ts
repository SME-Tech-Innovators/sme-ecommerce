import type { StorefrontTemplateId } from "@/types/storefront";

export type StorefrontLayoutVariant = "boutique" | "catalogue" | "atelier";

const CATALOGUE_TEMPLATE_IDS = new Set<StorefrontTemplateId>([
  "minimal-catalogue",
]);

const ATELIER_TEMPLATE_IDS = new Set<StorefrontTemplateId>(["artisan-atelier"]);

/** Product-first layouts (grid, “specials”, category chips). */
export function isCatalogueTemplate(
  templateId: StorefrontTemplateId | string | undefined,
): boolean {
  return CATALOGUE_TEMPLATE_IDS.has(
    (templateId ?? "classic-boutique") as StorefrontTemplateId,
  );
}

/** Editorial centred layout with custom section chrome. */
export function isArtisanAtelierTemplate(
  templateId: StorefrontTemplateId | string | undefined,
): boolean {
  return ATELIER_TEMPLATE_IDS.has(
    (templateId ?? "classic-boutique") as StorefrontTemplateId,
  );
}

export function storefrontLayoutVariant(
  templateId: StorefrontTemplateId | string | undefined,
): StorefrontLayoutVariant {
  if (isArtisanAtelierTemplate(templateId)) return "atelier";
  if (isCatalogueTemplate(templateId)) return "catalogue";
  return "boutique";
}
