export type WhatsAppIntegrationStatus =
  | "not_connected"
  | "connected"
  | "error";

export type WhatsAppSyncStatus =
  | "idle"
  | "running"
  | "success"
  | "partial"
  | "failed";

export type WhatsAppSyncSummary = {
  synced: number;
  skipped: number;
  failed: number;
};

export type WhatsAppIntegration = {
  status: WhatsAppIntegrationStatus;
  metaCatalogId: string | null;
  metaWabaId: string | null;
  hasAccessToken: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: WhatsAppSyncStatus;
  lastSyncSummary: WhatsAppSyncSummary | null;
  lastError: string | null;
};

export type UpdateWhatsAppIntegrationBody = {
  metaCatalogId: string;
  metaWabaId?: string;
  accessToken: string;
};

export type WhatsAppSyncError = {
  productId: string;
  title: string;
  message: string;
};

export type WhatsAppSyncResult = {
  lastSyncStatus: WhatsAppSyncStatus;
  lastSyncSummary: WhatsAppSyncSummary;
  errors: WhatsAppSyncError[];
};
