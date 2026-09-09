import { ArtisanAtelierSiteFooter } from "@/components/storefront/templates/artisan-atelier-site-footer";
import { ArtisanAtelierSiteHeader } from "@/components/storefront/templates/artisan-atelier-site-header";
import { ClassicBoutiqueSiteFooter } from "@/components/storefront/templates/classic-boutique-site-footer";
import { ClassicBoutiqueSiteHeader } from "@/components/storefront/templates/classic-boutique-site-header";
import { MinimalCatalogueSiteFooter } from "@/components/storefront/templates/minimal-catalogue-site-footer";
import { MinimalCatalogueSiteHeader } from "@/components/storefront/templates/minimal-catalogue-site-header";
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
    id === "artisan-atelier" ||
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
    case "artisan-atelier":
      return <ArtisanAtelierSiteHeader {...props} />;
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
    case "artisan-atelier":
      return <ArtisanAtelierSiteFooter {...props} />;
    default:
      return <ClassicBoutiqueSiteFooter {...props} />;
  }
}
