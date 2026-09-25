import { StorefrontSections } from "@/components/storefront/sections/storefront-section-renderer";
import { ChapterBookshopSiteFooter } from "@/components/storefront/templates/chapter-bookshop-chrome";
import { ChapterBookshopSiteHeader } from "@/components/storefront/templates/chapter-bookshop-chrome";
import type { StorefrontConfig, StorefrontSection } from "@/types/storefront";

type ChapterBookshopStorefrontProps = {
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

export function ChapterBookshopStorefront({
  config,
  workspaceId,
  basePath,
  isEditing,
  forceViewport,
  onMoveSection,
  onAddSection,
  onEditSection,
  onRemoveSection,
}: ChapterBookshopStorefrontProps) {
  return (
    <div className="@container/storefront min-h-full bg-[color:var(--sf-page-bg)]">
      <ChapterBookshopSiteHeader
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
      <ChapterBookshopSiteFooter
        config={config}
        workspaceId={workspaceId}
        basePath={basePath}
      />
    </div>
  );
}
