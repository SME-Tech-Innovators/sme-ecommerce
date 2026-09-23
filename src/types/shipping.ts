import type { ParsedApiFailure } from "@/apis/api-result";

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  province?: string;
  postalCode?: string;
  country: string;
};

export type ShippingOption = {
  id: string;
  provider: string;
  label: string;
  /** Minor units (cents), same as quote API. */
  amount: number;
  currency: string;
  estimatedDays?: number | null;
  bobgoRateToken?: string | null;
};

export type ShippingQuote = {
  options: ShippingOption[];
};

export type ShippingSelection = {
  optionId: string;
  provider?: string;
  amount: number;
  currency: string;
  bobgoRateToken?: string;
};

export type ShippingSettings = {
  provider: string;
  enabled: boolean;
  collectionAddress: ShippingAddress | null;
  /** Minor units from API. */
  fallbackFlatRateAmount: number | null;
  fallbackFlatRateCurrency: string;
  allowPickup: boolean;
  pickupLabel: string | null;
};

export type UpdateShippingSettingsBody = {
  provider?: string;
  enabled?: boolean;
  collectionAddress?: ShippingAddress;
  /** Major units (e.g. 99.00 ZAR) — backend stores major. */
  fallbackFlatRateAmount?: number;
  fallbackFlatRateCurrency?: string;
  allowPickup?: boolean;
  pickupLabel?: string;
};

export type OrderShippingStatus = {
  canCancel?: boolean;
  provider: string | null;
  status: string | null;
  statusLabel: string | null;
  trackingReference: string | null;
  trackingUrl: string | null;
  carrierName: string | null;
  shippingOptionLabel: string | null;
  lastError: string | null;
};

export type ShippingQuoteResult =
  | { ok: true; data: ShippingQuote }
  | ParsedApiFailure;

export type ShippingSettingsResult =
  | { ok: true; data: ShippingSettings }
  | ParsedApiFailure;

export type OrderShippingStatusResult =
  | { ok: true; data: OrderShippingStatus }
  | ParsedApiFailure;
