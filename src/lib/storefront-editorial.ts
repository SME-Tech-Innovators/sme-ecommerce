import type { StorefrontEditorialSettings } from "@/types/storefront";

/** Validate persisted drafts and give older configurations stable defaults. */
export function normalizeEditorialSettings(
  value: unknown,
): StorefrontEditorialSettings {
  const raw =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
    heroLayout: raw.heroLayout === "cover" ? "cover" : "split",
    spacing: raw.spacing === "compact" ? "compact" : "airy",
    imageRatio: raw.imageRatio === "square" ? "square" : "portrait",
    editionLabel:
      typeof raw.editionLabel === "string"
        ? raw.editionLabel.slice(0, 120)
        : "The considered wardrobe",
  };
}
