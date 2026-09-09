"use client";

import type { CSSProperties, ReactNode } from "react";
import { StorefrontFavicon } from "@/components/storefront/storefront-favicon";
import { StorefrontFontLoader } from "@/components/storefront/storefront-font-loader";
import {
  buildGoogleFontsHref,
  resolveStorefrontFontPair,
  storefrontFontCssVars,
} from "@/lib/storefront-fonts";
import {
  resolveStorefrontTheme,
  storefrontThemeCssVars,
} from "@/lib/storefront-themes";
import type { StorefrontConfig } from "@/types/storefront";

type StorefrontThemeRootProps = {
  config: StorefrontConfig;
  children: ReactNode;
};

/** Injects storefront CSS variables derived from `themeId` + `accentColor`. */
export function StorefrontThemeRoot({
  config,
  children,
}: StorefrontThemeRootProps) {
  const theme = resolveStorefrontTheme(config);
  const fonts = resolveStorefrontFontPair(config.fontPairId);
  const style = {
    ...storefrontThemeCssVars(theme),
    ...storefrontFontCssVars(fonts),
    fontFamily: "var(--sf-font-body)",
  } as CSSProperties;

  return (
    <>
      <StorefrontFontLoader href={buildGoogleFontsHref(fonts)} />
      <StorefrontFavicon url={config.faviconUrl} />
      <div
        data-storefront-template={config.templateId || "classic-boutique"}
        className="storefront-theme-root min-h-full text-[color:var(--sf-body-text)] [&_.font-serif]:[font-family:var(--sf-font-heading)] [&_.font-sans]:[font-family:var(--sf-font-body)]"
        style={style}
      >
        {children}
      </div>
    </>
  );
}
