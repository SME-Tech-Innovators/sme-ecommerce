export type UberDeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED";

export type DeliveryTimelineState =
  | "complete"
  | "current"
  | "upcoming"
  | "terminal";

export type DeliveryTimelineStep = {
  id: string;
  label: string;
  state: DeliveryTimelineState;
};

const deliveryStatusLabels: Record<UberDeliveryStatus, string> = {
  PENDING: "Pending",
  ASSIGNED: "Driver Assigned",
  DISPATCHED: "Picked Up",
  IN_TRANSIT: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  FAILED: "Delivery Failed",
};

export function normalizeUberDeliveryStatus(raw: string): UberDeliveryStatus {
  switch (raw.trim().toLowerCase()) {
    case "pickup":
      return "ASSIGNED";
    case "pickup_complete":
      return "DISPATCHED";
    case "dropoff":
      return "IN_TRANSIT";
    case "delivered":
      return "DELIVERED";
    case "cancelled":
      return "CANCELLED";
    case "returned":
      return "FAILED";
    case "pending":
    default:
      return "PENDING";
  }
}

export function uberDeliveryStatusLabel(raw: string): string {
  return deliveryStatusLabels[normalizeUberDeliveryStatus(raw)];
}

export function buildDeliveryTimeline(
  rawStatus: string,
): DeliveryTimelineStep[] {
  const status = normalizeUberDeliveryStatus(rawStatus);
  const baseSteps = [
    { id: "order-placed", label: "Order placed" },
    { id: "payment-confirmed", label: "Payment confirmed" },
    { id: "courier-requested", label: "Courier requested" },
    { id: "driver-assigned", label: "Driver assigned" },
    { id: "picked-up", label: "Picked up" },
    { id: "out-for-delivery", label: "Out for delivery" },
    { id: "delivered", label: "Delivered" },
  ];

  if (status === "CANCELLED") {
    return [
      ...baseSteps.slice(0, 3).map((step) => ({ ...step, state: "complete" as const })),
      { id: "cancelled", label: "Cancelled", state: "terminal" },
    ];
  }
  if (status === "FAILED") {
    return [
      ...baseSteps.slice(0, 6).map((step) => ({ ...step, state: "complete" as const })),
      { id: "delivery-failed", label: "Delivery failed", state: "terminal" },
    ];
  }

  const currentIndex: Record<Exclude<UberDeliveryStatus, "CANCELLED" | "FAILED">, number> = {
    PENDING: 2,
    ASSIGNED: 3,
    DISPATCHED: 4,
    IN_TRANSIT: 5,
    DELIVERED: 6,
  };
  const index = currentIndex[status];

  return baseSteps.map((step, stepIndex) => ({
    ...step,
    state:
      status === "DELIVERED" || stepIndex < index
        ? "complete"
        : stepIndex === index
          ? "current"
          : "upcoming",
  }));
}