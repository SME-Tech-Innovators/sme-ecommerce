import { getSmeApiBaseUrl } from "@/apis/config";
import { networkFailure, parseApiEnvelope } from "@/apis/api-result";
import { asProductApi, asProductCategory } from "@/lib/product-mapper";
import type {
  CategoriesResult,
  CreateProductBody,
  ListProductsParams,
  ProductApi,
  ProductCategory,
  ProductPage,
  ProductResult,
  ProductsPageResult,
  UpdateProductBody,
} from "@/types/product";

const DEMO_ACCESS_TOKEN = "demo-local-token";
const DEMO_PRODUCTS: ProductApi[] = [
  {
    id: "demo-product-1",
    workspaceId: "demo-workspace-456",
    title: "Classic Tee",
    slug: "classic-tee",
    sku: "CT-001",
    priceAmount: 3699,
    compareAtPriceAmount: 4499,
    currency: "ZAR",
    priceLabel: "R 36.99",
    compareAtPriceLabel: "R 44.99",
    onSale: true,
    quantityAvailable: 12,
    inStock: true,
    category: { id: "demo-cat-apparel", name: "Apparel", slug: "apparel" },
    status: "ACTIVE",
    mainImageId: null,
    imageUrl: null,
    summary: "Everyday cotton tee for the local demo storefront.",
    galleryMediaIds: null,
    galleryUrls: null,
    configurationLabel: null,
    warrantyNote: null,
    shippingNote: null,
    metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-product-2",
    workspaceId: "demo-workspace-456",
    title: "Travel Mug",
    slug: "travel-mug",
    sku: "TM-002",
    priceAmount: 2499,
    compareAtPriceAmount: null,
    currency: "ZAR",
    priceLabel: "R 24.99",
    compareAtPriceLabel: null,
    onSale: false,
    quantityAvailable: 8,
    inStock: true,
    category: { id: "demo-cat-home", name: "Home", slug: "home" },
    status: "ACTIVE",
    mainImageId: null,
    imageUrl: null,
    summary: "Insulated mug designed for commuters and daily essentials.",
    galleryMediaIds: null,
    galleryUrls: null,
    configurationLabel: null,
    warrantyNote: null,
    shippingNote: null,
    metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEMO_CATEGORIES: ProductCategory[] = [
  { id: "demo-cat-hair", name: "Hair", slug: "hair" },
  { id: "demo-cat-food", name: "Food", slug: "food" },
  { id: "demo-cat-clothing", name: "Clothing", slug: "clothing" },
  { id: "demo-cat-toys", name: "Toy", slug: "toy" },
  { id: "demo-cat-beauty", name: "Beauty", slug: "beauty" },
  { id: "demo-cat-home", name: "Home", slug: "home" },
  { id: "demo-cat-electronics", name: "Electronics", slug: "electronics" },
  { id: "demo-cat-health", name: "Health", slug: "health" },
  { id: "demo-cat-furniture", name: "Furniture", slug: "furniture" },
  { id: "demo-cat-books", name: "Books", slug: "books" },
  { id: "demo-cat-sports", name: "Sports", slug: "sports" },
  { id: "demo-cat-pets", name: "Pets", slug: "pets" },
  { id: "demo-cat-jewelry", name: "Jewelry", slug: "jewelry" },
  { id: "demo-cat-kids", name: "Kids", slug: "kids" },
  { id: "demo-cat-accessories", name: "Accessories", slug: "accessories" },
];

function isDemoAccessToken(accessToken: string): boolean {
  return accessToken === DEMO_ACCESS_TOKEN;
}

function asPage(raw: ProductPage): ProductPage {
  return {
    items: Array.isArray(raw.items) ? raw.items.map(asProductApi) : [],
    page: Number(raw.page ?? 0),
    limit: Number(raw.limit ?? 20),
    totalItems: Number(raw.totalItems ?? 0),
    totalPages: Number(raw.totalPages ?? 0),
  };
}

function authHeaders(accessToken: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

/** GET /workspaces/{workspaceId}/products */
export async function listProducts(
  workspaceId: string,
  accessToken: string,
  params: ListProductsParams = {},
): Promise<ProductsPageResult> {
  if (isDemoAccessToken(accessToken)) {
    const items = DEMO_PRODUCTS.filter((product) => {
      if (params.status && product.status.toString().toUpperCase() !== params.status.toUpperCase()) {
        return false;
      }
      if (params.categoryId && product.category?.id !== params.categoryId) {
        return false;
      }
      if (params.search?.trim()) {
        const search = params.search.trim().toLowerCase();
        if (
          !product.title.toLowerCase().includes(search) &&
          !(product.summary ?? "").toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      if (params.onSale !== undefined && product.onSale !== params.onSale) {
        return false;
      }
      if (params.inStock !== undefined && product.inStock !== params.inStock) {
        return false;
      }
      return true;
    });

    return {
      ok: true,
      data: {
        items,
        page: Number(params.page ?? 0),
        limit: Number(params.limit ?? 50),
        totalItems: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / (params.limit ?? 50)) || 1),
      },
    };
  }

  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status.toUpperCase());
  if (params.categoryId) qs.set("categoryId", params.categoryId);
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.onSale === true) qs.set("onSale", "true");
  if (params.onSale === false) qs.set("onSale", "false");
  if (params.inStock === true) qs.set("inStock", "true");
  if (params.inStock === false) qs.set("inStock", "false");
  if (params.sort) qs.set("sort", params.sort);
  qs.set("page", String(params.page ?? 0));
  qs.set("limit", String(params.limit ?? 50));

  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/products?${qs}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not load products. Check your connection and try again.",
    );
  }

  const parsed = await parseApiEnvelope<ProductPage>(
    res,
    "Products could not be loaded.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asPage(parsed.data) };
}

/** POST /workspaces/{workspaceId}/products */
export async function createProduct(
  workspaceId: string,
  accessToken: string,
  body: CreateProductBody,
): Promise<ProductResult> {
  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/products`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: authHeaders(accessToken, true),
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not create the product. Check your connection and try again.",
    );
  }

  const parsed = await parseApiEnvelope<ProductApi>(
    res,
    "Product could not be created.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asProductApi(parsed.data) };
}

/** GET /workspaces/{workspaceId}/products/{productId} */
export async function getProduct(
  workspaceId: string,
  productId: string,
  accessToken: string,
): Promise<ProductResult> {
  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/products/${encodeURIComponent(productId)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not load this product. Check your connection and try again.",
    );
  }

  const parsed = await parseApiEnvelope<ProductApi>(
    res,
    "Product could not be loaded.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asProductApi(parsed.data) };
}

/** PATCH /workspaces/{workspaceId}/products/{productId} */
export async function updateProduct(
  workspaceId: string,
  productId: string,
  accessToken: string,
  body: UpdateProductBody,
): Promise<ProductResult> {
  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/products/${encodeURIComponent(productId)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: authHeaders(accessToken, true),
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not update the product. Check your connection and try again.",
    );
  }

  const parsed = await parseApiEnvelope<ProductApi>(
    res,
    "Product could not be updated.",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asProductApi(parsed.data) };
}

async function postProductStatus(
  workspaceId: string,
  productId: string,
  accessToken: string,
  action: "archive" | "publish" | "draft",
): Promise<ProductResult> {
  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/products/${encodeURIComponent(productId)}/${action}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      `Could not ${action} the product. Check your connection and try again.`,
    );
  }

  const parsed = await parseApiEnvelope<ProductApi>(
    res,
    `Product could not be moved to ${action}.`,
  );
  if (!parsed.ok) return parsed;
  return { ok: true, data: asProductApi(parsed.data) };
}

export function archiveProduct(
  workspaceId: string,
  productId: string,
  accessToken: string,
): Promise<ProductResult> {
  return postProductStatus(workspaceId, productId, accessToken, "archive");
}

export function publishProduct(
  workspaceId: string,
  productId: string,
  accessToken: string,
): Promise<ProductResult> {
  return postProductStatus(workspaceId, productId, accessToken, "publish");
}

export function draftProduct(
  workspaceId: string,
  productId: string,
  accessToken: string,
): Promise<ProductResult> {
  return postProductStatus(workspaceId, productId, accessToken, "draft");
}

/** GET /workspaces/{workspaceId}/categories */
export async function listCategories(
  workspaceId: string,
  accessToken: string,
): Promise<CategoriesResult> {
  if (isDemoAccessToken(accessToken)) {
    return {
      ok: true,
      data: DEMO_CATEGORIES,
    };
  }

  const url = `${getSmeApiBaseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/categories`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
  } catch {
    return networkFailure(
      "Could not load categories. Check your connection and try again.",
    );
  }

  const parsed = await parseApiEnvelope<ProductCategory[]>(
    res,
    "Categories could not be loaded.",
  );
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    data: parsed.data.map(asProductCategory),
  };
}
