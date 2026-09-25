import { StorefrontSections } from "@/components/storefront/sections/storefront-section-renderer";
import { MaisonEditorialSiteFooter } from "@/components/storefront/templates/maison-editorial-chrome";
import { MaisonEditorialSiteHeader } from "@/components/storefront/templates/maison-editorial-chrome";
import type { StorefrontConfig, StorefrontSection } from "@/types/storefront";

type MaisonEditorialStorefrontProps = {
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

export function MaisonEditorialStorefront({
  config,
  workspaceId,
  basePath,
  isEditing,
  forceViewport,
  onMoveSection,
  onAddSection,
  onEditSection,
  onRemoveSection,
}: MaisonEditorialStorefrontProps) {
  return (
    <div className="@container/storefront min-h-full bg-[color:var(--sf-page-bg)]">
      <MaisonEditorialSiteHeader
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
      <MaisonEditorialSiteFooter
        config={config}
        workspaceId={workspaceId}
        basePath={basePath}
      />
    </div>
  );
}
