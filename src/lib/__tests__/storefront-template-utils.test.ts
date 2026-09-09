import {
  isArtisanAtelierTemplate,
  isCatalogueTemplate,
  storefrontLayoutVariant,
} from "@/lib/storefront-template-utils";

describe("storefront template utils", () => {
  it("treats minimal-catalogue as catalogue layout", () => {
    expect(isCatalogueTemplate("minimal-catalogue")).toBe(true);
    expect(storefrontLayoutVariant("minimal-catalogue")).toBe("catalogue");
  });

  it("treats classic-boutique as boutique layout", () => {
    expect(isCatalogueTemplate("classic-boutique")).toBe(false);
    expect(storefrontLayoutVariant("classic-boutique")).toBe("boutique");
  });

  it("treats artisan-atelier as atelier layout", () => {
    expect(isArtisanAtelierTemplate("artisan-atelier")).toBe(true);
    expect(isCatalogueTemplate("artisan-atelier")).toBe(false);
    expect(storefrontLayoutVariant("artisan-atelier")).toBe("atelier");
  });
});
