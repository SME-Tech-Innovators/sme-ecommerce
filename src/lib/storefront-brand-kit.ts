import { upgradeStorefrontConfig } from "@/lib/storefront-storage";
import type { StorefrontConfig } from "@/types/storefront";

export const STOREFRONT_BRAND_KIT_EXPORT_VERSION = 1;

export type StorefrontBrandKitExport = {
  exportVersion: typeof STOREFRONT_BRAND_KIT_EXPORT_VERSION;
  exportedAt: string;
  label: string;
  config: Omit<StorefrontConfig, "updatedAt">;
};

function slugifyFilename(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "storefront"
  );
}

export function buildStorefrontBrandKitExport(
  config: StorefrontConfig,
): StorefrontBrandKitExport {
  const { updatedAt: _updatedAt, ...rest } = config;
  return {
    exportVersion: STOREFRONT_BRAND_KIT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    label: config.shopName?.trim() || "Storefront brand kit",
    config: rest,
  };
}

export function downloadStorefrontBrandKit(config: StorefrontConfig) {
  const payload = buildStorefrontBrandKitExport(config);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugifyFilename(payload.label)}-brand-kit.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseStorefrontBrandKitImport(
  raw: unknown,
  current: StorefrontConfig,
): StorefrontConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid file: expected a JSON object.");
  }

  const envelope = raw as Partial<StorefrontBrandKitExport> & {
    config?: Partial<StorefrontConfig>;
  };

  const importedConfig =
    envelope.config && typeof envelope.config === "object"
      ? envelope.config
      : (raw as Partial<StorefrontConfig>);

  if (!importedConfig || typeof importedConfig !== "object") {
    throw new Error("Invalid file: missing storefront config.");
  }

  return upgradeStorefrontConfig({
    ...current,
    ...importedConfig,
    templateId: current.templateId,
    updatedAt: Date.now(),
  } as StorefrontConfig);
}
