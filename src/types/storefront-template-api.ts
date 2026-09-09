export type StorefrontTemplateApiStatus = "available" | "coming_soon" | string;

export type StorefrontTemplateListItem = {
  id: string;
  name: string;
  description: string;
  vibe: string;
  status: StorefrontTemplateApiStatus;
  latestVersion: number;
  previewImageUrl: string;
  supportedThemeIds: string[];
  /** Present when the list endpoint embeds the version seed. */
  defaultConfig?: Record<string, unknown>;
};

export type StorefrontTemplateVersionPayload = {
  templateId: string;
  version: number;
  defaultConfig: Record<string, unknown>;
};
