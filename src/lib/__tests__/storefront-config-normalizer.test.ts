import {
  normalizeStorefrontConfigFromApi,
  normalizeStorefrontSectionFromApi,
} from "@/lib/storefront-config-normalizer";

describe("storefront config normalizer", () => {
  it("flattens legacy hero section content", () => {
    const section = normalizeStorefrontSectionFromApi({
      id: "home-hero",
      type: "hero",
      content: {
        headline: "Welcome",
        subheadline: "Shop online",
        imageUrl: "https://example.com/hero.jpg",
        primaryCta: { label: "Shop", href: "@shop" },
      },
    });

    expect(section).toMatchObject({
      id: "home-hero",
      type: "hero",
      heading: "Welcome",
      subheading: "Shop online",
      imageUrl: "https://example.com/hero.jpg",
      primaryCta: { label: "Shop", href: "@shop" },
    });
  });

  it("preserves flat v5 artisan config", () => {
    const normalized = normalizeStorefrontConfigFromApi({
      templateId: "artisan-atelier",
      configVersion: 5,
      themeId: "stone",
      shopName: "Artisan Atelier",
      sections: [
        {
          id: "home-hero",
          type: "hero",
          heading: "Objects made slowly",
          subheading: "Handmade goods",
          imageUrl: "https://example.com/a.jpg",
          primaryCta: { label: "Browse", href: "@shop" },
          secondaryCta: null,
        },
      ],
      pages: [
        {
          id: "page-contact",
          slug: "contact",
          title: "Contact",
          sections: [{ id: "c1", type: "contact", title: "Get in touch" }],
        },
      ],
    });

    expect(normalized.configVersion).toBe(5);
    expect(normalized.templateId).toBe("artisan-atelier");
    expect(normalized.heroHeading).toBe("Objects made slowly");
    expect(Array.isArray(normalized.pages)).toBe(true);
  });
});
