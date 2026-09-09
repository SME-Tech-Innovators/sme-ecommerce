import { parseStorefrontBrandKitImport } from "@/lib/storefront-brand-kit";
import { getDefaultStorefrontSeed } from "@/lib/storefront-storage";
import type { StorefrontConfig } from "@/types/storefront";

describe("parseStorefrontBrandKitImport", () => {
  it("merges brand kit fields into the current config", () => {
    const current = getDefaultStorefrontSeed() as StorefrontConfig;
    const imported = parseStorefrontBrandKitImport(
      {
        exportVersion: 1,
        exportedAt: "2026-09-09T00:00:00.000Z",
        label: "Demo shop",
        config: {
          ...current,
          shopName: "Imported Shop",
          logoUrl: "https://cdn.example/logo.png",
          accentColor: "#b91c1c",
          fontPairId: "inter-playfair",
        },
      },
      current,
    );

    expect(imported.shopName).toBe("Imported Shop");
    expect(imported.logoUrl).toBe("https://cdn.example/logo.png");
    expect(imported.accentColor).toBe("#b91c1c");
    expect(imported.fontPairId).toBe("inter-playfair");
    expect(imported.templateId).toBe(current.templateId);
  });
});
