"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePreviewCartOptional } from "@/contexts/preview-cart-context";
import { ShopCollectionToolbar } from "@/components/storefront/shop-collection-toolbar";
import {
  StorefrontProductCard,
  shopProductBadges,
} from "@/components/storefront/storefront-product-card";
import { StorefrontTrustStrip } from "@/components/storefront/storefront-trust-strip";
import { StorefrontSiteFooter, StorefrontSiteHeader } from "@/components/storefront/storefront-chrome";
import { StorefrontThemeRoot } from "@/components/storefront/storefront-theme-root";
import { useProducts } from "@/hooks/use-products";
import { usePreviewStorefrontConfig } from "@/hooks/use-preview-storefront-config";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import { STOREFRONT_DEFAULT_MEDIA } from "@/lib/storefront-default-media";
import { isCatalogueTemplate } from "@/lib/storefront-template-utils";
import {
  collectionPageIdFromShopCollection,
  resolveCollectionPage,
  resolveShopChrome,
} from "@/lib/storefront-collection-pages";
import {
  buildShopHref,
  parseShopCollection,
  previewStorefrontBasePath,
} from "@/lib/preview-shop-href";
import { productApiToCatalog } from "@/lib/product-mapper";
import type { CatalogProduct } from "@/types/catalog-product";

type ShopCollectionClientProps = {
  workspaceId: string;
};

function ShopCollectionBody({ workspaceId }: ShopCollectionClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = previewStorefrontBasePath(workspaceId);
  const cart = usePreviewCartOptional();
  const storefront = usePreviewStorefrontConfig(workspaceId);
  const accessToken = getStoredAuthSession()?.accessToken ?? null;

  const collection = parseShopCollection(searchParams.get("collection"));
  const category = searchParams.get("category")?.trim() ?? "";
  const qParam = searchParams.get("q")?.trim() ?? "";
  const [searchDraft, setSearchDraft] = useState(qParam);

  useEffect(() => {
    setSearchDraft(qParam);
  }, [qParam]);

  const productsQuery = useProducts(workspaceId, accessToken, {
    page: 0,
    limit: 100,
    status: "active",
    ...(qParam ? { search: qParam } : {}),
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

  function commitSearch() {
    router.push(
      buildShopHref(basePath, {
        collection,
        category: category || undefined,
        q: searchDraft.trim() || undefined,
      }),
    );
  }

  if (storefront.status === "loading" || productsQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (storefront.status === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <h1 className="font-serif text-2xl text-primary-blue">
          Sign in to preview
        </h1>
        <Link
          href="/signin"
          className="mt-2 font-sans text-sm font-semibold text-primary-blue underline"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  if (storefront.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <h1 className="font-serif text-2xl text-primary-blue">
          No storefront draft
        </h1>
        <p className="max-w-md font-sans text-sm text-muted-foreground">
          {storefront.message}
        </p>
        <Link
          href={`/dashboard/${workspaceId}`}
          className="mt-2 font-sans text-sm font-semibold text-primary-blue underline"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  if (productsQuery.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <h1 className="font-serif text-2xl text-primary-blue">
          Could not load products
        </h1>
        <p className="max-w-md font-sans text-sm text-muted-foreground">
          {productsQuery.error instanceof Error
            ? productsQuery.error.message
            : "Please try again."}
        </p>
      </div>
    );
  }

  const config = storefront.config;
  const storeName = config.shopName?.trim() || "Shop";
  const page = resolveCollectionPage(
    config.collectionPages,
    collectionPageIdFromShopCollection(collection),
  );
  const chrome = resolveShopChrome(page.chrome);
  const bannerImage =
    page.imageUrl.trim() ||
    (collection === "sale"
      ? STOREFRONT_DEFAULT_MEDIA.saleBanner
      : STOREFRONT_DEFAULT_MEDIA.promo[0]);

  return (
    <StorefrontThemeRoot config={config}>
      <div className="@container/storefront min-h-full bg-[color:var(--sf-page-bg)]">
        <StorefrontSiteHeader
          config={config}
          workspaceId={workspaceId}
          basePath={basePath}
        />

        <section className="relative min-h-[12rem] overflow-hidden @sm/storefront:min-h-[16rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/20" />
          <div className="relative z-10 mx-auto flex min-h-[12rem] max-w-[100%] flex-col justify-end px-4 py-8 @sm/storefront:min-h-[16rem] @sm/storefront:px-8 @sm/storefront:py-10">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
              {page.eyebrow || "Preview shop"}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-light text-white @sm/storefront:text-5xl">
              {page.title.trim() || storeName}
            </h1>
            {page.description.trim() ? (
              <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-white/85 @sm/storefront:text-base">
                {page.description}
              </p>
            ) : null}
          </div>
        </section>

        <StorefrontTrustStrip templateId={config.templateId} />

        <main className="mx-auto max-w-[100%] px-4 py-10 @sm/storefront:px-8 @sm/storefront:py-14">
          <ShopCollectionToolbar
            basePath={basePath}
            collection={collection}
            category={category}
            q={searchDraft}
            categories={categories}
            resultCount={products.length}
            chrome={chrome}
            templateId={config.templateId}
            onSearchChange={setSearchDraft}
            onSearchSubmit={commitSearch}
          />

          {products.length === 0 ? (
            <p className="mt-12 font-sans text-sm text-[color:var(--sf-accent-text-55)]">
              No products match. Add products under{" "}
              <strong>Products</strong> or clear filters.
            </p>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-4 @md/storefront:grid-cols-3 @md/storefront:gap-6 @xl/storefront:grid-cols-4 @xl/storefront:gap-8">
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
          basePath={basePath}
        />
      </div>
    </StorefrontThemeRoot>
  );
}

export function ShopCollectionClient({ workspaceId }: ShopCollectionClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-sans text-sm text-muted-foreground">
          Loading shop…
        </div>
      }
    >
      <ShopCollectionBody workspaceId={workspaceId} />
    </Suspense>
  );
}
