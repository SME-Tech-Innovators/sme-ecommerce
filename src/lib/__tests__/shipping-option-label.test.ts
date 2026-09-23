import { shippingOptionLabel } from "@/lib/shipping-option-label";

describe("shippingOptionLabel", () => {
  it("parses legacy map-string labels from Bob Go", () => {
    const label = shippingOptionLabel({
      id: "bobgo:sandbox:ECO:11495",
      provider: "bobgo",
      label:
        "{code=ECO, name=Economy, description=72–96 hours, type=economy, delivery_type=door}",
      amount: 11495,
      currency: "ZAR",
    });
    expect(label).toBe("Economy (ECO)");
  });

  it("returns normal labels unchanged", () => {
    expect(
      shippingOptionLabel({
        id: "pickup",
        provider: "manual",
        label: "Collect in store",
        amount: 0,
        currency: "ZAR",
      }),
    ).toBe("Collect in store");
  });
});
