import type { CSSProperties } from "react";
import type { StorefrontConfig, StorefrontThemeId } from "@/types/storefront";

export const DEFAULT_STOREFRONT_THEME_ID: StorefrontThemeId = "blue";

export type StorefrontThemeDefinition = {
  id: StorefrontThemeId;
  label: string;
  /** Short hint under the swatch in Appearance. */
  vibe: string;
  /** Used when `config.accentColor` is empty or invalid. */
  defaultAccent: string;
  pageBg: string;
  bodyText: string;
  headerSurface: string;
  promoSectionBg: string;
  valuesSectionBg: string;
  footerBg: string;
  neutralWash: string;
  neutralWashSoft: string;
  neutralWashMedium: string;
  neutralWashStrong: string;
  cartBadgeText: string;
};

export const STOREFRONT_THEME_DEFINITIONS: Record<
  StorefrontThemeId,
  StorefrontThemeDefinition
> = {
  blue: {
    id: "blue",
    label: "Blue",
    vibe: "Classic boutique navy",
    defaultAccent: "#0a2540",
    pageBg: "#ffffff",
    bodyText: "#1a1a1a",
    headerSurface: "rgba(255, 255, 255, 0.95)",
    promoSectionBg: "#f6f7f9",
    valuesSectionBg: "#eef1f5",
    footerBg: "#e8ecf2",
    neutralWash: "rgba(220, 220, 237, 0.8)",
    neutralWashSoft: "rgba(220, 220, 237, 0.3)",
    neutralWashMedium: "rgba(220, 220, 237, 0.5)",
    neutralWashStrong: "rgba(220, 220, 237, 0.6)",
    cartBadgeText: "#ffffff",
  },
  red: {
    id: "red",
    label: "Red",
    vibe: "Bold retail accent",
    defaultAccent: "#b91c1c",
    pageBg: "#fffafa",
    bodyText: "#211818",
    headerSurface: "rgba(255, 250, 250, 0.95)",
    promoSectionBg: "#fff1f1",
    valuesSectionBg: "#fee7e7",
    footerBg: "#fde2e2",
    neutralWash: "rgba(248, 113, 113, 0.18)",
    neutralWashSoft: "rgba(248, 113, 113, 0.1)",
    neutralWashMedium: "rgba(248, 113, 113, 0.16)",
    neutralWashStrong: "rgba(248, 113, 113, 0.24)",
    cartBadgeText: "#ffffff",
  },
  /** Cool zinc — used by Minimal Catalogue (not boutique blue/red). */
  ink: {
    id: "ink",
    label: "Ink",
    vibe: "Neutral catalogue",
    defaultAccent: "#18181b",
    pageBg: "#fafafa",
    bodyText: "#18181b",
    headerSurface: "rgba(250, 250, 250, 0.94)",
    promoSectionBg: "#f4f4f5",
    valuesSectionBg: "#f0f0f1",
    footerBg: "#e4e4e7",
    neutralWash: "rgba(24, 24, 27, 0.08)",
    neutralWashSoft: "rgba(24, 24, 27, 0.04)",
    neutralWashMedium: "rgba(24, 24, 27, 0.1)",
    neutralWashStrong: "rgba(24, 24, 27, 0.14)",
    cartBadgeText: "#fafafa",
  },
  /** Deep green — pantry, produce, outdoors, wellness. */
  forest: {
    id: "forest",
    label: "Forest",
    vibe: "Pantry & wellness",
    defaultAccent: "#1b4332",
    pageBg: "#f7faf8",
    bodyText: "#14261c",
    headerSurface: "rgba(247, 250, 248, 0.95)",
    promoSectionBg: "#eef5f0",
    valuesSectionBg: "#e4efe8",
    footerBg: "#d7e6dc",
    neutralWash: "rgba(27, 67, 50, 0.12)",
    neutralWashSoft: "rgba(27, 67, 50, 0.06)",
    neutralWashMedium: "rgba(27, 67, 50, 0.1)",
    neutralWashStrong: "rgba(27, 67, 50, 0.16)",
    cartBadgeText: "#f7faf8",
  },
  /** Fresh teal — general retail / electronics / services. */
  teal: {
    id: "teal",
    label: "Teal",
    vibe: "Fresh general retail",
    defaultAccent: "#0f766e",
    pageBg: "#f6fbfb",
    bodyText: "#134e4a",
    headerSurface: "rgba(246, 251, 251, 0.95)",
    promoSectionBg: "#e8f5f4",
    valuesSectionBg: "#d9efed",
    footerBg: "#c5e5e2",
    neutralWash: "rgba(15, 118, 110, 0.14)",
    neutralWashSoft: "rgba(15, 118, 110, 0.07)",
    neutralWashMedium: "rgba(15, 118, 110, 0.12)",
    neutralWashStrong: "rgba(15, 118, 110, 0.18)",
    cartBadgeText: "#f6fbfb",
  },
  /** Warm stone — hardware, home goods (not fashion cream/terracotta). */
  stone: {
    id: "stone",
    label: "Stone",
    vibe: "Hardware & home",
    defaultAccent: "#44403c",
    pageBg: "#fafaf9",
    bodyText: "#292524",
    headerSurface: "rgba(250, 250, 249, 0.95)",
    promoSectionBg: "#f5f5f4",
    valuesSectionBg: "#e7e5e4",
    footerBg: "#d6d3d1",
    neutralWash: "rgba(68, 64, 60, 0.12)",
    neutralWashSoft: "rgba(68, 64, 60, 0.05)",
    neutralWashMedium: "rgba(68, 64, 60, 0.1)",
    neutralWashStrong: "rgba(68, 64, 60, 0.15)",
    cartBadgeText: "#fafaf9",
  },
};

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function normalizeAccentColor(
  raw: string | undefined,
  fallback: string,
): string {
  const trimmed = raw?.trim() ?? "";
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return hexToRgb(withHash) ? withHash.toLowerCase() : fallback;
}

function rgbaAccent(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export type StorefrontResolvedTheme = StorefrontThemeDefinition & {
  accent: string;
  accentBorder10: string;
  accentBorder5: string;
  accentBorder15: string;
  accentBorder25: string;
  accentBorder30: string;
  accentBorder35: string;
  accentText45: string;
  accentText55: string;
  accentText60: string;
  accentText65: string;
  accentText70: string;
  accentText80: string;
  accentText90: string;
  navHoverWash: string;
  iconTileText: string;
};

export function resolveAccentShades(accent: string): Omit<
  StorefrontResolvedTheme,
  keyof StorefrontThemeDefinition
> {
  return {
    accent,
    accentBorder10: rgbaAccent(accent, 0.1),
    accentBorder5: rgbaAccent(accent, 0.05),
    accentBorder15: rgbaAccent(accent, 0.15),
    accentBorder25: rgbaAccent(accent, 0.25),
    accentBorder30: rgbaAccent(accent, 0.3),
    accentBorder35: rgbaAccent(accent, 0.35),
    accentText45: rgbaAccent(accent, 0.45),
    accentText55: rgbaAccent(accent, 0.55),
    accentText60: rgbaAccent(accent, 0.6),
    accentText65: rgbaAccent(accent, 0.65),
    accentText70: rgbaAccent(accent, 0.7),
    accentText80: rgbaAccent(accent, 0.8),
    accentText90: rgbaAccent(accent, 0.9),
    navHoverWash: rgbaAccent(accent, 0.12),
    iconTileText: accent,
  };
}

const THEME_IDS = new Set<string>(Object.keys(STOREFRONT_THEME_DEFINITIONS));

export function normalizeStorefrontThemeId(
  raw: string | undefined,
): StorefrontThemeId {
  if (raw === "boutique-navy") return "blue";
  if (raw === "warm-sand") return "red";
  if (raw && THEME_IDS.has(raw)) return raw as StorefrontThemeId;
  return DEFAULT_STOREFRONT_THEME_ID;
}

export function resolveStorefrontTheme(
  config: StorefrontConfig,
): StorefrontResolvedTheme {
  const def =
    STOREFRONT_THEME_DEFINITIONS[normalizeStorefrontThemeId(config.themeId)];
  const accent = normalizeAccentColor(config.accentColor, def.defaultAccent);
  return { ...def, ...resolveAccentShades(accent) };
}

export function storefrontThemeCssVars(
  theme: StorefrontResolvedTheme,
): CSSProperties {
  return {
    "--sf-page-bg": theme.pageBg,
    "--sf-body-text": theme.bodyText,
    "--sf-header-surface": theme.headerSurface,
    "--sf-accent": theme.accent,
    "--sf-accent-border-10": theme.accentBorder10,
    "--sf-accent-border-5": theme.accentBorder5,
    "--sf-accent-border-15": theme.accentBorder15,
    "--sf-accent-border-25": theme.accentBorder25,
    "--sf-accent-border-30": theme.accentBorder30,
    "--sf-accent-border-35": theme.accentBorder35,
    "--sf-accent-text-45": theme.accentText45,
    "--sf-accent-text-55": theme.accentText55,
    "--sf-accent-text-60": theme.accentText60,
    "--sf-accent-text-65": theme.accentText65,
    "--sf-accent-text-70": theme.accentText70,
    "--sf-accent-text-80": theme.accentText80,
    "--sf-accent-text-90": theme.accentText90,
    "--sf-nav-hover-wash": theme.navHoverWash,
    "--sf-icon-tile-bg": theme.neutralWash,
    "--sf-icon-tile-text": theme.iconTileText,
    "--sf-card-frame-bg": theme.neutralWashSoft,
    "--sf-promo-placeholder": theme.neutralWashMedium,
    "--sf-hero-placeholder": theme.neutralWashStrong,
    "--sf-promo-section-bg": theme.promoSectionBg,
    "--sf-values-section-bg": theme.valuesSectionBg,
    "--sf-footer-bg": theme.footerBg,
    "--sf-cart-badge-fg": theme.cartBadgeText,
  } as CSSProperties;
}
