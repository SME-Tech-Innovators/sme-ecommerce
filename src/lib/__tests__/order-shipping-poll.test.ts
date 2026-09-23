import { shouldPollPublicOrderShipping } from "@/hooks/use-public-order-shipping";
import type { OrderShippingStatus } from "@/types/shipping";

const base: OrderShippingStatus = {
  provider: "bobgo",
  status: "pending",
  statusLabel: "Awaiting shipment",
  trackingReference: null,
  trackingUrl: null,
  carrierName: null,
  shippingOptionLabel: "Economy (ECO)",
  lastError: null,
};

describe("shouldPollPublicOrderShipping", () => {
  it("polls while awaiting tracking", () => {
    expect(shouldPollPublicOrderShipping(undefined)).toBe(true);
    expect(shouldPollPublicOrderShipping(base)).toBe(true);
  });

  it("stops when tracking or terminal status is present", () => {
    expect(
      shouldPollPublicOrderShipping({
        ...base,
        trackingReference: "UASDCXWF",
        status: "created",
        statusLabel: "Label created",
      }),
    ).toBe(false);
    expect(
      shouldPollPublicOrderShipping({
        ...base,
        status: "failed",
        lastError: "error",
      }),
    ).toBe(false);
    expect(
      shouldPollPublicOrderShipping({
        ...base,
        status: "not_required",
      }),
    ).toBe(false);
  });
});
