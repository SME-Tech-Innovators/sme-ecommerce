import { isCatalogueTemplate } from "@/lib/storefront-template-utils";
import type { StorefrontTemplateId } from "@/types/storefront";
import type { ShopCollectionFilter } from "@/lib/preview-shop-href";
import type { StorefrontProductBadge } from "@/components/storefront/storefront-product-card";

/** Customer-facing shop filter copy — catalogue tone avoids fashion “collections”. */
export type ShopCollectionCopy = {
  tabAll: string;
  tabNew: string;
  tabSale: string;
  titleAll: string;
  titleNew: string;
  titleSale: string;
  filtersAriaLabel: string;
  allCategories: string;
};

const BOUTIQUE_COPY: ShopCollectionCopy = {
  tabAll: "All",
  tabNew: "New arrivals",
  tabSale: "Sale",
  titleAll: "All products",
  titleNew: "New arrivals",
  titleSale: "Sale",
  filtersAriaLabel: "Collections",
  allCategories: "All categories",
};

const CATALOGUE_COPY: ShopCollectionCopy = {
  tabAll: "All products",
  tabNew: "Just in",
  tabSale: "Specials",
  titleAll: "All products",
  titleNew: "Just in",
  titleSale: "Specials",
  filtersAriaLabel: "Product filters",
  allCategories: "All categories",
};

export function shopCollectionCopyForTemplate(
  templateId: StorefrontTemplateId | string | undefined,
): ShopCollectionCopy {
  return isCatalogueTemplate(templateId) ? CATALOGUE_COPY : BOUTIQUE_COPY;
}

export function shopToolbarTitle(
  copy: ShopCollectionCopy,
  collection: ShopCollectionFilter,
  category: string,
  categoryName?: string,
): string {
  if (collection === "sale") return copy.titleSale;
  if (collection === "new") return copy.titleNew;
  if (category) return categoryName || category;
  return copy.titleAll;
}

/** Badge labels for product cards by template tone. */
export function productBadgeLabel(
  badge: StorefrontProductBadge,
  templateId: StorefrontTemplateId | string | undefined,
): string {
  if (!isCatalogueTemplate(templateId)) return badge;
  switch (badge) {
    case "Sale":
      return "Special";
    case "New":
      return "Just in";
    case "Sold out":
      return "Out of stock";
    default:
      return badge;
  }
}
