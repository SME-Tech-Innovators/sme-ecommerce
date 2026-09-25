"use client";

import { useMemo, useState } from "react";
import { ClassicBoutiqueSmartLink as SmartLink } from "@/components/storefront/templates/classic-boutique-smart-link";
import { storefrontButtonClassName } from "@/components/storefront/storefront-button";
import { StorefrontProductCard } from "@/components/storefront/storefront-product-card";
import { StorefrontSectionEmpty } from "@/components/storefront/storefront-section-empty";
import { useProducts } from "@/hooks/use-products";
import { usePublicProducts } from "@/hooks/use-public-storefront";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import { productApiToCatalog } from "@/lib/product-mapper";
import { isPublicStorefrontContext } from "@/lib/storefront-public-context";
import { resolveStorefrontProductSectionLimit } from "@/lib/storefront-product-section-limit";
import type { StorefrontFeaturedProductsSection } from "@/types/storefront";

function storeSlugFromBasePath(basePath?: string): string | undefined {
  if (!basePath) return undefined;
  const match = basePath.replace(/\/$/, "").match(/^\/s\/([^/]+)$/);
  return match?.[1];
}

type FeaturedProductsSectionProps = {
  section: StorefrontFeaturedProductsSection;
  workspaceId?: string;
  basePath?: string;
  variant?: "default" | "catalogue" | "editorial" | "bookshop";
  imageRatio?: "portrait" | "square";
};

/** Renders active catalogue products from the API (not storefront config placeholders). */
export function FeaturedProductsSection({
  section,
  workspaceId,
  basePath,
  variant = "default",
  imageRatio = "portrait",
}: FeaturedProductsSectionProps) {
  const storeSlug = storeSlugFromBasePath(basePath);
  const [accessToken] = useState(() => getStoredAuthSession()?.accessToken ?? null);
  const usePublic = Boolean(storeSlug);
  const limit = resolveStorefrontProductSectionLimit(section.limit);
  const isBookshop = variant === "bookshop";
  const isEditorial = variant === "editorial";
  const isCatalogue = variant === "catalogue";

  const listParams = { page: 0, limit: limit };

  const publicQuery = usePublicProducts(storeSlug ?? "", listParams, usePublic);
  const workspaceQuery = useProducts(workspaceId, accessToken, {
    ...listParams,
    status: "active",
  });

  const query = usePublic ? publicQuery : workspaceQuery;

  const products = useMemo(() => {
    const items = query.data?.items ?? [];
    return items
      .map(productApiToCatalog)
      .filter((p) => p.status === "active")
      .slice(0, limit);
  }, [query.data, limit]);

  return (
    <section
      className={
        isEditorial ? "maison-products mx-auto px-5 py-[var(--sf-editorial-space)] @md/storefront:px-10" : isCatalogue
          ? "mx-auto max-w-[100%] border-b border-[color:var(--sf-accent)]/10 px-4 py-12 @sm/storefront:px-8 @sm/storefront:py-14"
          : "mx-auto max-w-[100%] px-4 py-14 sm:px-8 sm:py-20"
      }
      aria-labelledby={`${section.id}-heading`}
    >
      <div
        className={
          isCatalogue
            ? "mb-8 flex flex-col gap-2 border-b border-[color:var(--sf-accent)]/10 pb-5 @sm/storefront:flex-row @sm/storefront:items-end @sm/storefront:justify-between"
            : "mb-8 flex flex-col gap-3 @sm/storefront:mb-10 @sm/storefront:flex-row @sm/storefront:flex-wrap @sm/storefront:items-end @sm/storefront:justify-between @sm/storefront:gap-4"
        }
      >
        <div>
          {isCatalogue ? (
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--sf-accent-text-45)]">
              Products
            </p>
          ) : null}
          <h2
            id={`${section.id}-heading`}
            className={
              isEditorial ? "font-serif text-[clamp(2rem,5cqi,4.5rem)] leading-none tracking-[-0.04em] text-[color:var(--sf-accent)]" : isCatalogue
                ? "mt-2 font-sans text-2xl font-semibold tracking-tight text-[color:var(--sf-accent)] @sm/storefront:text-3xl"
                : "font-serif text-2xl font-light text-[color:var(--sf-accent)] @sm/storefront:text-3xl"
            }
          >
            {section.title}
          </h2>
        </div>
        {section.viewAll ? (
          <SmartLink
            link={section.viewAll}
            workspaceId={workspaceId}
            basePath={basePath}
            className={
              isCatalogue
                ? "font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--sf-accent)] underline-offset-4 hover:underline"
                : storefrontButtonClassName({ variant: "text" })
            }
          />
        ) : null}
      </div>

      {query.isLoading ? (
        <p className="font-sans text-sm text-[color:var(--sf-accent-text-55)]">
          Loading products…
        </p>
      ) : query.isError ? (
        <p className="font-sans text-sm text-[color:var(--sf-accent-text-55)]">
          {query.error instanceof Error
            ? query.error.message
            : "Could not load products."}
        </p>
      ) : products.length === 0 ? (
        <StorefrontSectionEmpty
          basePath={basePath}
          merchantMessage="No active products yet. Add and publish products in the Products panel."
          publicMessage="Nothing here yet."
        />
      ) : (
        <div
          className={
            isEditorial ? "grid grid-cols-2 gap-x-5 gap-y-10 @md/storefront:gap-x-16 @md/storefront:[&>div:nth-child(even)]:pt-20" : isCatalogue
              ? "grid grid-cols-2 gap-px bg-[color:var(--sf-accent)]/10 @md/storefront:grid-cols-3 @xl/storefront:grid-cols-4"
              : "grid grid-cols-2 gap-4 @md/storefront:grid-cols-3 @md/storefront:gap-6 @xl/storefront:grid-cols-4 @xl/storefront:gap-8"
          }
        >
          {products.map((p) => {
            const apiItem = query.data?.items.find((i) => i.id === p.id);
            const pathSegment =
              usePublic && apiItem?.slug ? apiItem.slug : p.id;
            const productHref = basePath
              ? `${basePath.replace(/\/$/, "")}/shop/${encodeURIComponent(pathSegment)}`
              : workspaceId
                ? `/preview/${workspaceId}/shop/${encodeURIComponent(p.id)}`
                : undefined;
            return (
              <div
                key={p.id}
                className={isCatalogue ? "bg-[color:var(--sf-page-bg)] p-3 @sm/storefront:p-4" : undefined}
              >
                <StorefrontProductCard
                  title={p.title}
                  priceLabel={p.priceLabel}
                  compareAtPriceLabel={p.compareAtPriceLabel}
                  imageUrl={p.imageUrl}
                  href={productHref}
                  aspect={isBookshop ? "portrait" : isEditorial ? imageRatio : "square"}
                  variant={isBookshop ? "bookshop" : isCatalogue ? "catalogue" : "default"}
                  badges={(() => {
                    const list: Array<"Sold out" | "Sale"> = [];
                    if (p.inStock === false) list.push("Sold out");
                    if (p.onSale || p.compareAtPriceLabel?.trim()) list.push("Sale");
                    return list.length ? list : undefined;
                  })()}
                  showUploadHint={!isPublicStorefrontContext(basePath)}
                  ctaLabel="View"
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
