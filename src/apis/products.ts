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
