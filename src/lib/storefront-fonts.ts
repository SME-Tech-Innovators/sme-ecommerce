export type StorefrontFontPairId =
  | "dm-cormorant"
  | "inter-playfair"
  | "poppins-lora"
  | "montserrat-merriweather"
  | "outfit-fraunces"
  | "work-libre"
  | "nunito-crimson"
  | "source-serif"
  | "raleway-eb-garamond"
  | "manrope-bitter";

export type StorefrontFontPair = {
  id: StorefrontFontPairId;
  label: string;
  vibe: string;
  headingFamily: string;
  bodyFamily: string;
  googleQuery: string;
};

export const DEFAULT_STOREFRONT_FONT_PAIR_ID: StorefrontFontPairId =
  "dm-cormorant";

export const STOREFRONT_FONT_PAIRS: Record<
  StorefrontFontPairId,
  StorefrontFontPair
> = {
  "dm-cormorant": {
    id: "dm-cormorant",
    label: "Classic",
    vibe: "Default boutique look",
    headingFamily: '"Cormorant Garamond", ui-serif, Georgia, serif',
    bodyFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    googleQuery:
      "family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@400;500;600",
  },
  "inter-playfair": {
    id: "inter-playfair",
    label: "Editorial",
    vibe: "Clean sans + elegant serif",
    headingFamily: '"Playfair Display", ui-serif, Georgia, serif',
    bodyFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
    googleQuery:
      "family=Inter:wght@400;500;600&family=Playfair+Display:wght@400;500;600",
  },
  "poppins-lora": {
    id: "poppins-lora",
    label: "Friendly",
    vibe: "Warm retail",
    headingFamily: '"Lora", ui-serif, Georgia, serif',
    bodyFamily: '"Poppins", ui-sans-serif, system-ui, sans-serif',
    googleQuery: "family=Lora:wght@400;500;600&family=Poppins:wght@400;500;600",
  },
  "montserrat-merriweather": {
    id: "montserrat-merriweather",
    label: "Modern",
    vibe: "Strong headlines",
    headingFamily: '"Merriweather", ui-serif, Georgia, serif',
    bodyFamily: '"Montserrat", ui-sans-serif, system-ui, sans-serif',
    googleQuery:
      "family=Merriweather:wght@400;700&family=Montserrat:wght@400;500;600",
  },
  "outfit-fraunces": {
    id: "outfit-fraunces",
    label: "Soft",
    vibe: "Lifestyle & wellness",
    headingFamily: '"Fraunces", ui-serif, Georgia, serif',
    bodyFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
    googleQuery:
      "family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Outfit:wght@400;500;600",
  },
  "work-libre": {
    id: "work-libre",
    label: "Craft",
    vibe: "Artisan & local",
    headingFamily: '"Libre Baskerville", ui-serif, Georgia, serif',
    bodyFamily: '"Work Sans", ui-sans-serif, system-ui, sans-serif',
    googleQuery:
      "family=Libre+Baskerville:wght@400;700&family=Work+Sans:wght@400;500;600",
  },
  "nunito-crimson": {
    id: "nunito-crimson",
    label: "Open",
    vibe: "Approachable shop",
    headingFamily: '"Crimson Pro", ui-serif, Georgia, serif',
    bodyFamily: '"Nunito Sans", ui-sans-serif, system-ui, sans-serif',
    googleQuery:
      "family=Crimson+Pro:wght@400;600&family=Nunito+Sans:wght@400;600;700",
  },
  "source-serif": {
    id: "source-serif",
    label: "Neutral",
    vibe: "Catalogue clarity",
    headingFamily: '"Source Serif 4", ui-serif, Georgia, serif',
    bodyFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
    googleQuery:
      "family=Source+Sans+3:wght@400;500;600&family=Source+Serif+4:wght@400;600",
  },
  "raleway-eb-garamond": {
    id: "raleway-eb-garamond",
    label: "Refined",
    vibe: "Premium feel",
    headingFamily: '"EB Garamond", ui-serif, Georgia, serif',
    bodyFamily: '"Raleway", ui-sans-serif, system-ui, sans-serif',
    googleQuery:
      "family=EB+Garamond:wght@400;500;600&family=Raleway:wght@400;500;600",
  },
  "manrope-bitter": {
    id: "manrope-bitter",
    label: "Grounded",
    vibe: "Hardware & pantry",
    headingFamily: '"Bitter", ui-serif, Georgia, serif',
    bodyFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif',
    googleQuery: "family=Bitter:wght@400;600;700&family=Manrope:wght@400;500;600",
  },
};

const FONT_PAIR_IDS = new Set<string>(Object.keys(STOREFRONT_FONT_PAIRS));

export function normalizeStorefrontFontPairId(
  raw: string | undefined,
): StorefrontFontPairId {
  if (raw && FONT_PAIR_IDS.has(raw)) return raw as StorefrontFontPairId;
  return DEFAULT_STOREFRONT_FONT_PAIR_ID;
}

export function resolveStorefrontFontPair(
  fontPairId: string | undefined,
): StorefrontFontPair {
  return STOREFRONT_FONT_PAIRS[normalizeStorefrontFontPairId(fontPairId)];
}

export function buildGoogleFontsHref(pair: StorefrontFontPair): string {
  return `https://fonts.googleapis.com/css2?${pair.googleQuery}&display=swap`;
}

export function storefrontFontCssVars(
  pair: StorefrontFontPair,
): Record<string, string> {
  return {
    "--sf-font-heading": pair.headingFamily,
    "--sf-font-body": pair.bodyFamily,
  };
}
