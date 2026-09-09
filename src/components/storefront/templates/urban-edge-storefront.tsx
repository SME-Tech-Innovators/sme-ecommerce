import { StorefrontSections } from "@/components/storefront/sections/storefront-section-renderer";
import { UrbanEdgeSiteFooter } from "@/components/storefront/templates/urban-edge-site-footer";
import { UrbanEdgeSiteHeader } from "@/components/storefront/templates/urban-edge-site-header";
import type { StorefrontConfig, StorefrontSection } from "@/types/storefront";

type UrbanEdgeStorefrontProps = {
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

export function UrbanEdgeStorefront({
  config,
  workspaceId,
  basePath,
  isEditing,
  forceViewport,
  onMoveSection,
  onAddSection,
  onEditSection,
  onRemoveSection,
}: UrbanEdgeStorefrontProps) {
  return (
    <div className="@container/storefront min-h-full">
      <UrbanEdgeSiteHeader
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
      <UrbanEdgeSiteFooter
        config={config}
        workspaceId={workspaceId}
        basePath={basePath}
      />
    </div>
  );
}
