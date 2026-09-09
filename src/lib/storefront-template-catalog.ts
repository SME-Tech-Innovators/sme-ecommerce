import type { StorefrontTemplateId } from "@/types/storefront";

export type StorefrontTemplateCatalogEntry = {
  id: StorefrontTemplateId | string;
  name: string;
  description: string;
  /** Short label shown on the gallery card. */
  vibe: string;
  available: boolean;
  templateVersion: number;
  /** Hero / cover image for the gallery card. */
  previewImageUrl: string;
};

/**
 * Frontend template catalog until `GET /storefront-templates` ships.
 */
export const STOREFRONT_TEMPLATE_CATALOG: StorefrontTemplateCatalogEntry[] = [
  {
    id: "classic-boutique",
    name: "Classic Boutique",
    description:
      "Editorial homepage with hero, featured products, promos, and values — a polished retail layout from day one.",
    vibe: "Editorial retail",
    available: true,
    templateVersion: 1,
    previewImageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "minimal-catalogue",
    name: "Minimal Catalogue",
    description:
      "Product-first layout for any goods — groceries, hardware, beauty, electronics, gifts. Clear prices, honest stock.",
    vibe: "Multi-category shop",
    available: true,
    templateVersion: 1,
    previewImageUrl:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "fresh-market",
    name: "Fresh Market",
    description:
      "Warm, centred layout for spaza shops, grocers, and produce sellers — specials, categories, and stock-first copy.",
    vibe: "Groceries & produce",
    available: true,
    templateVersion: 1,
    previewImageUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "urban-edge",
    name: "Urban Edge",
    description:
      "Bold header bar and editorial hero for streetwear, sneakers, and urban retail brands.",
    vibe: "Street & lifestyle",
    available: true,
    templateVersion: 1,
    previewImageUrl:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80",
  },
];

export function getStorefrontTemplateCatalogEntry(
  id: string,
): StorefrontTemplateCatalogEntry | undefined {
  return STOREFRONT_TEMPLATE_CATALOG.find((t) => t.id === id);
}
