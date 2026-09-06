"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  applyProgressBarAccent,
  releaseProgressBarAccent,
} from "@/lib/progress-bar-accent";
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
  const progressOwner = useRef(Symbol("storefront-progress-bar"));

  useEffect(() => {
    const owner = progressOwner.current;
    applyProgressBarAccent(owner, theme.accent);
    return () => releaseProgressBarAccent(owner);
  }, [theme.accent]);

  return (
    <div
      data-storefront-template={config.templateId || "classic-boutique"}
      className="min-h-full bg-[color:var(--sf-page-bg)] font-sans text-[color:var(--sf-body-text)]"
      style={storefrontThemeCssVars(theme)}
    >
      {children}
    </div>
  );
}
