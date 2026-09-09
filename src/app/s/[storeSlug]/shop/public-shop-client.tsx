"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShopCollectionToolbar } from "@/components/storefront/shop-collection-toolbar";
import {
  StorefrontProductCard,
  shopProductBadges,
} from "@/components/storefront/storefront-product-card";
import { StorefrontTrustStrip } from "@/components/storefront/storefront-trust-strip";
import { StorefrontSiteFooter, StorefrontSiteHeader } from "@/components/storefront/storefront-chrome";
import { StorefrontThemeRoot } from "@/components/storefront/storefront-theme-root";
import {
  usePublicProducts,
  usePublicStorefront,
} from "@/hooks/use-public-storefront";
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
  publicStorefrontBasePath,
} from "@/lib/preview-shop-href";
import { productApiToCatalog } from "@/lib/product-mapper";

type PublicShopClientProps = {
  storeSlug: string;
};

function PublicShopBody({ storeSlug }: PublicShopClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = publicStorefrontBasePath(storeSlug);

  const collection = parseShopCollection(searchParams.get("collection"));
  const category = searchParams.get("category")?.trim() ?? "";
  const qParam = searchParams.get("q")?.trim() ?? "";
  const [searchDraft, setSearchDraft] = useState(qParam);

  useEffect(() => {
    setSearchDraft(qParam);
  }, [qParam]);

  const listParams = useMemo(
    () => ({
      page: 0,
      limit: 100,
      ...(category ? { category } : {}),
      ...(qParam ? { search: qParam } : {}),
      ...(collection === "sale" ? { onSale: true as const } : {}),
      ...(collection === "new" || collection === "sale"
        ? { sort: "newest" as const }
        : { sort: "newest" as const }),
    }),
    [category, qParam, collection],
  );

  const storefrontQuery = usePublicStorefront(storeSlug);
  const productsQuery = usePublicProducts(storeSlug, listParams);
  /** Unfiltered fetch to build category chips. */
  const catalogQuery = usePublicProducts(storeSlug, {
    page: 0,
    limit: 100,
    sort: "newest",
  });

  const products = useMemo(() => {
    const items = productsQuery.data?.items ?? [];
    // Client fallback if backend ignores onSale until fully rolled out.
    if (collection === "sale") {
      return items
        .filter(
          (item) =>
            item.onSale ||
            (item.compareAtPriceAmount != null &&
              item.compareAtPriceAmount > item.priceAmount),
        )
        .map((item) => ({
          catalog: productApiToCatalog(item),
          slug: item.slug,
        }));
    }
    return items.map((item) => ({
      catalog: productApiToCatalog(item),
      slug: item.slug,
    }));
  }, [productsQuery.data, collection]);

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

  if (storefrontQuery.isLoading || productsQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--sf-page-bg)] font-sans text-sm text-[color:var(--sf-accent-text-55)]">
        Loading…
      </div>
    );
  }

  if (storefrontQuery.isError || !storefrontQuery.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <h1 className="font-serif text-2xl text-primary-blue">
          Store not available
        </h1>
        <p className="max-w-md font-sans text-sm text-muted-foreground">
          {storefrontQuery.error instanceof Error
            ? storefrontQuery.error.message
            : "This storefront is unpublished or does not exist."}
        </p>
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

  const config = storefrontQuery.data.config;
  const storeName =
    config.shopName?.trim() ||
    storefrontQuery.data.storefront.storeName?.trim() ||
    "Shop";

  const page = resolveCollectionPage(
    config.collectionPages,
    collectionPageIdFromShopCollection(collection),
  );
  const bannerCopy = {
    eyebrow: page.eyebrow,
    title: page.title.trim() || storeName,
    body: page.description,
  };
  const bannerImage =
    page.imageUrl.trim() ||
    (collection === "sale"
      ? STOREFRONT_DEFAULT_MEDIA.saleBanner
      : STOREFRONT_DEFAULT_MEDIA.promo[0]);
  const chrome = resolveShopChrome(page.chrome);

  return (
    <StorefrontThemeRoot config={config}>
      <div className="@container/storefront min-h-full bg-[color:var(--sf-page-bg)]">
        <StorefrontSiteHeader config={config} basePath={basePath} />

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
              {bannerCopy.eyebrow}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-light text-white @sm/storefront:text-5xl">
              {bannerCopy.title}
            </h1>
            <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-white/85 @sm/storefront:text-base">
              {bannerCopy.body}
            </p>
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
              Nothing here yet. Try another filter or clear your search.
            </p>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-4 @md/storefront:grid-cols-3 @md/storefront:gap-6 @xl/storefront:grid-cols-4 @xl/storefront:gap-8">
              {products.map(({ catalog: p, slug }) => (
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
                    href={`${basePath}/shop/${encodeURIComponent(slug)}`}
                    ctaLabel="View"
                  />
                </li>
              ))}
            </ul>
          )}
        </main>

        <StorefrontSiteFooter config={config} basePath={basePath} />
      </div>
    </StorefrontThemeRoot>
  );
}

export function PublicShopClient({ storeSlug }: PublicShopClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-sans text-sm text-muted-foreground">
          Loading shop…
        </div>
      }
    >
      <PublicShopBody storeSlug={storeSlug} />
    </Suspense>
  );
}
