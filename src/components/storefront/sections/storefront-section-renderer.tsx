"use client";

import type { PointerEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  InstagramGallerySection,
  NewsletterSection,
  TestimonialsSection,
} from "@/components/storefront/sections/content-sections";
import { ContactSection } from "@/components/storefront/sections/contact-section";
import { FeaturedProductsSection } from "@/components/storefront/sections/featured-products-section";
import { NewArrivalsSection } from "@/components/storefront/sections/new-arrivals-section";
import { SaleSection } from "@/components/storefront/sections/sale-section";
import { ShopByCategorySection } from "@/components/storefront/sections/shop-by-category-section";
import {
  MinimalCatalogueContactCta,
  MinimalCatalogueFaq,
  MinimalCatalogueFeatures,
  MinimalCatalogueHero,
  MinimalCataloguePromo,
} from "@/components/storefront/templates/minimal-catalogue-sections";
import { ClassicBoutiqueSmartLink as SmartLink } from "@/components/storefront/templates/classic-boutique-smart-link";
import { storefrontButtonClassName } from "@/components/storefront/storefront-button";
import {
  STOREFRONT_DEFAULT_MEDIA,
  defaultPromoImageUrl,
  withDefaultImageUrl,
} from "@/lib/storefront-default-media";
import { isCatalogueTemplate } from "@/lib/storefront-template-utils";
import { resolveStorefrontHref } from "@/lib/preview-shop-href";
import type {
  StorefrontConfig,
  StorefrontFeatureIconId,
  StorefrontSection,
} from "@/types/storefront";

const SITE_SECTION_LIBRARY: Array<{
  type: StorefrontSection["type"];
  label: string;
  catalogueLabel?: string;
}> = [
  { type: "hero", label: "Hero" },
  { type: "featuredProducts", label: "Products", catalogueLabel: "Popular products" },
  { type: "newArrivals", label: "New arrivals", catalogueLabel: "Just in" },
  { type: "sale", label: "Sale", catalogueLabel: "Specials" },
  { type: "shopByCategory", label: "Categories" },
  { type: "promoBanner", label: "Promo", catalogueLabel: "Special banner" },
  { type: "textImage", label: "Text + image" },
  { type: "features", label: "Benefits" },
  { type: "testimonials", label: "Testimonials" },
  { type: "instagramGallery", label: "Instagram" },
  { type: "newsletter", label: "Newsletter" },
  { type: "faq", label: "FAQ" },
  { type: "contact", label: "Contact form" },
  { type: "contactCta", label: "Contact CTA" },
];

function sectionLibraryLabel(
  item: (typeof SITE_SECTION_LIBRARY)[number],
  isCatalogue: boolean,
): string {
  return isCatalogue && item.catalogueLabel
    ? item.catalogueLabel
    : item.label;
}

type SectionDragState = {
  index: number;
  label: string;
  x: number;
  y: number;
};

type SectionRenderGroup =
  | { type: "single"; section: StorefrontSection; index: number }
  | {
      type: "row";
      items: Array<{ section: StorefrontSection; index: number }>;
    };

function getScrollParent(element: HTMLElement): HTMLElement | Window {
  let parent = element.parentElement;
  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    if (/(auto|scroll)/.test(overflowY) && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}

type StorefrontSectionRendererProps = {
  section: StorefrontSection;
  config: StorefrontConfig;
  workspaceId?: string;
  basePath?: string;
  isEditing?: boolean;
};

function FeatureIcon({ id }: { id: StorefrontFeatureIconId }) {
  const box =
    "flex h-10 w-10 items-center justify-center rounded-md bg-[color:var(--sf-icon-tile-bg)] text-[color:var(--sf-icon-tile-text)]";
  switch (id) {
    case "check":
      return (
        <span className={box} aria-hidden>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      );
    case "truck":
      return (
        <span className={box} aria-hidden>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v10H3V7zm11 0h3l3 3v4h-6M9 19a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
        </span>
      );
    case "sparkle":
      return (
        <span className={box} aria-hidden>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" d="M12 3v2m0 14v2M4.2 4.2l1.4 1.4m12.8 12.8l1.4 1.4M3 12h2m14 0h2M4.2 19.8l1.4-1.4M17.4 5.6l1.4-1.4" />
            <path strokeLinecap="round" d="M12 8a4 4 0 104 4 4 4 0 00-4-4z" />
          </svg>
        </span>
      );
  }
}

export function StorefrontSectionRenderer({
  section,
  config,
  workspaceId,
  basePath,
  isEditing = false,
}: StorefrontSectionRendererProps) {
  const isCatalogue = isCatalogueTemplate(config.templateId);

  switch (section.type) {
    case "hero": {
      if (isCatalogue) {
        return (
          <MinimalCatalogueHero
            section={section}
            workspaceId={workspaceId}
            basePath={basePath}
          />
        );
      }
      const heroBg = withDefaultImageUrl(
        section.imageUrl,
        STOREFRONT_DEFAULT_MEDIA.hero,
      );
      return (
        <section
          className="relative min-h-[min(70vh,36rem)] overflow-hidden"
          aria-labelledby={`${section.id}-heading`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroBg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-transparent" />
          <div className="relative z-10 mx-auto flex min-h-[min(70vh,36rem)] max-w-7xl items-center px-4 py-16 sm:px-8 sm:py-24">
            <div className="max-w-xl">
              <h1
                id={`${section.id}-heading`}
                className="font-serif text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.1] tracking-tight text-white"
              >
                {section.heading}
              </h1>
              <p className="mt-5 font-sans text-base leading-relaxed text-white/90 sm:text-lg">
                {section.subheading}
              </p>
              {section.primaryCta || section.secondaryCta ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  {section.primaryCta ? (
                    <SmartLink
                      link={section.primaryCta}
                      workspaceId={workspaceId}
                      basePath={basePath}
                      className={storefrontButtonClassName({ size: "lg" })}
                    />
                  ) : null}
                  {section.secondaryCta ? (
                    <SmartLink
                      link={section.secondaryCta}
                      workspaceId={workspaceId}
                      basePath={basePath}
                      className={storefrontButtonClassName({
                        variant: "outline",
                        size: "lg",
                      })}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      );
    }
    case "featuredProducts":
      return (
        <FeaturedProductsSection
          section={section}
          workspaceId={workspaceId}
          basePath={basePath}
          variant={isCatalogue ? "catalogue" : "default"}
        />
      );
    case "newArrivals":
      return (
        <NewArrivalsSection
          section={section}
          workspaceId={workspaceId}
          basePath={basePath}
          variant={isCatalogue ? "catalogue" : "default"}
        />
      );
    case "sale":
      return (
        <SaleSection
          section={section}
          workspaceId={workspaceId}
          basePath={basePath}
          variant={isCatalogue ? "catalogue" : "default"}
        />
      );
    case "shopByCategory":
      return (
        <ShopByCategorySection
          section={section}
          workspaceId={workspaceId}
          basePath={basePath}
          variant={isCatalogue ? "catalogue" : "default"}
        />
      );
    case "promoBanner": {
      if (isCatalogue) {
        return (
          <MinimalCataloguePromo
            section={section}
            workspaceId={workspaceId}
            basePath={basePath}
          />
        );
      }
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
      // Alternate image side by section id so stacked promos don’t feel identical.
      const imageFirst =
        section.id.split("").reduce((n, c) => n + c.charCodeAt(0), 0) % 2 === 1;

      return (
        <section
          className="bg-[color:var(--sf-page-bg)] px-4 py-10 @sm/storefront:px-8 @sm/storefront:py-14"
          aria-labelledby={`${section.id}-heading`}
        >
          <a
            href={href}
            className={`group mx-auto grid max-w-[100%] overflow-hidden border border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-accent)] shadow-sm transition-shadow hover:shadow-md @md/storefront:grid-cols-2 ${
              imageFirst ? "@md/storefront:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div className="relative aspect-[16/10] overflow-hidden @md/storefront:aspect-auto @md/storefront:min-h-[22rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={promoSrc}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
            </div>
            <div className="relative flex flex-col justify-center px-6 py-10 text-white @sm/storefront:px-10 @sm/storefront:py-12">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, #fff 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
                aria-hidden
              />
              <p className="relative font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
                Special offer
              </p>
              <h2
                id={`${section.id}-heading`}
                className="relative mt-3 font-serif text-[clamp(1.75rem,3.5vw,2.75rem)] font-light leading-tight tracking-tight"
              >
                {section.title}
              </h2>
              {section.description.trim() ? (
                <p className="relative mt-4 max-w-md font-sans text-sm leading-relaxed text-white/80 @sm/storefront:text-base">
                  {section.description}
                </p>
              ) : null}
              <span className="relative mt-8 inline-flex w-fit items-center bg-white px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--sf-accent)] transition-transform group-hover:translate-x-0.5">
                {section.buttonLabel}
                <span aria-hidden className="ml-2">
                  →
                </span>
              </span>
            </div>
          </a>
        </section>
      );
    }
    case "textImage":
      return (
        <section className="bg-[color:var(--sf-page-bg)] px-4 py-14 sm:px-8 sm:py-20">
          <div
            className={`mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 ${
              section.imagePosition === "left" ? "" : "lg:[&>*:first-child]:order-2"
            }`}
          >
            <div className="overflow-hidden rounded-2xl border border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-card-frame-bg)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withDefaultImageUrl(
                  section.imageUrl,
                  STOREFRONT_DEFAULT_MEDIA.textImage,
                )}
                alt=""
                className="aspect-[4/3] h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--sf-accent-text-45)]">
                {section.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-light text-[color:var(--sf-accent)]">
                {section.title}
              </h2>
              <p className="mt-4 font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-65)] sm:text-base">
                {section.body}
              </p>
              <SmartLink
                link={section.cta}
                workspaceId={workspaceId}
                basePath={basePath}
                className={storefrontButtonClassName({
                  variant: "text",
                  className: "mt-6",
                })}
              />
            </div>
          </div>
        </section>
      );
    case "features":
      if (isCatalogue) {
        return <MinimalCatalogueFeatures section={section} />;
      }
      return (
        <section
          className="border-y border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-values-section-bg)]"
          aria-labelledby={`${section.id}-heading`}
        >
          <h2 id={`${section.id}-heading`} className="sr-only">
            {section.title || "Why shop with us"}
          </h2>
          <div className="mx-auto grid max-w-[100%] gap-6 px-4 py-7 @md/storefront:grid-cols-3 @md/storefront:gap-8 @md/storefront:px-8 @md/storefront:py-9">
            {section.items.map((f, i) => (
              <div key={`${f.title}-${i}`} className="flex gap-4 text-left">
                <div className="shrink-0">
                  <FeatureIcon id={f.icon} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-sans text-sm font-bold text-[color:var(--sf-accent)] sm:text-base">
                    {f.title}
                  </h3>
                  <p className="mt-1 font-sans text-xs leading-relaxed text-[color:var(--sf-accent-text-60)] sm:text-sm">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    case "faq":
      if (isCatalogue) {
        return <MinimalCatalogueFaq section={section} />;
      }
      return (
        <section className="px-4 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-serif text-3xl font-light text-[color:var(--sf-accent)]">
              {section.title}
            </h2>
            <div className="mt-8 divide-y divide-[color:var(--sf-accent-border-10)] rounded-xl border border-[color:var(--sf-accent-border-10)] bg-white">
              {section.items.map((item, i) => (
                <div key={`${item.question}-${i}`} className="p-5">
                  <h3 className="font-sans text-sm font-bold text-[color:var(--sf-accent)]">
                    {item.question}
                  </h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-60)]">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    case "contactCta": {
      if (isCatalogue) {
        return (
          <MinimalCatalogueContactCta section={section} basePath={basePath} />
        );
      }
      const href = resolveStorefrontHref(
        { label: section.buttonLabel, href: section.href.trim() || "#" },
        basePath,
      );
      const isExternal =
        /^https?:\/\//i.test(href) || href.startsWith("mailto:");
      const isWhatsApp = /wa\.me|whatsapp/i.test(href);

      return (
        <section
          className="relative overflow-hidden px-4 py-16 sm:px-8 sm:py-24"
          aria-labelledby={`${section.id}-heading`}
        >
          <div className="absolute inset-0 bg-[color:var(--sf-accent)]" />
          <div className="absolute inset-0 bg-gradient-to-tl from-black/30 via-transparent to-white/10" />

          <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">
              {isWhatsApp ? "WhatsApp" : "Contact"}
            </p>
            <h2
              id={`${section.id}-heading`}
              className="mt-4 font-serif text-4xl font-light text-white sm:text-5xl"
            >
              {section.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-sans text-sm leading-relaxed text-white/75 sm:text-base">
              {section.body}
            </p>
            <a
              href={href}
              {...(isExternal
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="mt-10 inline-flex items-center justify-center gap-2 bg-white px-8 py-3.5 font-sans text-sm font-semibold text-[color:var(--sf-accent)] transition-opacity hover:opacity-90"
            >
              {isWhatsApp ? (
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="h-4 w-4 fill-current"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 6.045L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              ) : null}
              {section.buttonLabel}
            </a>
            {isWhatsApp ? (
              <p className="mt-4 font-sans text-xs text-white/55">
                Usually replies within a few hours
              </p>
            ) : null}
          </div>
        </section>
      );
    }
    case "contact":
      return <ContactSection section={section} config={config} />;
    case "testimonials":
      return <TestimonialsSection section={section} />;
    case "instagramGallery":
      return (
        <InstagramGallerySection section={section} isEditing={isEditing} />
      );
    case "newsletter":
      return <NewsletterSection section={section} />;
  }
}

export function StorefrontSections({
  sections,
  config,
  workspaceId,
  basePath,
  isEditing = false,
  onMoveSection,
  onAddSection,
  onEditSection,
  onRemoveSection,
}: {
  sections: StorefrontSection[];
  config: StorefrontConfig;
  workspaceId?: string;
  basePath?: string;
  isEditing?: boolean;
  onMoveSection?: (from: number, to: number) => void;
  onAddSection?: (type: StorefrontSection["type"], index: number) => void;
  onEditSection?: (sectionId: string) => void;
  onRemoveSection?: (index: number) => void;
}) {
  const isCatalogue = isCatalogueTemplate(config.templateId);
  const [dragState, setDragState] = useState<SectionDragState | null>(null);
  const dragStateRef = useRef<SectionDragState | null>(null);
  const scrollParentRef = useRef<HTMLElement | Window | null>(null);
  const pointerPositionRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    if (!dragState) return;

    function updateDrag(event: globalThis.PointerEvent) {
      pointerPositionRef.current = { x: event.clientX, y: event.clientY };
      setDragState((current) =>
        current
          ? { ...current, x: event.clientX, y: event.clientY }
          : current,
      );
    }

    function finishDrag(event: globalThis.PointerEvent) {
      const current = dragStateRef.current;
      if (!current) return;
      const dropTarget = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-section-drop-index]");
      const dropIndex = Number.parseInt(
        dropTarget?.dataset.sectionDropIndex ?? "",
        10,
      );
      if (Number.isInteger(dropIndex)) {
        const to = current.index < dropIndex ? dropIndex - 1 : dropIndex;
        onMoveSection?.(current.index, to);
      }
      setDragState(null);
      pointerPositionRef.current = null;
      scrollParentRef.current = null;
    }

    window.addEventListener("pointermove", updateDrag);
    window.addEventListener("pointerup", finishDrag, { once: true });
    window.addEventListener("pointercancel", finishDrag, { once: true });

    return () => {
      window.removeEventListener("pointermove", updateDrag);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, [dragState, onMoveSection]);

  useEffect(() => {
    if (!dragState) return;

    const interval = window.setInterval(() => {
      const position = pointerPositionRef.current;
      const scrollParent = scrollParentRef.current;
      if (!position || !scrollParent) return;

      const rect =
        scrollParent instanceof Window
          ? { top: 0, bottom: window.innerHeight }
          : scrollParent.getBoundingClientRect();
      const edgeSize = 96;
      const maxStep = 18;
      let step = 0;

      if (position.y < rect.top + edgeSize) {
        step = -Math.ceil(((rect.top + edgeSize - position.y) / edgeSize) * maxStep);
      } else if (position.y > rect.bottom - edgeSize) {
        step = Math.ceil(((position.y - (rect.bottom - edgeSize)) / edgeSize) * maxStep);
      }

      if (step === 0) return;
      if (scrollParent instanceof Window) {
        scrollParent.scrollBy({ top: step });
      } else {
        scrollParent.scrollTop += step;
      }
    }, 16);

    return () => window.clearInterval(interval);
  }, [dragState]);

  function startSectionDrag(
    event: PointerEvent<HTMLButtonElement>,
    section: StorefrontSection,
    index: number,
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const libraryItem = SITE_SECTION_LIBRARY.find(
      (item) => item.type === section.type,
    );
    const label = libraryItem
      ? sectionLibraryLabel(libraryItem, isCatalogue)
      : section.type;
    scrollParentRef.current = getScrollParent(event.currentTarget);
    pointerPositionRef.current = { x: event.clientX, y: event.clientY };
    setDragState({ index, label, x: event.clientX, y: event.clientY });
  }

  function renderDropZone(index: number) {
    if (!isEditing || (!onMoveSection && !onAddSection && !onRemoveSection)) {
      return null;
    }
    const isDragging = dragState !== null;
    const sectionAboveIndex = index - 1;
    const canRemoveAbove =
      Boolean(onRemoveSection) &&
      sectionAboveIndex >= 0 &&
      sectionAboveIndex < sections.length;

    return (
      <div
        key={`section-drop-${index}`}
        data-section-drop-index={index}
        className={`mx-4 my-2 rounded-lg border border-dashed px-4 py-3 font-sans transition-colors sm:mx-8 ${
          isDragging
            ? "border-primary-blue bg-white text-primary-blue shadow-sm"
            : "border-primary-blue/25 bg-white/80 text-primary-blue/55"
        }`}
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          {isDragging && onMoveSection ? (
            <span className="rounded-full bg-primary-blue px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
              Put it here
            </span>
          ) : null}
          {onAddSection ? (
            <>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em]">
                + Add section:
              </span>
              {SITE_SECTION_LIBRARY.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => onAddSection(item.type, index)}
                  className="rounded-full border border-primary-blue/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-primary-blue shadow-sm"
                >
                  + {sectionLibraryLabel(item, isCatalogue)}
                </button>
              ))}
            </>
          ) : null}
          {canRemoveAbove ? (
            <button
              type="button"
              onClick={() => onRemoveSection?.(sectionAboveIndex)}
              className="rounded-full border border-red-700/25 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700 shadow-sm"
              title="Remove the section above"
            >
              − Remove
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  function renderEditableFrame(
    section: StorefrontSection,
    index: number,
    children: ReactNode,
  ) {
    if (!isEditing || (!onMoveSection && !onEditSection && !onRemoveSection)) {
      return children;
    }
    const isDraggingThisSection = dragState?.index === index;
    return (
      <div
        key={section.id}
        className={`group/section relative ring-inset transition-opacity ${
          isDraggingThisSection ? "opacity-45" : ""
        }`}
      >
        <div className="pointer-events-none absolute inset-0 z-20 ring-2 ring-primary-blue/35" />
        <div className="absolute left-3 top-3 z-30 flex flex-wrap items-center gap-1 rounded-full border border-primary-blue/20 bg-white/95 p-1.5 shadow-lg backdrop-blur">
          {onMoveSection ? (
            <button
              type="button"
              onPointerDown={(event) => startSectionDrag(event, section, index)}
              className="flex h-8 w-8 touch-none cursor-grab items-center justify-center rounded-full bg-primary-blue font-sans text-[13px] font-bold leading-none text-white active:cursor-grabbing"
              aria-label={`Drag section ${index + 1}`}
              title="Hold and drag this section"
            >
              ⋮⋮
            </button>
          ) : null}
        </div>
        <div className="absolute right-3 top-3 z-30 flex items-center gap-1">
          {onRemoveSection ? (
            <button
              type="button"
              onClick={() => onRemoveSection(index)}
              className="flex h-8 cursor-pointer items-center justify-center rounded-full border border-red-700/25 bg-white/95 px-2.5 font-sans text-[11px] font-semibold text-red-700 shadow-lg backdrop-blur transition-colors hover:bg-red-50"
              aria-label={`Remove section ${index + 1}`}
              title="Remove this section"
            >
              Remove
            </button>
          ) : null}
          {onEditSection ? (
            <button
              type="button"
              onClick={() => onEditSection(section.id)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-primary-blue/20 bg-white/95 text-primary-blue shadow-lg backdrop-blur transition-colors hover:bg-blue-gray/30"
              aria-label={`Edit section ${index + 1}`}
              title="Edit this section"
            >
              <svg
                aria-hidden
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 7.125L16.875 4.5"
                />
              </svg>
            </button>
          ) : null}
        </div>
        {children}
      </div>
    );
  }

  function renderSectionEntry(section: StorefrontSection, index: number) {
    return renderEditableFrame(
      section,
      index,
      <StorefrontSectionRenderer
        section={section}
        config={config}
        workspaceId={workspaceId}
        basePath={basePath}
        isEditing={isEditing}
      />,
    );
  }

  const sectionGroups: SectionRenderGroup[] = [];
  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    if (
      section.desktopLayout === "half" &&
      sections[index + 1]?.desktopLayout === "half"
    ) {
      sectionGroups.push({
        type: "row",
        items: [
          { section, index },
          { section: sections[index + 1], index: index + 1 },
        ],
      });
      index += 1;
    } else {
      sectionGroups.push({ type: "single", section, index });
    }
  }

  return (
    <>
      {dragState ? (
        <div
          className="pointer-events-none fixed z-[120] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-primary-blue/20 bg-white/95 px-4 py-3 font-sans text-xs font-bold uppercase tracking-[0.12em] text-primary-blue shadow-2xl"
          style={{ left: dragState.x, top: dragState.y }}
        >
          Moving {dragState.label}
          <div className="mt-1 text-[10px] font-semibold normal-case tracking-normal text-primary-blue/55">
            Release over “Put it here”
          </div>
        </div>
      ) : null}
      {isEditing ? renderDropZone(0) : null}
      {sectionGroups.map((group) => {
        if (group.type === "single") {
          return (
            <div key={group.section.id}>
              {renderSectionEntry(group.section, group.index)}
              {renderDropZone(group.index + 1)}
            </div>
          );
        }

        const lastIndex = group.items[group.items.length - 1].index;
        return (
          <div key={group.items.map((item) => item.section.id).join("-")}>
            <div className="mx-4 grid gap-4 sm:mx-8 md:grid-cols-2">
              {group.items.map(({ section, index }) => (
                <div key={section.id} className="min-w-0">
                  {renderSectionEntry(section, index)}
                </div>
              ))}
            </div>
            {renderDropZone(lastIndex + 1)}
          </div>
        );
      })}
    </>
  );
}
