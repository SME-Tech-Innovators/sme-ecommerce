import type { StorefrontLink } from "@/types/storefront";

/**
 * Magic `href` on a storefront link (e.g. hero primary CTA) that resolves to
 * the shop collection when a storefront base path is known.
 */
export const PREVIEW_SHOP_COLLECTION_HREF = "@shop";
export const PREVIEW_SHOP_SALE_HREF = "@shop/sale";
export const PREVIEW_SHOP_NEW_HREF = "@shop/new";
export const PREVIEW_SHOP_CATEGORY_HREF_PREFIX = "@shop/category:";
export const PREVIEW_CUSTOM_PAGE_HREF_PREFIX = "@page:";
export const PREVIEW_ORDERS_TRACK_HREF = "@orders/track";

/** Keep order management reachable in every storefront navigation. */
export function withManageOrderLink(links: StorefrontLink[], basePath?: string): StorefrontLink[] {
  const manageLink = { label: "Manage order", href: PREVIEW_ORDERS_TRACK_HREF };
  const target = resolveStorefrontHref(manageLink, basePath);
  if (links.some((link) => resolveStorefrontHref(link, basePath) === target)) {
    return links.map((link) => resolveStorefrontHref(link, basePath) === target
      ? { ...link, label: manageLink.label } : link);
  }
  return [...links, manageLink];
}

/** Default hero label that pairs with legacy `#` hrefs from older drafts. */
const SHOP_COLLECTION_LABEL = "shop collection";

export type ShopCollectionFilter = "all" | "sale" | "new";

export type ShopQueryState = {
  collection: ShopCollectionFilter;
  category: string;
  q: string;
};

export function parseShopCollection(
  value: string | null | undefined,
): ShopCollectionFilter {
  if (value === "sale" || value === "new") return value;
  return "all";
}

/** Builds `/…/shop?collection=&category=&q=` against a storefront base path. */
export function buildShopHref(
  basePath: string | undefined,
  query: Partial<ShopQueryState> = {},
): string {
  const root = (basePath ?? "").replace(/\/$/, "");
  const path = root ? `${root}/shop` : "/shop";
  const params = new URLSearchParams();
  const collection = query.collection ?? "all";
  if (collection !== "all") params.set("collection", collection);
  if (query.category?.trim()) params.set("category", query.category.trim());
  if (query.q?.trim()) params.set("q", query.q.trim());
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * Resolves magic storefront hrefs against a base path.
 * Examples: `/preview/{workspaceId}` or `/s/{storeSlug}`.
 */
export function resolveStorefrontHref(
  link: StorefrontLink,
  basePath?: string,
): string {
  if (!basePath) return link.href;
  const root = basePath.replace(/\/$/, "");
  const label = link.label.trim().toLowerCase();
  const href = link.href.trim();

  if (
    href === PREVIEW_SHOP_COLLECTION_HREF ||
    (href === "#" && label === SHOP_COLLECTION_LABEL)
  ) {
    return buildShopHref(root);
  }
  if (href === PREVIEW_SHOP_SALE_HREF) {
    return buildShopHref(root, { collection: "sale" });
  }
  if (href === PREVIEW_SHOP_NEW_HREF) {
    return buildShopHref(root, { collection: "new" });
  }
  if (href.startsWith(PREVIEW_SHOP_CATEGORY_HREF_PREFIX)) {
    const category = href.slice(PREVIEW_SHOP_CATEGORY_HREF_PREFIX.length);
    return buildShopHref(root, { category });
  }
  if (href.startsWith(PREVIEW_CUSTOM_PAGE_HREF_PREFIX)) {
    const slug = href.slice(PREVIEW_CUSTOM_PAGE_HREF_PREFIX.length);
    if (slug.trim()) return `${root}/${slug}`;
  }
  if (href === PREVIEW_ORDERS_TRACK_HREF) {
    return `${root}/orders/track`;
  }
  return link.href;
}

/** @deprecated Prefer `resolveStorefrontHref` with an explicit base path. */
export function resolvePreviewShopCollectionHref(
  link: StorefrontLink,
  workspaceId: string | undefined,
): string {
  return resolveStorefrontHref(
    link,
    workspaceId ? `/preview/${workspaceId}` : undefined,
  );
}

export function previewStorefrontBasePath(workspaceId: string): string {
  return `/preview/${workspaceId}`;
}

export function publicStorefrontBasePath(storeSlug: string): string {
  return `/s/${storeSlug}`;
}

function shopCollectionFromSearch(
  search: string | URLSearchParams | null | undefined,
): ShopCollectionFilter {
  if (!search) return "all";
  const params =
    typeof search === "string"
      ? new URLSearchParams(
          search.startsWith("?") ? search.slice(1) : search,
        )
      : search;
  return parseShopCollection(params.get("collection"));
}

/**
 * Active state for storefront nav links that share `/shop` but differ by
 * `?collection=` (All / New / Sale).
 */
export function isStorefrontNavLinkActive(
  resolvedHref: string,
  pathname: string,
  search: string | URLSearchParams | null | undefined,
): boolean {
  if (!pathname) return false;

  const [hrefPathRaw, hrefQuery = ""] = resolvedHref.split("?");
  const hrefPath = hrefPathRaw.replace(/\/$/, "") || "/";
  const currentPath = pathname.replace(/\/$/, "") || "/";
  const hrefCollection = shopCollectionFromSearch(hrefQuery);
  const currentCollection = shopCollectionFromSearch(search);

  const isShopIndex =
    hrefPath.endsWith("/shop") || hrefPath === "/shop";

  // Product detail under /shop/{id}: only the plain Shop (all) link is active.
  if (isShopIndex && currentPath.startsWith(hrefPath + "/")) {
    return hrefCollection === "all";
  }

  if (currentPath !== hrefPath) {
    // Non-shop prefix match (e.g. custom pages).
    if (
      !isShopIndex &&
      hrefPath !== "/" &&
      currentPath.startsWith(hrefPath + "/")
    ) {
      return true;
    }
    return false;
  }

  if (isShopIndex) {
    return hrefCollection === currentCollection;
  }

  return true;
}
