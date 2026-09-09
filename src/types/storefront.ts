import type { StorefrontFontPairId } from "@/lib/storefront-fonts";

export type { StorefrontFontPairId } from "@/lib/storefront-fonts";

export type StorefrontTemplateId =
  | "classic-boutique"
  | "minimal-catalogue"
  | "artisan-atelier";

/** Visual preset (surfaces + default accent). See `src/lib/storefront-themes.ts`. */
export type StorefrontThemeId =
  | "blue"
  | "red"
  | "ink"
  | "forest"
  | "teal"
  | "stone";

export type StorefrontLink = {
  label: string;
  href: string;
};

export type StorefrontProductPlaceholder = {
  title: string;
  priceLabel: string;
  imageUrl: string;
};

export type StorefrontPromoCard = {
  title: string;
  description: string;
  buttonLabel: string;
  imageUrl: string;
  href: string;
};

export type StorefrontFeatureIconId = "check" | "truck" | "sparkle";

export type StorefrontFeature = {
  title: string;
  description: string;
  icon: StorefrontFeatureIconId;
};

export type StorefrontFaqItem = {
  question: string;
  answer: string;
};

export type StorefrontSectionBase = {
  id: string;
  desktopLayout?: "full" | "half";
};

export type StorefrontHeroSection = StorefrontSectionBase & {
  type: "hero";
  imageUrl: string;
  heading: string;
  subheading: string;
  /** `null` hides the button on the storefront. */
  primaryCta: StorefrontLink | null;
  /** `null` hides the button on the storefront. */
  secondaryCta: StorefrontLink | null;
};

export type StorefrontFeaturedProductsSection = StorefrontSectionBase & {
  type: "featuredProducts";
  title: string;
  /** `null` hides the View all button. */
  viewAll: StorefrontLink | null;
  /**
   * How many catalogue products to show (default 4).
   * `null` = show all matching products.
   */
  limit?: number | null;
};

export type StorefrontPromoBannerSection = StorefrontSectionBase & {
  type: "promoBanner";
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  imageUrl: string;
};

export type StorefrontTextImageSection = StorefrontSectionBase & {
  type: "textImage";
  eyebrow: string;
  title: string;
  body: string;
  imageUrl: string;
  imagePosition: "left" | "right";
  cta: StorefrontLink;
};

export type StorefrontFeaturesSection = StorefrontSectionBase & {
  type: "features";
  title: string;
  items: StorefrontFeature[];
};

export type StorefrontFaqSection = StorefrontSectionBase & {
  type: "faq";
  title: string;
  items: StorefrontFaqItem[];
};

export type StorefrontContactCtaSection = StorefrontSectionBase & {
  type: "contactCta";
  title: string;
  body: string;
  buttonLabel: string;
  href: string;
};

/** Full contact page block: channels + local form (no backend yet). */
export type StorefrontContactSection = StorefrontSectionBase & {
  type: "contact";
  eyebrow: string;
  title: string;
  body: string;
  email: string;
  hours: string;
  note: string;
  whatsappLabel: string;
  /** Empty → build from config.whatsappNumber. */
  whatsappHref: string;
  formTitle: string;
  submitLabel: string;
  successMessage: string;
};

export type StorefrontTestimonial = {
  quote: string;
  name: string;
  role: string;
  imageUrl: string;
};

export type StorefrontTestimonialsSection = StorefrontSectionBase & {
  type: "testimonials";
  title: string;
  items: StorefrontTestimonial[];
};

export type StorefrontInstagramImage = {
  imageUrl: string;
  href: string;
};

export type StorefrontInstagramGallerySection = StorefrontSectionBase & {
  type: "instagramGallery";
  title: string;
  handle: string;
  images: StorefrontInstagramImage[];
};

export type StorefrontNewsletterSection = StorefrontSectionBase & {
  type: "newsletter";
  title: string;
  body: string;
  placeholder: string;
  buttonLabel: string;
  successMessage: string;
};

export type StorefrontCategoryCard = {
  name: string;
  imageUrl: string;
  href: string;
};

export type StorefrontShopByCategorySection = StorefrontSectionBase & {
  type: "shopByCategory";
  title: string;
  viewAll: StorefrontLink;
  /** Manual cards. If empty, categories are derived from active products. */
  categories: StorefrontCategoryCard[];
};

export type StorefrontNewArrivalsSection = StorefrontSectionBase & {
  type: "newArrivals";
  /** Empty string hides the heading. */
  title: string;
  /** Small label above the title (e.g. "Just landed"). Empty hides it. */
  eyebrow: string;
  /** `null` hides the View all button. */
  viewAll: StorefrontLink | null;
  /**
   * How many products to show (teaser ~4, full page ~48).
   * `null` = show all new arrivals.
   */
  limit?: number | null;
};

export type StorefrontSaleSection = StorefrontSectionBase & {
  type: "sale";
  /** Empty string hides the eyebrow. */
  eyebrow: string;
  /** Empty string hides the heading. */
  title: string;
  /** Empty string hides the description. */
  description: string;
  /** `null` hides the View all button. */
  viewAll: StorefrontLink | null;
  imageUrl: string;
  /**
   * How many on-sale products to show (teaser ~4, full page ~48).
   * `null` = show all sale products.
   */
  limit?: number | null;
};

export type StorefrontSection =
  | StorefrontHeroSection
  | StorefrontFeaturedProductsSection
  | StorefrontPromoBannerSection
  | StorefrontTextImageSection
  | StorefrontFeaturesSection
  | StorefrontFaqSection
  | StorefrontContactCtaSection
  | StorefrontContactSection
  | StorefrontTestimonialsSection
  | StorefrontInstagramGallerySection
  | StorefrontNewsletterSection
  | StorefrontShopByCategorySection
  | StorefrontNewArrivalsSection
  | StorefrontSaleSection;

export type StorefrontCustomPage = {
  id: string;
  title: string;
  slug: string;
  sections: StorefrontSection[];
};

/** Editable banner copy for system shop routes (`/shop`, `?collection=new|sale`). */
export type StorefrontCollectionPageConfig = {
  eyebrow: string;
  title: string;
  description: string;
  /** Optional banner image; falls back to template default media. */
  imageUrl: string;
  /** Per-page search / tabs / category filters. */
  chrome: StorefrontShopChromeConfig;
};

export type StorefrontCollectionPages = {
  shop: StorefrontCollectionPageConfig;
  new: StorefrontCollectionPageConfig;
  sale: StorefrontCollectionPageConfig;
};

export type StorefrontCollectionPageId = keyof StorefrontCollectionPages;

/** Shop page chrome: search, collection tabs, category chips (per collection page). */
export type StorefrontShopChromeConfig = {
  showSearch: boolean;
  showCollectionTabs: boolean;
  showCategoryFilters: boolean;
  /** Individual tab visibility (when `showCollectionTabs` is true). */
  tabAll: boolean;
  tabNew: boolean;
  tabSale: boolean;
};

export type StorefrontConfig = {
  templateId: StorefrontTemplateId;
  themeId: StorefrontThemeId;
  /** Bump when schema changes (migration in `upgradeStorefrontConfig`). */
  configVersion: number;

  shopName: string;
  tagline: string;
  /** Header/footer logo from workspace media. Empty = text brand mark. */
  logoUrl: string;
  /** Browser tab icon from workspace media. */
  faviconUrl: string;
  /** Google Fonts pair — see `src/lib/storefront-fonts.ts`. */
  fontPairId: StorefrontFontPairId;

  /** Top nav (e.g. Shop, Collections, …) */
  navLinks: StorefrontLink[];
  /** Which `navLinks` index shows the active underline (0-based). */
  activeNavIndex: number;

  /** Full-bleed hero background image */
  heroBackgroundImageUrl: string;
  heroHeading: string;
  heroSubheading: string;
  heroPrimaryCta: StorefrontLink;
  heroSecondaryCta: StorefrontLink;

  featuredTitle: string;
  featuredViewAll: StorefrontLink;

  /** Featured grid (four columns on large screens). */
  products: StorefrontProductPlaceholder[];

  /** Two promo tiles (wide / narrow split on desktop). */
  promos: [StorefrontPromoCard, StorefrontPromoCard];
  features: [StorefrontFeature, StorefrontFeature, StorefrontFeature];
  sections: StorefrontSection[];
  pages: StorefrontCustomPage[];
  /** System Shop / New / Sale collection pages (editable in Pages). */
  collectionPages: StorefrontCollectionPages;

  footerBlurb: string;
  footerShopLinks: StorefrontLink[];
  footerPolicyLinks: StorefrontLink[];
  footerConnectLinks: StorefrontLink[];
  copyrightLine: string;

  /** Shown on cart badge in nav */
  cartCountLabel: string;

  whatsappNumber: string;
  accentColor: string;

  updatedAt: number;
};

export type StorefrontSeed = Omit<StorefrontConfig, "updatedAt">;
