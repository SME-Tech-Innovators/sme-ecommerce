import type { StorefrontSection } from "@/types/storefront";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function link(value: unknown): { label: string; href: string } | null | undefined {
  if (value == null) return value as null;
  if (!isRecord(value)) return undefined;
  const label = str(value.label);
  const href = str(value.href);
  if (!label || !href) return undefined;
  return { label, href };
}

/** Maps legacy nested `content` + alias fields into flat v5 section shape. */
export function normalizeStorefrontSectionFromApi(
  section: unknown,
): StorefrontSection | null {
  if (!isRecord(section) || typeof section.type !== "string") return null;

  const nested = isRecord(section.content) ? section.content : null;
  const flat: JsonRecord = nested
    ? { ...section, ...nested, content: undefined }
    : { ...section };

  if (str(flat.headline) && !str(flat.heading)) {
    flat.heading = flat.headline;
  }
  if (str(flat.subheadline) && !str(flat.subheading)) {
    flat.subheading = flat.subheadline;
  }
  if (str(flat.subHeading) && !str(flat.subheading)) {
    flat.subheading = flat.subHeading;
  }
  if (str(flat.image) && !str(flat.imageUrl)) {
    flat.imageUrl = flat.image;
  }
  if (str(flat.backgroundImageUrl) && !str(flat.imageUrl)) {
    flat.imageUrl = flat.backgroundImageUrl;
  }

  switch (flat.type) {
    case "hero":
      flat.primaryCta = link(flat.primaryCta) ?? flat.primaryCta ?? null;
      flat.secondaryCta = link(flat.secondaryCta) ?? flat.secondaryCta ?? null;
      break;
    case "featuredProducts":
      flat.viewAll = link(flat.viewAll) ?? flat.viewAll ?? null;
      break;
    case "features":
      if (!Array.isArray(flat.items) && Array.isArray(flat.features)) {
        flat.items = flat.features;
      }
      break;
    case "faq":
      if (!Array.isArray(flat.items) && Array.isArray(flat.questions)) {
        flat.items = flat.questions;
      }
      break;
    case "contactCta":
      flat.buttonLabel =
        str(flat.buttonLabel) ?? str(flat.ctaLabel) ?? "Contact us";
      flat.href = str(flat.href) ?? str(flat.buttonHref) ?? "@page:contact";
      break;
    case "promoBanner":
      flat.buttonLabel =
        str(flat.buttonLabel) ?? str(flat.ctaLabel) ?? "Shop now";
      flat.href = str(flat.href) ?? str(flat.buttonHref) ?? "@shop";
      break;
    case "textImage":
      flat.cta = link(flat.cta) ?? { label: "Learn more", href: "#" };
      break;
    default:
      break;
  }

  delete flat.content;
  delete flat.headline;
  delete flat.subheadline;
  delete flat.subHeading;
  delete flat.image;
  delete flat.backgroundImageUrl;

  return flat as StorefrontSection;
}

function normalizeSections(raw: unknown): StorefrontSection[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .map(normalizeStorefrontSectionFromApi)
    .filter((section): section is StorefrontSection => section != null);
}

function normalizePages(raw: unknown): StorefrontConfigPages | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((page) => {
    if (!isRecord(page)) return page;
    return {
      ...page,
      sections: normalizeSections(page.sections) ?? page.sections,
    };
  }) as StorefrontConfigPages;
}

type StorefrontConfigPages = NonNullable<
  import("@/types/storefront").StorefrontConfig["pages"]
>;

/**
 * Normalizes API draft/public config into the flat v5 shape the renderer expects.
 * Handles legacy v1 sections `{ type, content: { headline, … } }`.
 */
export function normalizeStorefrontConfigFromApi(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const configVersion = Number(raw.configVersion ?? 1);
  const sections = normalizeSections(raw.sections);
  const pages = normalizePages(raw.pages);

  const heroSection = sections?.find((section) => section.type === "hero");
  const hero =
    heroSection && heroSection.type === "hero"
      ? (heroSection as {
          heading?: string;
          subheading?: string;
          imageUrl?: string;
          primaryCta?: { label: string; href: string } | null;
          secondaryCta?: { label: string; href: string } | null;
        })
      : null;

  return {
    ...raw,
    configVersion,
    sections: sections ?? raw.sections,
    pages: pages ?? raw.pages,
    heroHeading: raw.heroHeading ?? hero?.heading,
    heroSubheading: raw.heroSubheading ?? hero?.subheading,
    heroBackgroundImageUrl:
      raw.heroBackgroundImageUrl ?? hero?.imageUrl ?? raw.heroImageUrl,
    heroPrimaryCta: raw.heroPrimaryCta ?? hero?.primaryCta,
    heroSecondaryCta: raw.heroSecondaryCta ?? hero?.secondaryCta,
  };
}
