import type { ParsedApiFailure } from "@/apis/api-result";

export type DeliverySettings = {
  workspaceId: string;
  uberDirectEnabled: boolean;
  uberDirectAvailable: boolean;
  pickupAddressLine1: string;
  pickupAddressLine2: string | null;
  pickupCity: string;
  pickupProvince: string;
  pickupPostalCode: string;
  pickupCountry: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  pickupContactName: string;
  pickupContactPhone: string;
  updatedAt: string;
};

export type UpdateDeliverySettingsBody = {
  uberDirectEnabled: boolean;
  pickupAddressLine1: string;
  pickupAddressLine2: string | null;
  pickupCity: string;
  pickupProvince: string;
  pickupPostalCode: string;
  pickupCountry: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  pickupContactName: string;
  pickupContactPhone: string;
};

export type CustomerDeliveryOptionsInput = {
  dropoffAddressLine1: string;
  dropoffAddressLine2: string | null;
  dropoffCity: string;
  dropoffProvince: string;
  dropoffPostalCode: string;
  dropoffCountry: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  /** Cart total in major currency units, such as 450.00. */
  cartTotal: number;
};

export type CustomerDeliveryOptionsBody = Omit<
  CustomerDeliveryOptionsInput,
  "cartTotal"
> & {
  /** Built by the service as cart total multiplied by 100. */
  manifestTotalValueCents: number;
};

export type CustomerDeliveryOption = {
  quoteId: string;
  providerName: string;
  estimatedDeliveryTime: string;
  fee: number;
  currency: string;
  expiresAt: string;
  available: boolean;
  unavailableReason: string | null;
};

export type CustomerDeliveryOptionsResponse = {
  storeSlug: string;
  options: CustomerDeliveryOption[];
};

export type SelectedDeliveryOption = Pick<
  CustomerDeliveryOption,
  | "providerName"
  | "quoteId"
  | "fee"
  | "estimatedDeliveryTime"
  | "expiresAt"
>;

export type UberDirectDelivery = {
  id: string;
  status: string;
  trackingUrl: string | null;
  courier: {
    name: string | null;
    phone: string | null;
  } | null;
  pickupEta: number | null;
  dropoffEta: number | null;
};

/** The backend response schema for quotes and delivery actions is not specified. */
export type DeliveryOperationResponse = Record<string, unknown>;

export type DeliveryApiResult<T> =
  | { ok: true; data: T }
  | ParsedApiFailure;