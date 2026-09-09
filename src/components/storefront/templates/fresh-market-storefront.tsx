import { StorefrontSections } from "@/components/storefront/sections/storefront-section-renderer";
import { FreshMarketSiteFooter } from "@/components/storefront/templates/fresh-market-site-footer";
import { FreshMarketSiteHeader } from "@/components/storefront/templates/fresh-market-site-header";
import type { StorefrontConfig, StorefrontSection } from "@/types/storefront";

type FreshMarketStorefrontProps = {
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

export function FreshMarketStorefront({
  config,
  workspaceId,
  basePath,
  isEditing,
  forceViewport,
  onMoveSection,
  onAddSection,
  onEditSection,
  onRemoveSection,
}: FreshMarketStorefrontProps) {
  return (
    <div className="@container/storefront min-h-full">
      <FreshMarketSiteHeader
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
      <FreshMarketSiteFooter
        config={config}
        workspaceId={workspaceId}
        basePath={basePath}
      />
    </div>
  );
}
