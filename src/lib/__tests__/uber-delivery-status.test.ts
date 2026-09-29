import {
  buildDeliveryTimeline,
  normalizeUberDeliveryStatus,
  uberDeliveryStatusLabel,
} from "@/lib/uber-delivery-status";

describe("Uber delivery status", () => {
  it.each([
    ["pending", "PENDING", "Pending"],
    ["pickup", "ASSIGNED", "Driver Assigned"],
    ["pickup_complete", "DISPATCHED", "Picked Up"],
    ["dropoff", "IN_TRANSIT", "Out for Delivery"],
    ["delivered", "DELIVERED", "Delivered"],
    ["cancelled", "CANCELLED", "Cancelled"],
    ["returned", "FAILED", "Delivery Failed"],
  ])("maps %s to %s", (raw, mapped, label) => {
    expect(normalizeUberDeliveryStatus(raw)).toBe(mapped);
    expect(uberDeliveryStatusLabel(raw)).toBe(label);
  });

  it("marks the current delivery stage in the timeline", () => {
    const timeline = buildDeliveryTimeline("pickup_complete");
    expect(timeline.find((step) => step.id === "order-placed")?.state).toBe(
      "complete",
    );
    expect(timeline.find((step) => step.id === "picked-up")?.state).toBe(
      "current",
    );
    expect(timeline.find((step) => step.id === "out-for-delivery")?.state).toBe(
      "upcoming",
    );
  });
});