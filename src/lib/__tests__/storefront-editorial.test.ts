import { normalizeEditorialSettings } from "@/lib/storefront-editorial";
import {
  templateDefaultConfigToStorefrontConfig,
  apiStorefrontConfigToStorefrontConfig,
} from "@/lib/storefront-template-config-mapper";
import { configToUpdateDraftBody } from "@/lib/storefront-draft-mapper";

describe("Maison Editorial persistence", () => {
  it("keeps customised settings and section content through a draft save/reload", () => {
    const editorial = {
      heroLayout: "cover",
      spacing: "compact",
      imageRatio: "square",
      editionLabel: "Autumn / 02",
    };
    const config = templateDefaultConfigToStorefrontConfig(
      {
        editorial,
        sections: [
          {
            id: "cover",
            type: "hero",
            heading: "The new edit",
            subheading: "Made for you",
            imageUrl: "https://example.com/cover.jpg",
            primaryCta: null,
            secondaryCta: null,
          },
        ],
      },
      "maison-editorial",
    );
    const saved = configToUpdateDraftBody(config, 1);
    const restored = apiStorefrontConfigToStorefrontConfig(
      JSON.parse(JSON.stringify(saved.config)),
    );
    expect(restored.templateId).toBe("maison-editorial");
    expect(restored.editorial).toEqual(editorial);
    expect(restored.sections[0]).toMatchObject({
      heading: "The new edit",
      primaryCta: null,
      secondaryCta: null,
    });
  });

  it("supplies defaults for old drafts and rejects unsupported layout settings", () => {
    expect(
      normalizeEditorialSettings({
        heroLayout: "invalid",
        spacing: false,
        imageRatio: 12,
        editionLabel: null,
      }),
    ).toEqual(normalizeEditorialSettings(undefined));
    expect(normalizeEditorialSettings({ editionLabel: "" }).editionLabel).toBe(
      "",
    );
  });
});
