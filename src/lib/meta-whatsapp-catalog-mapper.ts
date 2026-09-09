import { buildPublicStoreUrl } from "@/apis/config";
import type { ProductApi } from "@/types/product";

export type MetaCatalogAvailability = "in stock" | "out of stock";

export type MetaCatalogProductPayload = {
  retailer_id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  image_url: string;
  url: string;
  availability: MetaCatalogAvailability;
  condition: "new";
  additional_image_link?: string[];
  brand?: string;
};

function formatMetaPrice(priceAmount: number, currency: string): string {
  const major = (priceAmount / 100).toFixed(2);
  return `${major} ${currency.trim().toUpperCase()}`;
}

function isPublicHttpsUrl(url: string | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Maps an active SME product to Meta Catalog `items_batch` data fields. */
export function productToMetaCatalogPayload(input: {
  product: ProductApi;
  storeSlug: string;
  storeName?: string;
}): MetaCatalogProductPayload | null {
  const { product, storeSlug, storeName } = input;
  if (product.status !== "active") return null;
  const imageUrl = product.imageUrl?.trim() ?? "";
  if (!isPublicHttpsUrl(imageUrl)) return null;

  const retailerId = product.sku.trim() || product.id;
  const storeRoot = buildPublicStoreUrl(storeSlug);
  const slug = product.slug.trim() || product.id;

  const gallery = (product.galleryUrls ?? []).filter(isPublicHttpsUrl);

  return {
    retailer_id: retailerId,
    name: product.title.trim().slice(0, 200),
    description: (product.summary ?? product.title).trim().slice(0, 9999),
    price: formatMetaPrice(product.priceAmount, product.currency || "ZAR"),
    currency: (product.currency || "ZAR").trim().toUpperCase(),
    image_url: imageUrl,
    url: `${storeRoot}/shop/${encodeURIComponent(slug)}`,
    availability: product.inStock === false ? "out of stock" : "in stock",
    condition: "new",
    ...(gallery.length ? { additional_image_link: gallery } : {}),
    ...(storeName?.trim() ? { brand: storeName.trim().slice(0, 100) } : {}),
  };
}
