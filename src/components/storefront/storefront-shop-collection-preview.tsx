"use client";

import { useEffect, useMemo, useState } from "react";
import { ShopCollectionToolbar } from "@/components/storefront/shop-collection-toolbar";
import {
  StorefrontProductCard,
  shopProductBadges,
} from "@/components/storefront/storefront-product-card";
import { StorefrontTrustStrip } from "@/components/storefront/storefront-trust-strip";
import { StorefrontSiteFooter, StorefrontSiteHeader } from "@/components/storefront/storefront-chrome";
import { StorefrontThemeRoot } from "@/components/storefront/storefront-theme-root";
import { useProducts } from "@/hooks/use-products";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import {
  collectionPageSelectionId,
  resolveCollectionPage,
  resolveShopChrome,
  shopCollectionFromPageId,
} from "@/lib/storefront-collection-pages";
import { STOREFRONT_DEFAULT_MEDIA } from "@/lib/storefront-default-media";
import { isCatalogueTemplate } from "@/lib/storefront-template-utils";
import { productApiToCatalog } from "@/lib/product-mapper";
import type { ShopCollectionFilter } from "@/lib/preview-shop-href";
import type { CatalogProduct } from "@/types/catalog-product";
import type {
  StorefrontCollectionPageId,
  StorefrontConfig,
} from "@/types/storefront";

type StorefrontShopCollectionPreviewProps = {
  workspaceId: string;
  config: StorefrontConfig;
  pageId: StorefrontCollectionPageId;
  onSelectPage?: (pageId: string) => void;
};

export function StorefrontShopCollectionPreview({
  workspaceId,
  config,
  pageId,
  onSelectPage,
}: StorefrontShopCollectionPreviewProps) {
  const accessToken = getStoredAuthSession()?.accessToken ?? null;
  const collection = shopCollectionFromPageId(pageId);
  const [category, setCategory] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [committedQ, setCommittedQ] = useState("");

  useEffect(() => {
    setCategory("");
    setSearchDraft("");
    setCommittedQ("");
  }, [pageId]);

  const productsQuery = useProducts(workspaceId, accessToken, {
    page: 0,
    limit: 100,
    status: "active",
    ...(committedQ ? { search: committedQ } : {}),
    ...(collection === "sale" ? { onSale: true } : {}),
    sort: "newest",
  });

  const catalogQuery = useProducts(workspaceId, accessToken, {
    page: 0,
    limit: 100,
    status: "active",
    sort: "newest",
  });

  const products: CatalogProduct[] = useMemo(() => {
    let items = [...(productsQuery.data?.items ?? [])];
    if (collection === "sale") {
      items = items.filter(
        (item) =>
          item.onSale ||
          (item.compareAtPriceAmount != null &&
            item.compareAtPriceAmount > item.priceAmount),
      );
    }
    if (category) {
      const needle = category.toLowerCase();
      items = items.filter((item) => {
        const slug = item.category?.slug?.toLowerCase() ?? "";
        const name = item.category?.name?.toLowerCase() ?? "";
        const id = item.category?.id?.toLowerCase() ?? "";
        return slug === needle || name === needle || id === needle;
      });
    }
    return items
      .map(productApiToCatalog)
      .filter((p) => p.status !== "archived");
  }, [productsQuery.data, collection, category]);

  const categories = useMemo(() => {
    const map = new Map<string, { name: string; slug: string }>();
    for (const item of catalogQuery.data?.items ?? []) {
      const cat = item.category;
      if (!cat?.name?.trim()) continue;
      const slug = cat.slug?.trim() || cat.id || cat.name;
      if (map.has(slug)) continue;
      map.set(slug, { name: cat.name, slug });
    }
    return [...map.values()];
  }, [catalogQuery.data]);

  const page = resolveCollectionPage(config.collectionPages, pageId);
  const chrome = resolveShopChrome(page.chrome);
  const storeName = config.shopName?.trim() || "Shop";
  const bannerImage =
    page.imageUrl.trim() ||
    (collection === "sale"
      ? STOREFRONT_DEFAULT_MEDIA.saleBanner
      : STOREFRONT_DEFAULT_MEDIA.promo[0]);

  function handleNavigate(next: {
    collection: ShopCollectionFilter;
    category?: string;
    q?: string;
  }) {
    const nextPageId =
      next.collection === "new" || next.collection === "sale"
        ? next.collection
        : "shop";
    if (nextPageId !== pageId) {
      onSelectPage?.(collectionPageSelectionId(nextPageId));
    }
    setCategory(next.category?.trim() ?? "");
    if (next.q !== undefined) {
      setSearchDraft(next.q);
      setCommittedQ(next.q.trim());
    }
  }

  return (
    <StorefrontThemeRoot config={config}>
      <div className="@container/storefront min-h-full bg-[color:var(--sf-page-bg)]">
        <section className="relative min-h-[12rem] overflow-hidden @sm/storefront:min-h-[14rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/20" />
          <div className="relative z-10 mx-auto flex min-h-[12rem] max-w-[100%] flex-col justify-end px-4 py-8 @sm/storefront:min-h-[14rem] @sm/storefront:px-8">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
              {page.eyebrow}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-light text-white @sm/storefront:text-4xl">
              {page.title.trim() || storeName}
            </h1>
            {page.description.trim() ? (
              <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-white/85">
                {page.description}
              </p>
            ) : null}
          </div>
        </section>

        <StorefrontTrustStrip templateId={config.templateId} />

        <main className="mx-auto max-w-[100%] px-4 py-8 @sm/storefront:px-8 @sm/storefront:py-10">
          <ShopCollectionToolbar
            basePath={`/preview/${workspaceId}`}
            collection={collection}
            category={category}
            q={searchDraft}
            categories={categories}
            resultCount={products.length}
            chrome={chrome}
            templateId={config.templateId}
            onSearchChange={setSearchDraft}
            onSearchSubmit={() => setCommittedQ(searchDraft.trim())}
            onNavigate={handleNavigate}
          />

          {productsQuery.isLoading ? (
            <p className="mt-10 font-sans text-sm text-[color:var(--sf-accent-text-55)]">
              Loading products…
            </p>
          ) : productsQuery.isError ? (
            <p className="mt-10 font-sans text-sm text-[color:var(--sf-accent-text-55)]">
              Could not load products. Check your connection and try again.
            </p>
          ) : products.length === 0 ? (
            <p className="mt-10 font-sans text-sm text-[color:var(--sf-accent-text-55)]">
              No products match. Add products under Products or clear filters.
            </p>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-4 @md/storefront:grid-cols-3 @md/storefront:gap-6 @xl/storefront:grid-cols-4">
              {products.map((p) => (
                <li key={p.id}>
                  <StorefrontProductCard
                    title={p.title}
                    priceLabel={p.priceLabel}
                    compareAtPriceLabel={p.compareAtPriceLabel}
                    imageUrl={p.imageUrl}
                    category={p.category}
                    variant={
                      isCatalogueTemplate(config.templateId)
                        ? "catalogue"
                        : "default"
                    }
                    badges={shopProductBadges({
                      collection,
                      onSale: p.onSale,
                      compareAtPriceLabel: p.compareAtPriceLabel,
                      inStock: p.inStock,
                    })}
                    href={`/preview/${workspaceId}/shop/${p.id}`}
                    showUploadHint
                    ctaLabel="View"
                  />
                </li>
              ))}
            </ul>
          )}
        </main>

        <StorefrontSiteFooter
          config={config}
          workspaceId={workspaceId}
          basePath={`/preview/${workspaceId}`}
        />
      </div>
    </StorefrontThemeRoot>
  );
}
