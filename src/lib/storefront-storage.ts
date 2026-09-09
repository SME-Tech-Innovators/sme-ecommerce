import { getStorefrontConfigFallback } from "@/lib/storefront-config-fallback";
import {
  defaultCollectionPages,
  mergeCollectionPages,
} from "@/lib/storefront-collection-pages";
import {
  STOREFRONT_DEFAULT_MEDIA,
  defaultInstagramImageUrl,
  defaultPromoImageUrl,
  withDefaultImageUrl,
} from "@/lib/storefront-default-media";
import { normalizeStorefrontFontPairId } from "@/lib/storefront-fonts";
import {
  STOREFRONT_THEME_DEFINITIONS,
  normalizeAccentColor,
  normalizeStorefrontThemeId,
} from "@/lib/storefront-themes";
import type {
  StorefrontConfig,
  StorefrontFeature,
  StorefrontFaqItem,
  StorefrontLink,
  StorefrontCustomPage,
  StorefrontProductPlaceholder,
  StorefrontPromoCard,
  StorefrontSection,
  StorefrontSeed,
  StorefrontShopChromeConfig,
  StorefrontTemplateId,
  StorefrontThemeId,
} from "@/types/storefront";

const STORAGE_PREFIX = "sme_storefront_v1_";

export function storefrontStorageKey(workspaceId: string): string {
  return `${STORAGE_PREFIX}${workspaceId}`;
}

function mergeLink(
  raw: StorefrontLink | undefined,
  seed: StorefrontLink,
): StorefrontLink {
  if (!raw) return { ...seed };
  return {
    label: String(raw.label ?? seed.label),
    href: String(raw.href ?? seed.href),
  };
}

/** Point Sale / New arrivals nav items at filtered shop collections. */
function upgradeShopCollectionLink(link: StorefrontLink): StorefrontLink {
  const label = link.label.trim().toLowerCase();
  const href = link.href.trim();
  if (
    (href === "@shop" || href === "#") &&
    (label === "sale" || label.includes("sale"))
  ) {
    return { ...link, href: "@shop/sale" };
  }
  if (
    (href === "@shop" || href === "#") &&
    (label === "new arrivals" ||
      label === "new arrival" ||
      label.includes("new arrival"))
  ) {
    return { ...link, href: "@shop/new" };
  }
  if (
    (href === "#" || href === "") &&
    (label === "contact" || label === "contact us")
  ) {
    return { ...link, href: "@page:contact" };
  }
  return link;
}

/** `null` = intentionally hidden; `undefined` = legacy missing → use seed. */
function mergeOptionalLink(
  raw: StorefrontLink | null | undefined,
  seed: StorefrontLink,
): StorefrontLink | null {
  if (raw === null) return null;
  return mergeLink(raw, seed);
}

/**
 * Persists section product limits.
 * `null` means "show all"; omit / invalid falls back to `fallback`.
 */
function clampSectionProductLimit(
  raw: unknown,
  fallback: number | null | undefined,
): number | null | undefined {
  if (raw === null) return null;
  if (raw === undefined || raw === "") return fallback;
  if (typeof raw === "string" && raw.trim().toLowerCase() === "all") {
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(48, Math.max(1, Math.floor(n)));
}

function mergeLinkList(
  raw: StorefrontLink[] | undefined,
  seed: StorefrontLink[],
): StorefrontLink[] {
  if (!raw?.length) return [...seed];
  return raw.map((l, i) => mergeLink(l, seed[Math.min(i, seed.length - 1)]));
}

function mergeProducts(
  raw: StorefrontProductPlaceholder[] | undefined,
  seed: StorefrontProductPlaceholder[],
): StorefrontProductPlaceholder[] {
  const base = seed.length
    ? seed
    : [{ title: "New product", priceLabel: "R 0.00", imageUrl: "" }];
  if (!raw?.length) return [...base];
  const mapped = raw.map((p, i) => {
    const s = base[Math.min(i, base.length - 1)];
    return {
      title: String(p.title ?? s.title),
      priceLabel: String(p.priceLabel ?? s.priceLabel),
      imageUrl: String(p.imageUrl ?? s.imageUrl),
    };
  });
  while (mapped.length < base.length) {
    mapped.push({ ...base[mapped.length] });
  }
  return mapped;
}

function mergePromos(
  raw: StorefrontPromoCard[] | undefined,
  seed: [StorefrontPromoCard, StorefrontPromoCard],
): [StorefrontPromoCard, StorefrontPromoCard] {
  if (!raw || raw.length !== 2) return [...seed] as [StorefrontPromoCard, StorefrontPromoCard];
  return raw.map((card, i) => {
    const s = seed[i];
    return {
      title: String(card.title ?? s.title),
      description: String(card.description ?? s.description),
      buttonLabel: String(card.buttonLabel ?? s.buttonLabel),
      imageUrl: String(card.imageUrl ?? s.imageUrl),
      href: String(card.href ?? s.href),
    };
  }) as [StorefrontPromoCard, StorefrontPromoCard];
}

const VALID_ICONS = new Set(["check", "truck", "sparkle"]);
const VALID_SECTION_TYPES = new Set<StorefrontSection["type"]>([
  "hero",
  "featuredProducts",
  "promoBanner",
  "textImage",
  "features",
  "faq",
  "contactCta",
  "contact",
  "testimonials",
  "instagramGallery",
  "newsletter",
  "shopByCategory",
  "newArrivals",
  "sale",
]);
const VALID_DESKTOP_LAYOUTS = new Set(["full", "half"]);

function mergeFeatures(
  raw: StorefrontFeature[] | undefined,
  seed: [StorefrontFeature, StorefrontFeature, StorefrontFeature],
): [StorefrontFeature, StorefrontFeature, StorefrontFeature] {
  if (!raw || raw.length !== 3) return [...seed] as [StorefrontFeature, StorefrontFeature, StorefrontFeature];
  return raw.map((f, i) => {
    const s = seed[i];
    const ic = typeof f.icon === "string" ? f.icon : "";
    const icon = VALID_ICONS.has(ic)
      ? (ic as StorefrontFeature["icon"])
      : s.icon;
    return {
      title: String(f.title ?? s.title),
      description: String(f.description ?? s.description),
      icon,
    };
  }) as [StorefrontFeature, StorefrontFeature, StorefrontFeature];
}

function mergeFeatureItems(
  raw: StorefrontFeature[] | undefined,
  seed: StorefrontFeature[],
): StorefrontFeature[] {
  const base = seed.length ? seed : getDefaultStorefrontSeed().features;
  if (!raw?.length) return [...base];
  return raw.map((f, i) => {
    const s = base[Math.min(i, base.length - 1)];
    const ic = typeof f.icon === "string" ? f.icon : "";
    const icon = VALID_ICONS.has(ic)
      ? (ic as StorefrontFeature["icon"])
      : s.icon;
    return {
      title: String(f.title ?? s.title),
      description: String(f.description ?? s.description),
      icon,
    };
  });
}

function sectionId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

function defaultHomeSections(config: StorefrontConfig): StorefrontSection[] {
  return [
    {
      id: "home-hero",
      type: "hero",
      imageUrl: withDefaultImageUrl(
        config.heroBackgroundImageUrl,
        STOREFRONT_DEFAULT_MEDIA.hero,
      ),
      heading: String(config.heroHeading || "Welcome to our store"),
      subheading: String(config.heroSubheading || ""),
      primaryCta: mergeLink(config.heroPrimaryCta, {
        label: "Shop collection",
        href: "@shop",
      }),
      secondaryCta: mergeLink(config.heroSecondaryCta, {
        label: "Learn more",
        href: "#",
      }),
    },
    {
      id: "home-features",
      type: "features",
      title: "Why shop with us",
      items: config.features,
    },
    {
      id: "home-featured-products",
      type: "featuredProducts",
      title: String(config.featuredTitle || "Featured products"),
      viewAll: mergeLink(config.featuredViewAll, {
        label: "View all",
        href: "@shop",
      }),
      limit: 4,
    },
    ...config.promos.map((promo, index) => ({
      id: `home-promo-${index + 1}`,
      type: "promoBanner" as const,
      title: String(promo.title || "Promotion"),
      description: String(promo.description || ""),
      buttonLabel: String(promo.buttonLabel || "Shop now"),
      imageUrl: withDefaultImageUrl(promo.imageUrl, defaultPromoImageUrl(index)),
      href: String(promo.href || "#"),
    })),
    {
      id: "home-contact",
      type: "contactCta",
      title: "Need help choosing?",
      body: "Message us and we will help you find the right pieces for your order.",
      buttonLabel: "Contact us",
      href: "@page:contact",
    },
  ];
}

function mergeFaqItems(raw: StorefrontFaqItem[] | undefined): StorefrontFaqItem[] {
  if (!raw?.length) {
    return [
      {
        question: "How do I place an order?",
        answer: "Browse the shop, add products to your cart, and complete checkout.",
      },
      {
        question: "Can I contact you before ordering?",
        answer: "Yes, use the contact button and we will help you on WhatsApp.",
      },
    ];
  }
  return raw.map((item) => ({
    question: String(item.question ?? "Question"),
    answer: String(item.answer ?? "Answer"),
  }));
}

function mergeSection(
  raw: StorefrontSection | undefined,
  fallback: StorefrontSection,
  index: number,
): StorefrontSection {
  if (!raw || !VALID_SECTION_TYPES.has(raw.type)) {
    return { ...fallback, id: fallback.id || sectionId("section", index) };
  }
  const id = String(raw.id || fallback.id || sectionId(raw.type, index));
  const desktopLayout = VALID_DESKTOP_LAYOUTS.has(raw.desktopLayout ?? "")
    ? raw.desktopLayout
    : fallback.desktopLayout;
  switch (raw.type) {
    case "hero":
      return {
        ...raw,
        id,
        desktopLayout,
        imageUrl: withDefaultImageUrl(
          raw.imageUrl,
          STOREFRONT_DEFAULT_MEDIA.hero,
        ),
        heading: String(raw.heading ?? "Welcome to our store"),
        subheading: String(raw.subheading ?? ""),
        primaryCta: mergeOptionalLink(raw.primaryCta, {
          label: "Shop collection",
          href: "@shop",
        }),
        secondaryCta: mergeOptionalLink(raw.secondaryCta, {
          label: "Learn more",
          href: "#",
        }),
      };
    case "featuredProducts":
      return {
        ...raw,
        id,
        desktopLayout,
        title: String(raw.title ?? "Featured products"),
        viewAll: mergeOptionalLink(raw.viewAll, {
          label: "View all",
          href: "@shop",
        }),
        limit: clampSectionProductLimit(
          (raw as { limit?: unknown }).limit,
          undefined,
        ),
      };
    case "promoBanner":
      return {
        ...raw,
        id,
        desktopLayout,
        title: String(raw.title ?? "Promotion"),
        description: String(raw.description ?? ""),
        buttonLabel: String(raw.buttonLabel ?? "Shop now"),
        imageUrl: withDefaultImageUrl(raw.imageUrl, defaultPromoImageUrl(index)),
        href: String(raw.href ?? "#"),
      };
    case "textImage":
      return {
        ...raw,
        id,
        desktopLayout,
        eyebrow: String(raw.eyebrow ?? "Our story"),
        title: String(raw.title ?? "Tell customers what makes you different"),
        body: String(raw.body ?? ""),
        imageUrl: withDefaultImageUrl(
          raw.imageUrl,
          STOREFRONT_DEFAULT_MEDIA.textImage,
        ),
        imagePosition: raw.imagePosition === "left" ? "left" : "right",
        cta: mergeLink(raw.cta, { label: "Learn more", href: "#" }),
      };
    case "features":
      return {
        ...raw,
        id,
        desktopLayout,
        title: String(raw.title ?? "Why shop with us"),
        items: mergeFeatureItems(
          raw.items,
          fallback.type === "features"
            ? fallback.items
            : getDefaultStorefrontSeed().features,
        ),
      };
    case "faq":
      return {
        ...raw,
        id,
        desktopLayout,
        title: String(raw.title ?? "Frequently asked questions"),
        items: mergeFaqItems(raw.items),
      };
    case "contactCta": {
      const rawHref = String(raw.href ?? "@page:contact").trim();
      return {
        ...raw,
        id,
        desktopLayout,
        title: String(raw.title ?? "Contact us"),
        body: String(raw.body ?? ""),
        buttonLabel: String(raw.buttonLabel ?? "Contact us"),
        href: rawHref === "#" || !rawHref ? "@page:contact" : rawHref,
      };
    }
    case "contact": {
      const c = raw as StorefrontSection & { type: "contact" };
      return {
        ...raw,
        id,
        desktopLayout,
        type: "contact",
        eyebrow: String(c.eyebrow ?? "Contact"),
        title: String(c.title ?? "Get in touch"),
        body: String(
          c.body ??
            "Questions about an order, sizing, or what to choose — we are happy to help.",
        ),
        email: String(c.email ?? "hello@example.com"),
        hours: String(c.hours ?? "Mon–Fri, 9:00–17:00"),
        note: String(c.note ?? "Usually replies within a few hours."),
        whatsappLabel: String(c.whatsappLabel ?? "Chat on WhatsApp"),
        whatsappHref: String(c.whatsappHref ?? ""),
        formTitle: String(c.formTitle ?? "Send a message"),
        submitLabel: String(c.submitLabel ?? "Send message"),
        successMessage: String(
          c.successMessage ??
            "Thanks — we have your message and will reply soon.",
        ),
      };
    }
    case "testimonials":
      return {
        ...raw,
        id,
        desktopLayout,
        title: String(raw.title ?? "What customers say"),
        items: Array.isArray(raw.items)
          ? raw.items.map((item) => ({
              quote: String(item.quote ?? ""),
              name: String(item.name ?? "Customer"),
              role: String(item.role ?? ""),
              imageUrl: String(item.imageUrl ?? ""),
            }))
          : [
              {
                quote: "Beautiful products and such an easy ordering experience.",
                name: "Thandi M.",
                role: "Cape Town",
                imageUrl: "",
              },
            ],
      };
    case "instagramGallery":
      return {
        ...raw,
        id,
        desktopLayout,
        title: String(raw.title ?? "Follow us"),
        handle: String(raw.handle ?? "@yourstore"),
        images: Array.isArray(raw.images)
          ? raw.images.map((item, i) => ({
              imageUrl: withDefaultImageUrl(
                item.imageUrl,
                defaultInstagramImageUrl(i),
              ),
              href: String(item.href ?? "#"),
            }))
          : [
              { imageUrl: defaultInstagramImageUrl(0), href: "#" },
              { imageUrl: defaultInstagramImageUrl(1), href: "#" },
              { imageUrl: defaultInstagramImageUrl(2), href: "#" },
              { imageUrl: defaultInstagramImageUrl(3), href: "#" },
            ],
      };
    case "newsletter":
      return {
        ...raw,
        id,
        desktopLayout,
        title: String(raw.title ?? "Stay in the loop"),
        body: String(
          raw.body ?? "Get new arrivals and offers first. No spam.",
        ),
        placeholder: String(raw.placeholder ?? "you@email.com"),
        buttonLabel: String(raw.buttonLabel ?? "Subscribe"),
        successMessage: String(
          raw.successMessage ?? "Thanks — you are on the list.",
        ),
      };
    case "shopByCategory":
      return {
        ...raw,
        id,
        desktopLayout,
        title: String(raw.title ?? "Shop by category"),
        viewAll: mergeLink(raw.viewAll, { label: "View all", href: "@shop" }),
        categories: Array.isArray(raw.categories)
          ? raw.categories.map((item) => ({
              name: String(item.name ?? "Category"),
              imageUrl: String(item.imageUrl ?? ""),
              href: String(item.href ?? "@shop"),
            }))
          : [],
      };
    case "newArrivals": {
      const na = raw as StorefrontSection & {
        type: "newArrivals";
        eyebrow?: string;
        viewAll?: StorefrontLink | null;
        limit?: unknown;
      };
      return {
        ...raw,
        id,
        desktopLayout,
        title: String(raw.title ?? "New arrivals"),
        eyebrow:
          typeof na.eyebrow === "string" ? na.eyebrow : "Just landed",
        viewAll: mergeOptionalLink(
          na.viewAll?.href === "@shop"
            ? { ...na.viewAll, href: "@shop/new" }
            : na.viewAll,
          {
            label: "Shop all new",
            href: "@shop/new",
          },
        ),
        limit: clampSectionProductLimit(na.limit, undefined),
      };
    }
    case "sale": {
      const sale = raw as StorefrontSection & {
        type: "sale";
        viewAll?: StorefrontLink | null;
        buttonLabel?: string;
        href?: string;
        limit?: unknown;
      };
      const legacyViewAll: StorefrontLink | null | undefined =
        sale.viewAll !== undefined
          ? sale.viewAll
          : sale.buttonLabel != null || sale.href != null
            ? {
                label: String(sale.buttonLabel ?? "Shop the sale"),
                href: String(sale.href ?? "@shop/sale"),
              }
            : undefined;
      return {
        ...raw,
        id,
        desktopLayout,
        eyebrow: String(raw.eyebrow ?? "Sale"),
        title: String(raw.title ?? "Limited-time offers"),
        description: String(
          raw.description ?? "Save on selected pieces while stocks last.",
        ),
        viewAll: mergeOptionalLink(
          legacyViewAll?.href === "@shop"
            ? { ...legacyViewAll, href: "@shop/sale" }
            : legacyViewAll,
          {
            label: "Shop the sale",
            href: "@shop/sale",
          },
        ),
        imageUrl: withDefaultImageUrl(
          raw.imageUrl,
          STOREFRONT_DEFAULT_MEDIA.saleBanner,
        ),
        limit: clampSectionProductLimit(sale.limit, undefined),
      };
    }
  }
}

function mergeSections(
  raw: StorefrontSection[] | undefined,
  fallback: StorefrontSection[],
): StorefrontSection[] {
  // Preserve intentional empty arrays (e.g. a new custom page with no sections).
  if (raw === undefined || raw === null) return fallback.map((section, index) =>
    mergeSection(section, fallback[Math.min(index, fallback.length - 1)], index),
  );
  if (raw.length === 0) return [];
  return raw.map((section, index) =>
    mergeSection(section, fallback[Math.min(index, fallback.length - 1)], index),
  );
}

function slugify(raw: string, fallback: string): string {
  const slug = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function defaultContactPage(): StorefrontCustomPage {
  return {
    id: "page-contact",
    title: "Contact",
    slug: "contact",
    sections: [
      {
        id: "contact-hero",
        type: "hero",
        imageUrl: STOREFRONT_DEFAULT_MEDIA.textImage,
        heading: "We’re here to help",
        subheading:
          "Orders, sizing, or what to choose — reach out and we’ll get back to you soon.",
        primaryCta: { label: "Shop collection", href: "@shop" },
        secondaryCta: null,
      },
      {
        id: "contact-main",
        type: "contact",
        eyebrow: "Contact",
        title: "Get in touch",
        body: "Prefer WhatsApp for a quick reply, or leave a message and we’ll follow up by email.",
        email: "hello@example.com",
        hours: "Mon–Fri, 9:00–17:00",
        note: "Usually replies within a few hours.",
        whatsappLabel: "Chat on WhatsApp",
        whatsappHref: "",
        formTitle: "Send a message",
        submitLabel: "Send message",
        successMessage: "Thanks — we have your message and will reply soon.",
      },
      {
        id: "contact-faq",
        type: "faq",
        title: "Before you write",
        items: [
          {
            question: "How do I track my order?",
            answer:
              "After checkout you’ll get an order confirmation. Reply to that email or message us with your order number.",
          },
          {
            question: "Do you ship everywhere?",
            answer:
              "We ship across South Africa. Delivery times depend on your location — ask us if you need a timeline.",
          },
          {
            question: "What’s the fastest way to reach you?",
            answer:
              "WhatsApp is usually fastest during business hours. Email works well for longer questions.",
          },
        ],
      },
    ],
  };
}

function mergePages(
  raw: StorefrontCustomPage[] | undefined,
  fallbackSections: StorefrontSection[],
): StorefrontCustomPage[] {
  const seedContact = defaultContactPage();
  if (!raw?.length) {
    return [
      {
        ...seedContact,
        sections: mergeSections(seedContact.sections, fallbackSections.slice(0, 1)),
      },
    ];
  }
  const pages = raw.map((page, index) => ({
    id: String(page.id || sectionId("page", index)),
    title: typeof page.title === "string" ? page.title : `Page ${index + 1}`,
    slug: slugify(page.slug || page.title, `page-${index + 1}`),
    sections: mergeSections(page.sections, fallbackSections.slice(0, 1)),
  }));
  const hasContact = pages.some((page) => page.slug === "contact");
  if (hasContact) return pages;
  return [
    ...pages,
    {
      ...seedContact,
      sections: mergeSections(seedContact.sections, fallbackSections.slice(0, 1)),
    },
  ];
}

export function upgradeStorefrontConfig(raw: StorefrontConfig): StorefrontConfig {
  const seed = getDefaultStorefrontSeed();
  type Legacy = StorefrontConfig & { heroImageUrl?: string };
  const legacy = raw as Legacy;
  const heroBg =
    legacy.heroBackgroundImageUrl?.trim() ||
    legacy.heroImageUrl?.trim() ||
    seed.heroBackgroundImageUrl;

  const navLen = legacy.navLinks?.length ?? 0;
  const navLinks =
    navLen >= 2
      ? legacy.navLinks!.map((l, i) =>
          upgradeShopCollectionLink(
            mergeLink(l, seed.navLinks[Math.min(i, seed.navLinks.length - 1)]),
          ),
        )
      : seed.navLinks.map(upgradeShopCollectionLink);
  const maxNav = Math.max(0, navLinks.length - 1);
  const activeNavIndex = Math.min(
    Math.max(0, Number(legacy.activeNavIndex ?? seed.activeNavIndex)),
    maxNav,
  );

  const rawThemeId = (legacy as StorefrontConfig & { themeId?: string })
    .themeId;
  const themeId = normalizeStorefrontThemeId(
    rawThemeId ?? seed.themeId,
  ) as StorefrontThemeId;
  const accentColor = normalizeAccentColor(
    legacy.accentColor ?? seed.accentColor,
    STOREFRONT_THEME_DEFINITIONS[themeId].defaultAccent,
  );

  const baseConfig = {
    ...seed,
    ...legacy,
    configVersion: Math.max(
      6,
      Number(legacy.configVersion ?? seed.configVersion ?? 4),
    ),
    themeId,
    heroBackgroundImageUrl: heroBg,
    navLinks,
    activeNavIndex,
    heroPrimaryCta: upgradeShopCollectionLink(
      mergeLink(legacy.heroPrimaryCta, seed.heroPrimaryCta),
    ),
    heroSecondaryCta: upgradeShopCollectionLink(
      mergeLink(legacy.heroSecondaryCta, seed.heroSecondaryCta),
    ),
    featuredViewAll: upgradeShopCollectionLink(
      mergeLink(legacy.featuredViewAll, seed.featuredViewAll),
    ),
    products: mergeProducts(legacy.products, seed.products),
    promos: mergePromos(legacy.promos, seed.promos),
    features: mergeFeatures(legacy.features, seed.features),
    footerShopLinks: mergeLinkList(
      legacy.footerShopLinks,
      seed.footerShopLinks,
    ).map(upgradeShopCollectionLink),
    footerPolicyLinks: mergeLinkList(
      legacy.footerPolicyLinks,
      seed.footerPolicyLinks,
    ),
    footerConnectLinks: mergeLinkList(
      legacy.footerConnectLinks,
      seed.footerConnectLinks,
    ).map(upgradeShopCollectionLink),
    footerBlurb: String(legacy.footerBlurb ?? seed.footerBlurb),
    copyrightLine: String(legacy.copyrightLine ?? seed.copyrightLine),
    cartCountLabel: String(legacy.cartCountLabel ?? seed.cartCountLabel),
    shopName: String(legacy.shopName ?? seed.shopName),
    tagline: String(legacy.tagline ?? seed.tagline),
    logoUrl: String(legacy.logoUrl ?? seed.logoUrl ?? ""),
    faviconUrl: String(legacy.faviconUrl ?? seed.faviconUrl ?? ""),
    fontPairId: normalizeStorefrontFontPairId(
      legacy.fontPairId ?? seed.fontPairId,
    ),
    featuredTitle: String(legacy.featuredTitle ?? seed.featuredTitle),
    heroHeading: String(legacy.heroHeading ?? seed.heroHeading),
    heroSubheading: String(legacy.heroSubheading ?? seed.heroSubheading),
    whatsappNumber: String(legacy.whatsappNumber ?? seed.whatsappNumber),
    accentColor,
    templateId: (legacy.templateId ||
      seed.templateId) as StorefrontTemplateId,
    collectionPages: mergeCollectionPages(
      (legacy as StorefrontConfig).collectionPages,
      seed.collectionPages ?? defaultCollectionPages(),
      (legacy as { shopChrome?: Partial<StorefrontShopChromeConfig> }).shopChrome,
    ),
  };
  const fallbackSections = defaultHomeSections(baseConfig);
  return {
    ...baseConfig,
    sections: mergeSections(legacy.sections, fallbackSections),
    pages: mergePages(legacy.pages, fallbackSections),
  };
}

export function loadStorefront(workspaceId: string): StorefrontConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storefrontStorageKey(workspaceId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StorefrontConfig;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.products)) return null;
    return upgradeStorefrontConfig(parsed);
  } catch {
    return null;
  }
}

export function saveStorefront(
  workspaceId: string,
  config: StorefrontConfig,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      storefrontStorageKey(workspaceId),
      JSON.stringify(config),
    );
  } catch {
    /* quota / private mode */
  }
}

/** @deprecated Prefer API template seeds; kept for config merge fallbacks only. */
export function getDefaultStorefrontSeed(): StorefrontSeed {
  return getStorefrontConfigFallback();
}
