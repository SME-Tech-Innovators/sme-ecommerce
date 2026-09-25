"use client";

import Link from "next/link";
import { useState } from "react";
import { usePreviewCartOptional } from "@/contexts/preview-cart-context";
import { StorefrontButton } from "@/components/storefront/storefront-button";
import { StorefrontImagePlaceholder } from "@/components/storefront/storefront-image-placeholder";
import { StorefrontSiteFooter, StorefrontSiteHeader } from "@/components/storefront/storefront-chrome";
import type { CatalogProductPdpView } from "@/lib/catalog-product-pdp";
import type { StorefrontConfig } from "@/types/storefront";

type StorefrontProductDetailViewProps = {
  /** Preview workspace id — used when `basePath` is omitted. */
  workspaceId?: string;
  /** Explicit storefront root, e.g. `/s/my-store`. */
  basePath?: string;
  config: StorefrontConfig;
  product: CatalogProductPdpView;
};

function PdpIcon({ variant }: { variant: "shield" | "fingerprint" | "layers" }) {
  const box =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[color:var(--sf-icon-tile-bg)] text-[color:var(--sf-icon-tile-text)]";
  switch (variant) {
    case "shield":
      return (
        <span className={box} aria-hidden>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V7l8-4z" />
          </svg>
        </span>
      );
    case "fingerprint":
      return (
        <span className={box} aria-hidden>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a3 3 0 100-6 3 3 0 000 6zm-7 3v2a5 5 0 005 5h2a5 5 0 005-5v-2M7 14v2a5 5 0 005 5h0a5 5 0 005-5v-2" />
          </svg>
        </span>
      );
    default:
      return (
        <span className={box} aria-hidden>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        </span>
      );
  }
}

const STANDARD_ICONS: Array<"shield" | "fingerprint" | "layers"> = [
  "shield",
  "fingerprint",
  "layers",
];

export function StorefrontProductDetailView({
  workspaceId,
  basePath,
  config,
  product,
}: StorefrontProductDetailViewProps) {
  const cart = usePreviewCartOptional();
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const root =
    basePath?.replace(/\/$/, "") ??
    (workspaceId ? `/preview/${workspaceId}` : "");
  const images = product.gallery.filter((u) => u.trim());
  const mainSrc = images[activeImage] ?? "";
  const maxQty =
    typeof product.quantityAvailable === "number" && product.quantityAvailable > 0
      ? product.quantityAvailable
      : product.inStock
        ? 99
        : 0;
  const canAdd =
    Boolean(cart) &&
    product.status !== "archived" &&
    product.inStock &&
    maxQty >= 1;

  return (
    <div className="@container/storefront min-h-full">
      <StorefrontSiteHeader config={config} basePath={basePath} workspaceId={workspaceId} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        <nav
          className="mb-8 flex flex-wrap justify-end gap-x-1 text-right font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--sf-accent-text-45)]"
          aria-label="Breadcrumb"
        >
          <Link
            href={`${root}` || "/"}
            className="text-[color:var(--sf-accent)]/70 transition-colors hover:text-[color:var(--sf-accent)]"
          >
            Shop
          </Link>
          <span className="text-[color:var(--sf-accent-text-45)]" aria-hidden>
            {" "}
            /{" "}
          </span>
          <Link
            href={`${root}/shop`}
            className="text-[color:var(--sf-accent)]/70 transition-colors hover:text-[color:var(--sf-accent)]"
          >
            Products
          </Link>
          <span className="text-[color:var(--sf-accent-text-45)]" aria-hidden>
            {" "}
            /{" "}
          </span>
          <span className="text-[color:var(--sf-accent-text-55)]">
            {product.category}
          </span>
          <span className="text-[color:var(--sf-accent-text-45)]" aria-hidden>
            {" "}
            /{" "}
          </span>
          <span className="max-w-[12rem] truncate text-[color:var(--sf-accent-text-55)]">
            {product.title}
          </span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl border border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-card-frame-bg)] shadow-sm">
              {mainSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mainSrc}
                  alt=""
                  className={config.templateId === "chapter-bookshop" ? "h-full w-full object-contain p-3" : "h-full w-full object-cover"}
                />
              ) : (
                <StorefrontImagePlaceholder label={product.title} />
              )}
            </div>
            {images.length > 1 ? (
              <ul className="mt-4 flex flex-wrap gap-3">
                {images.map((src, i) => (
                  <li key={`${src}-${i}`}>
                    <button
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`h-20 w-20 overflow-hidden rounded-lg border-2 transition-shadow ${
                        i === activeImage
                          ? "border-[color:var(--sf-accent)] ring-2 ring-[color:var(--sf-accent)]/20"
                          : "border-[color:var(--sf-accent-border-10)] opacity-80 hover:opacity-100"
                      }`}
                      aria-label={`Show image ${i + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className={config.templateId === "chapter-bookshop" ? "h-full w-full object-contain p-3" : "h-full w-full object-cover"} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-col">
            <h1 className="font-serif text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-tight tracking-tight text-[color:var(--sf-accent)]">
              {product.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="font-sans text-2xl font-semibold tabular-nums text-[color:var(--sf-accent)]">
                {product.priceLabel}
              </p>
              {product.inStock ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-700/15">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                  In stock
                  {typeof product.quantityAvailable === "number" &&
                  product.quantityAvailable > 0 &&
                  product.quantityAvailable <= 5
                    ? ` · ${product.quantityAvailable} left`
                    : null}
                </span>
              ) : product.status === "draft" ? (
                <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-amber-700/20">
                  Draft
                </span>
              ) : product.status === "archived" ? (
                <span className="inline-flex rounded-full bg-blue-gray/50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-blue/70 ring-1 ring-primary-blue/15">
                  Unavailable
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-stone-700 ring-1 ring-stone-400/25">
                  Sold out
                </span>
              )}
            </div>
            <p className="mt-6 font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-65)] sm:text-base">
              {product.summary}
            </p>

            {product.configurationLabel.trim() ? (
              <div className="mt-8 rounded-xl border border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-promo-section-bg)] px-4 py-4 sm:px-5">
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--sf-accent-text-45)]">
                  Details
                </p>
                <p className="mt-1 font-sans text-sm font-medium text-[color:var(--sf-accent)]">
                  {product.configurationLabel}
                </p>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center rounded-lg border border-[color:var(--sf-accent-border-15)] bg-white">
                <button
                  type="button"
                  className="px-3 py-2 font-sans text-lg text-[color:var(--sf-accent)] transition-colors hover:bg-[color:var(--sf-nav-hover-wash)] disabled:opacity-40"
                  disabled={!canAdd || qty <= 1}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="min-w-[2.5rem] text-center font-sans text-sm font-semibold tabular-nums text-[color:var(--sf-accent)]">
                  {canAdd ? Math.min(qty, maxQty) : 0}
                </span>
                <button
                  type="button"
                  className="px-3 py-2 font-sans text-lg text-[color:var(--sf-accent)] transition-colors hover:bg-[color:var(--sf-nav-hover-wash)] disabled:opacity-40"
                  disabled={!canAdd || qty >= maxQty}
                  onClick={() =>
                    setQty((q) => Math.min(maxQty, Math.max(1, q + 1)))
                  }
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <StorefrontButton
              type="button"
              size="lg"
              className="mt-6 w-full max-w-md gap-2 rounded-lg"
              disabled={!canAdd}
              onClick={() => {
                if (!cart || !canAdd) return;
                const addQty = Math.min(Math.max(1, qty), maxQty);
                const thumb = product.gallery.find((u) => u.trim()) ?? "";
                cart.addItem({
                  productId: product.id,
                  title: product.title,
                  sku: product.sku,
                  priceLabel: product.priceLabel,
                  imageUrl: thumb,
                  quantity: addQty,
                });
                setJustAdded(true);
                window.setTimeout(() => setJustAdded(false), 2200);
              }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {product.inStock ? "Add to cart" : "Sold out"}
            </StorefrontButton>
            {justAdded && product.inStock ? (
              <p className="mt-2 font-sans text-xs font-medium text-emerald-700/90" role="status">
                Added to your cart — open the bag icon to review or change quantities.
              </p>
            ) : null}
            {!cart ? (
              <p className="mt-2 font-sans text-xs text-[color:var(--sf-accent-text-55)]">
                Cart is available on the live store URL and customer preview.
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 font-sans text-xs text-[color:var(--sf-accent-text-55)]">
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-[color:var(--sf-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {product.warrantyNote}
              </span>
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-[color:var(--sf-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                {product.shippingNote}
              </span>
            </div>
          </div>
        </div>

        <section className="mt-20 border-t border-[color:var(--sf-accent-border-10)] pt-16 text-center">
          <h2 className="font-serif text-2xl font-semibold text-[color:var(--sf-accent)] sm:text-3xl">
            {product.standardsTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-60)] sm:text-base">
            {product.standardsSubtitle}
          </p>
          <ul className="mx-auto mt-12 grid max-w-5xl gap-6 text-left sm:grid-cols-3 sm:gap-8">
            {product.standards.map((s, i) => (
              <li
                key={`${s.title}-${i}`}
                className="rounded-2xl border border-[color:var(--sf-accent-border-10)] bg-white p-6 shadow-sm"
              >
                <PdpIcon variant={STANDARD_ICONS[i % STANDARD_ICONS.length]} />
                <h3 className="mt-5 font-sans text-base font-semibold text-[color:var(--sf-accent)]">
                  {s.title}
                </h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-60)]">
                  {s.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-20 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="rounded-2xl bg-[color:var(--sf-accent)] px-6 py-10 text-white sm:px-10 sm:py-12">
            <h2 className="font-serif text-2xl font-light sm:text-3xl">
              {product.hardwareTitle}
            </h2>
            <p className="mt-4 font-sans text-sm leading-relaxed text-white/85 sm:text-base">
              {product.hardwareBody}
            </p>
            <ul className="mt-8 space-y-4 font-sans text-sm text-white/90">
              {product.hardwareSpecs.map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-white" aria-hidden>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-promo-section-bg)] px-6 py-10 sm:px-10 sm:py-12">
            <div className="space-y-8">
              {product.sidebarSections.map((block) => (
                <div key={block.kicker}>
                  <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--sf-accent)]">
                    {block.kicker}
                  </p>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-65)]">
                    {block.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <StorefrontSiteFooter
        config={config}
        workspaceId={workspaceId}
        basePath={basePath ?? (workspaceId ? `/preview/${workspaceId}` : undefined)}
      />
    </div>
  );
}
