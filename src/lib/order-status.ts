import type { Order, OrderStatus, PaymentStatus } from "@/types/cart";

export type OrderTimelineStepId =
  | "placed"
  | "paid"
  | "preparing"
  | "fulfilled";

export type OrderTimelineStep = {
  id: OrderTimelineStepId;
  label: string;
  description: string;
  state: "complete" | "current" | "upcoming" | "cancelled";
};

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending_payment":
      return "Awaiting payment";
    case "paid":
      return "Paid";
    case "processing":
      return "In progress";
    case "fulfilled":
      return "Fulfilled";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function paymentStatusLabel(status: PaymentStatus | string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "unpaid":
      return "Awaiting payment";
    case "initialized":
      return "Payment in progress";
    case "failed":
      return "Payment failed";
    case "refunded":
      return "Refunded";
    default:
      return String(status);
  }
}

/**
 * Human timeline for customers. Shipping carriers / tracking IDs are out of scope.
 */
export function buildOrderTimeline(order: Order): OrderTimelineStep[] {
  if (order.status === "cancelled") {
    return [
      {
        id: "placed",
        label: "Order placed",
        description: "We received your order.",
        state: "complete",
      },
      {
        id: "paid",
        label: "Cancelled",
        description: "This order was cancelled.",
        state: "cancelled",
      },
      {
        id: "preparing",
        label: "Preparing",
        description: "",
        state: "upcoming",
      },
      {
        id: "fulfilled",
        label: "Fulfilled",
        description: "",
        state: "upcoming",
      },
    ];
  }

  const paid =
    order.paymentStatus === "paid" ||
    order.status === "paid" ||
    order.status === "processing" ||
    order.status === "fulfilled";
  const preparing =
    order.status === "processing" || order.status === "fulfilled";
  const fulfilled = order.status === "fulfilled";

  function stateFor(
    done: boolean,
    isCurrent: boolean,
  ): OrderTimelineStep["state"] {
    if (done) return "complete";
    if (isCurrent) return "current";
    return "upcoming";
  }

  return [
    {
      id: "placed",
      label: "Order placed",
      description: "We received your order.",
      state: "complete",
    },
    {
      id: "paid",
      label: "Paid",
      description: paid
        ? "Payment confirmed."
        : order.paymentStatus === "failed"
          ? "Payment failed — try again from your confirmation link."
          : "Waiting for payment.",
      state: stateFor(paid, !paid),
    },
    {
      id: "preparing",
      label: "Preparing",
      description: preparing
        ? "The store is preparing your order."
        : "We’ll start preparing after payment.",
      state: stateFor(preparing, paid && !preparing),
    },
    {
      id: "fulfilled",
      label: "Fulfilled",
      description: fulfilled
        ? "Your order has been delivered."
        : "Delivery status updates automatically from the carrier.",
      state: stateFor(fulfilled, preparing && !fulfilled),
    },
  ];
}

export function formatShipTo(order: Order): string {
  const a = order.shippingAddress;
  return [a.line1, a.line2, a.city, a.province, a.postalCode, a.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}
