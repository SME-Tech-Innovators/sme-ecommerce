import { StorefrontThemeRoot } from "@/components/storefront/storefront-theme-root";
import { ArtisanAtelierStorefront } from "@/components/storefront/templates/artisan-atelier-storefront";
import { ClassicBoutiqueStorefront } from "@/components/storefront/templates/classic-boutique-storefront";
import { MinimalCatalogueStorefront } from "@/components/storefront/templates/minimal-catalogue-storefront";
import type { StorefrontConfig, StorefrontSection } from "@/types/storefront";

type StorefrontTemplateViewProps = {
  config: StorefrontConfig;
  /** Pass in preview contexts so `@shop` links resolve to `/preview/{id}/shop`. */
  workspaceId?: string;
  /** Public storefront root, e.g. `/s/my-store`. */
  basePath?: string;
  isEditing?: boolean;
  /** Force mobile/desktop chrome when previewing inside a fixed-width frame. */
  forceViewport?: "mobile" | "desktop";
  onMoveSection?: (from: number, to: number) => void;
  onAddSection?: (type: StorefrontSection["type"], index: number) => void;
  onEditSection?: (sectionId: string) => void;
  onRemoveSection?: (index: number) => void;
};

/** Registry: route by `config.templateId`. */
export function StorefrontTemplateView({
  config,
  workspaceId,
  basePath,
  isEditing,
  forceViewport,
  onMoveSection,
  onAddSection,
  onEditSection,
  onRemoveSection,
}: StorefrontTemplateViewProps) {
  const shared = {
    config,
    workspaceId,
    basePath,
    isEditing,
    forceViewport,
    onMoveSection,
    onAddSection,
    onEditSection,
    onRemoveSection,
  };

  let body;
  switch (config.templateId) {
    case "minimal-catalogue":
      body = <MinimalCatalogueStorefront {...shared} />;
      break;
    case "artisan-atelier":
      body = <ArtisanAtelierStorefront {...shared} />;
      break;
    default:
      body = <ClassicBoutiqueStorefront {...shared} />;
  }

  return <StorefrontThemeRoot config={config}>{body}</StorefrontThemeRoot>;
}
