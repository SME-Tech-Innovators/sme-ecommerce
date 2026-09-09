import { defaultCollectionPages } from "@/lib/storefront-collection-pages";
import { STOREFRONT_DEFAULT_MEDIA } from "@/lib/storefront-default-media";
import { DEFAULT_STOREFRONT_FONT_PAIR_ID } from "@/lib/storefront-fonts";
import type { StorefrontSeed } from "@/types/storefront";

/**
 * Structural defaults when merging incomplete API payloads — not template marketing copy.
 * Template seeds live in the backend (`storefront_template_versions.default_config`).
 */
export function getStorefrontConfigFallback(): StorefrontSeed {
  return {
    templateId: "classic-boutique",
    themeId: "blue",
    configVersion: 6,
    shopName: "Your shop",
    tagline: "",
    logoUrl: "",
    faviconUrl: "",
    fontPairId: DEFAULT_STOREFRONT_FONT_PAIR_ID,
    navLinks: [
      { label: "Shop", href: "@shop" },
      { label: "Contact", href: "@page:contact" },
    ],
    activeNavIndex: 0,
    heroBackgroundImageUrl: STOREFRONT_DEFAULT_MEDIA.hero,
    heroHeading: "Welcome to our store",
    heroSubheading: "Browse products and check out securely online.",
    heroPrimaryCta: { label: "Shop", href: "@shop" },
    heroSecondaryCta: { label: "Contact", href: "@page:contact" },
    featuredTitle: "Featured products",
    featuredViewAll: { label: "View all", href: "@shop" },
    products: [],
    promos: [
      {
        title: "Promotion",
        description: "",
        buttonLabel: "Shop",
        imageUrl: STOREFRONT_DEFAULT_MEDIA.promo[0],
        href: "@shop",
      },
      {
        title: "Promotion",
        description: "",
        buttonLabel: "Shop",
        imageUrl: STOREFRONT_DEFAULT_MEDIA.promo[1],
        href: "@shop",
      },
    ],
    features: [
      {
        title: "Secure checkout",
        description: "Card payments are encrypted and secure.",
        icon: "check",
      },
      {
        title: "Reliable delivery",
        description: "We ship orders with care.",
        icon: "truck",
      },
      {
        title: "Helpful support",
        description: "Message us if you need help.",
        icon: "sparkle",
      },
    ],
    sections: [],
    pages: [],
    collectionPages: defaultCollectionPages(),
    footerBlurb: "",
    footerShopLinks: [{ label: "Shop", href: "@shop" }],
    footerPolicyLinks: [],
    footerConnectLinks: [{ label: "Contact", href: "@page:contact" }],
    copyrightLine: "© SME Operations. All rights reserved.",
    cartCountLabel: "0",
    whatsappNumber: "",
    accentColor: "#2563eb",
  };
}
