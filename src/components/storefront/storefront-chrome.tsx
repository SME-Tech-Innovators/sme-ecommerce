import { ClassicBoutiqueSiteFooter } from "@/components/storefront/templates/classic-boutique-site-footer";
import { ClassicBoutiqueSiteHeader } from "@/components/storefront/templates/classic-boutique-site-header";
import { FreshMarketSiteFooter } from "@/components/storefront/templates/fresh-market-site-footer";
import { FreshMarketSiteHeader } from "@/components/storefront/templates/fresh-market-site-header";
import { MinimalCatalogueSiteFooter } from "@/components/storefront/templates/minimal-catalogue-site-footer";
import { MinimalCatalogueSiteHeader } from "@/components/storefront/templates/minimal-catalogue-site-header";
import { UrbanEdgeSiteFooter } from "@/components/storefront/templates/urban-edge-site-footer";
import { UrbanEdgeSiteHeader } from "@/components/storefront/templates/urban-edge-site-header";
import type { StorefrontConfig, StorefrontTemplateId } from "@/types/storefront";

export type StorefrontChromeProps = {
  config: StorefrontConfig;
  basePath?: string;
  workspaceId?: string;
  forceViewport?: "mobile" | "desktop";
};

function resolveTemplateId(config: StorefrontConfig): StorefrontTemplateId {
  const id = config.templateId;
  if (
    id === "minimal-catalogue" ||
    id === "fresh-market" ||
    id === "urban-edge" ||
    id === "classic-boutique"
  ) {
    return id;
  }
  return "classic-boutique";
}

/** Header chrome for the active `config.templateId`. */
export function StorefrontSiteHeader(props: StorefrontChromeProps) {
  switch (resolveTemplateId(props.config)) {
    case "minimal-catalogue":
      return <MinimalCatalogueSiteHeader {...props} />;
    case "fresh-market":
      return <FreshMarketSiteHeader {...props} />;
    case "urban-edge":
      return <UrbanEdgeSiteHeader {...props} />;
    default:
      return <ClassicBoutiqueSiteHeader {...props} />;
  }
}

/** Footer chrome for the active `config.templateId`. */
export function StorefrontSiteFooter(
  props: Omit<StorefrontChromeProps, "forceViewport">,
) {
  switch (resolveTemplateId(props.config)) {
    case "minimal-catalogue":
      return <MinimalCatalogueSiteFooter {...props} />;
    case "fresh-market":
      return <FreshMarketSiteFooter {...props} />;
    case "urban-edge":
      return <UrbanEdgeSiteFooter {...props} />;
    default:
      return <ClassicBoutiqueSiteFooter {...props} />;
  }
}
