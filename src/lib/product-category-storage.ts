import type { ProductCategory } from "@/types/product";

const STORAGE_PREFIX = "sme_product_categories_v1_";

function storageKey(workspaceId: string): string {
  return `${STORAGE_PREFIX}${workspaceId}`;
}

export function loadStoredProductCategories(
  workspaceId: string,
): ProductCategory[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(storageKey(workspaceId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isProductCategory);
  } catch {
    return [];
  }
}

export function storeProductCategory(
  workspaceId: string,
  name: string,
): ProductCategory | null {
  const trimmedName = name.trim();
  if (!trimmedName || typeof window === "undefined") return null;

  const categories = loadStoredProductCategories(workspaceId);
  const existing = categories.find(
    (category) => category.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  if (existing) return existing;

  const category: ProductCategory = {
    id: `offline-${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: trimmedName,
    slug: trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  };

  try {
    window.localStorage.setItem(
      storageKey(workspaceId),
      JSON.stringify([...categories, category]),
    );
  } catch {
    return null;
  }
  return category;
}

function isProductCategory(value: unknown): value is ProductCategory {
  if (!value || typeof value !== "object") return false;
  const category = value as Partial<ProductCategory>;
  return (
    typeof category.id === "string" &&
    typeof category.name === "string" &&
    typeof category.slug === "string"
  );
}
