import { createInitialStorefrontFromSeed } from "@/lib/storefront-storage";
import {
  isCatalogueTemplate,
  storefrontLayoutVariant,
} from "@/lib/storefront-template-utils";

describe("storefront template utils", () => {
  it("treats fresh-market as catalogue layout", () => {
    expect(isCatalogueTemplate("fresh-market")).toBe(true);
    expect(storefrontLayoutVariant("fresh-market")).toBe("catalogue");
  });

  it("treats urban-edge as boutique layout", () => {
    expect(isCatalogueTemplate("urban-edge")).toBe(false);
    expect(storefrontLayoutVariant("urban-edge")).toBe("boutique");
  });

  it("loads distinct seeds for new templates", () => {
    const fresh = createInitialStorefrontFromSeed("fresh-market");
    const urban = createInitialStorefrontFromSeed("urban-edge");
    expect(fresh.templateId).toBe("fresh-market");
    expect(fresh.themeId).toBe("forest");
    expect(urban.templateId).toBe("urban-edge");
    expect(urban.themeId).toBe("ink");
  });
});
