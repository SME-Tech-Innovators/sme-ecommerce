import { StorefrontSections } from "@/components/storefront/sections/storefront-section-renderer";
import { ArtisanAtelierSiteFooter } from "@/components/storefront/templates/artisan-atelier-site-footer";
import { ArtisanAtelierSiteHeader } from "@/components/storefront/templates/artisan-atelier-site-header";
import type { StorefrontConfig, StorefrontSection } from "@/types/storefront";

type ArtisanAtelierStorefrontProps = {
  config: StorefrontConfig;
  workspaceId?: string;
  basePath?: string;
  isEditing?: boolean;
  forceViewport?: "mobile" | "desktop";
  onMoveSection?: (from: number, to: number) => void;
  onAddSection?: (type: StorefrontSection["type"], index: number) => void;
  onEditSection?: (sectionId: string) => void;
  onRemoveSection?: (index: number) => void;
};

export function ArtisanAtelierStorefront({
  config,
  workspaceId,
  basePath,
  isEditing,
  forceViewport,
  onMoveSection,
  onAddSection,
  onEditSection,
  onRemoveSection,
}: ArtisanAtelierStorefrontProps) {
  return (
    <div className="@container/storefront min-h-full">
      <ArtisanAtelierSiteHeader
        config={config}
        basePath={basePath}
        workspaceId={workspaceId}
        forceViewport={forceViewport}
      />
      <StorefrontSections
        sections={config.sections}
        config={config}
        workspaceId={workspaceId}
        basePath={basePath}
        isEditing={isEditing}
        onMoveSection={onMoveSection}
        onAddSection={onAddSection}
        onEditSection={onEditSection}
        onRemoveSection={onRemoveSection}
      />
      <ArtisanAtelierSiteFooter
        config={config}
        workspaceId={workspaceId}
        basePath={basePath}
      />
    </div>
  );
}
