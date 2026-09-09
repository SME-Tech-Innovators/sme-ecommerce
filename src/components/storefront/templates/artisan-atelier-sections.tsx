"use client";

import { StorefrontSmartLink } from "@/components/storefront/storefront-smart-link";
import {
  STOREFRONT_DEFAULT_MEDIA,
  defaultPromoImageUrl,
  withDefaultImageUrl,
} from "@/lib/storefront-default-media";
import { resolveStorefrontHref } from "@/lib/preview-shop-href";
import type {
  StorefrontFeature,
  StorefrontFeatureIconId,
  StorefrontHeroSection,
  StorefrontPromoBannerSection,
  StorefrontSection,
} from "@/types/storefront";

function AtelierFeatureIcon({ id }: { id: StorefrontFeatureIconId }) {
  const common = "h-6 w-6";
  switch (id) {
    case "check":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case "truck":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v10H3V7zm11 0h3l3 3v4h-6M9 19a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
        </svg>
      );
    case "sparkle":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" d="M12 3v2m0 14v2M4.2 4.2l1.4 1.4m12.8 12.8l1.4 1.4M3 12h2m14 0h2M4.2 19.8l1.4-1.4M17.4 5.6l1.4-1.4" />
        </svg>
      );
  }
}

/** Centred editorial hero — copy first, rounded image card below (not overlay, not split pane). */
export function ArtisanAtelierHero({
  section,
  workspaceId,
  basePath,
}: {
  section: StorefrontHeroSection;
  workspaceId?: string;
  basePath?: string;
}) {
  const heroBg = withDefaultImageUrl(
    section.imageUrl,
    STOREFRONT_DEFAULT_MEDIA.hero,
  );

  return (
    <section
      className="bg-[color:var(--sf-promo-section-bg)] px-4 pb-12 pt-10 @sm/storefront:px-8 @sm/storefront:pb-16 @sm/storefront:pt-14"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.32em] text-[color:var(--sf-accent-text-45)]">
          Welcome
        </p>
        <h1
          id={`${section.id}-heading`}
          className="mt-4 font-serif text-[clamp(2.25rem,5.5vw,3.75rem)] font-light leading-[1.08] tracking-tight text-[color:var(--sf-accent)]"
        >
          {section.heading}
        </h1>
        <p className="mx-auto mt-5 max-w-xl font-sans text-[15px] leading-relaxed text-[color:var(--sf-accent-text-65)] @sm/storefront:text-base">
          {section.subheading}
        </p>
        {section.primaryCta || section.secondaryCta ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {section.primaryCta ? (
              <StorefrontSmartLink
                link={section.primaryCta}
                workspaceId={workspaceId}
                basePath={basePath}
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--sf-accent)] px-7 py-3.5 font-sans text-sm font-semibold text-[color:var(--sf-cart-badge-fg)] transition-opacity hover:opacity-90"
              />
            ) : null}
            {section.secondaryCta ? (
              <StorefrontSmartLink
                link={section.secondaryCta}
                workspaceId={workspaceId}
                basePath={basePath}
                className="inline-flex items-center justify-center rounded-full border border-[color:var(--sf-accent)]/20 bg-white/80 px-7 py-3.5 font-sans text-sm font-semibold text-[color:var(--sf-accent)] transition-colors hover:bg-white"
              />
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-[1.75rem] border border-[color:var(--sf-accent-border-10)] bg-white shadow-[0_24px_60px_-24px_rgba(10,37,64,0.35)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroBg}
          alt=""
          className="aspect-[16/10] w-full object-cover @sm/storefront:aspect-[16/9]"
        />
      </div>
    </section>
  );
}

/** Soft elevated cards — distinct from Classic icons and Catalogue numbered strip. */
export function ArtisanAtelierFeatures({
  section,
}: {
  section: Extract<StorefrontSection, { type: "features" }>;
}) {
  const items: StorefrontFeature[] = section.items;
  return (
    <section
      className="px-4 py-12 @sm/storefront:px-8 @sm/storefront:py-16"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="mx-auto max-w-5xl">
        {section.title.trim() ? (
          <h2
            id={`${section.id}-heading`}
            className="text-center font-serif text-2xl font-light tracking-tight text-[color:var(--sf-accent)] @sm/storefront:text-3xl"
          >
            {section.title}
          </h2>
        ) : (
          <h2 id={`${section.id}-heading`} className="sr-only">
            Why shop with us
          </h2>
        )}
        <ul className="mt-10 grid gap-5 @md/storefront:grid-cols-3">
          {items.map((f, i) => (
            <li
              key={`${f.title}-${i}`}
              className="rounded-2xl border border-[color:var(--sf-accent-border-10)] bg-white p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex rounded-full bg-[color:var(--sf-nav-hover-wash)] p-3 text-[color:var(--sf-accent)]">
                <AtelierFeatureIcon id={f.icon} />
              </div>
              <h3 className="font-sans text-base font-semibold text-[color:var(--sf-accent)]">
                {f.title}
              </h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-65)]">
                {f.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Full-width image promo with bottom gradient caption. */
export function ArtisanAtelierPromo({
  section,
  workspaceId,
  basePath,
}: {
  section: StorefrontPromoBannerSection;
  workspaceId?: string;
  basePath?: string;
}) {
  const promoSrc = withDefaultImageUrl(
    section.imageUrl,
    defaultPromoImageUrl(0),
  );
  const resolvedBase =
    basePath ?? (workspaceId ? `/preview/${workspaceId}` : undefined);
  const href = resolveStorefrontHref(
    { label: section.buttonLabel, href: section.href },
    resolvedBase,
  );

  return (
    <section className="px-4 py-6 @sm/storefront:px-8 @sm/storefront:py-10">
      <a
        href={href}
        className="group relative mx-auto block max-w-5xl overflow-hidden rounded-[1.5rem] border border-[color:var(--sf-accent-border-10)] shadow-md"
      >
        <div className="relative aspect-[21/10] @sm/storefront:aspect-[21/9]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={promoSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 @sm/storefront:p-8">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
              Featured
            </p>
            <h2 className="mt-2 max-w-lg font-serif text-2xl font-light text-white @sm/storefront:text-3xl">
              {section.title}
            </h2>
            {section.description.trim() ? (
              <p className="mt-2 max-w-md font-sans text-sm text-white/85">
                {section.description}
              </p>
            ) : null}
            <span className="mt-4 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-white">
              {section.buttonLabel}
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </div>
        </div>
      </a>
    </section>
  );
}

export function ArtisanAtelierContactCta({
  section,
  basePath,
}: {
  section: Extract<StorefrontSection, { type: "contactCta" }>;
  basePath?: string;
}) {
  const href = resolveStorefrontHref(
    { label: section.buttonLabel, href: section.href },
    basePath,
  );

  return (
    <section className="px-4 py-10 @sm/storefront:px-8 @sm/storefront:py-14">
      <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-values-section-bg)] px-6 py-10 text-center @sm/storefront:px-10">
        <h2 className="font-serif text-2xl font-light tracking-tight text-[color:var(--sf-accent)] @sm/storefront:text-3xl">
          {section.title}
        </h2>
        <p className="mx-auto mt-4 max-w-lg font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-65)] @sm/storefront:text-base">
          {section.body}
        </p>
        <a
          href={href}
          className="mt-6 inline-flex items-center justify-center rounded-full border border-[color:var(--sf-accent)]/25 bg-white px-7 py-3 font-sans text-sm font-semibold text-[color:var(--sf-accent)] transition-colors hover:bg-[color:var(--sf-nav-hover-wash)]"
        >
          {section.buttonLabel}
        </a>
      </div>
    </section>
  );
}
