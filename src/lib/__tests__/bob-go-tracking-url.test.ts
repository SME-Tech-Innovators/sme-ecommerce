import {
  bobGoPublicTrackingUrl,
  trackingRefFromBobGoUrl,
} from "@/lib/bob-go-tracking-url";

describe("bobGoPublicTrackingUrl", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env, NEXT_PUBLIC_BOBGO_TRACKING_SANDBOX: "true" };
  });

  afterEach(() => {
    process.env = env;
  });

  it("prefers API trackingUrl", () => {
    expect(
      bobGoPublicTrackingUrl("X", "https://track.sandbox.bobgo.co.za/UASSV9JN"),
    ).toBe("https://track.sandbox.bobgo.co.za/UASSV9JN");
  });

  it("builds sandbox URL from reference", () => {
    expect(bobGoPublicTrackingUrl("UASSV9JN", null)).toBe(
      "https://track.sandbox.bobgo.co.za/UASSV9JN",
    );
  });

  it("parses reference from Bob Go tracking URL", () => {
    expect(
      trackingRefFromBobGoUrl("https://track.sandbox.bobgo.co.za/UASDPQ6B"),
    ).toBe("UASDPQ6B");
  });
});
