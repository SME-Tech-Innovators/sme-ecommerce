"use client";

import type { OrderShippingStatus } from "@/types/shipping";

type Step = { id: string; label: string; description: string; state: string };

export function OrderStatusTimeline({ shipping }: { shipping: OrderShippingStatus }) {
  const status = shipping.status;
  const stages = [
    { id: "created", label: "Label created", description: "Awaiting collection by the carrier." },
    { id: "in_transit", label: "In transit", description: "The carrier has collected your parcel." },
    { id: "delivered", label: "Delivered", description: "The carrier confirmed delivery." },
  ];
  const current = stages.findIndex((step) => step.id === status);
  const steps: Step[] = current >= 0 ? stages.map((step, index) => ({
    ...step,
    description: index > current ? "Awaiting carrier confirmation." : step.description,
    state: index < current ? "complete" : index === current ? "current" : "upcoming",
  })) : [{
    id: status || "pending",
    label: shipping.statusLabel || "Awaiting shipment",
    description: status === "cancelled" ? "Bob Go confirmed the shipment cancellation."
      : status === "cancel_requested" ? "Cancellation is awaiting confirmation from Bob Go."
      : status === "cancellation_unknown" ? "The store is checking the cancellation with Bob Go."
      : status === "failed" ? "Contact the store for help with this shipment."
      : "Delivery tracking will update when the carrier confirms the shipment.",
    state: status === "cancelled" || status === "failed" ? "cancelled" : "current",
  }];

  return (
    <ol className="space-y-0" aria-label="Bob Go delivery progress">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const dotClass =
          step.state === "complete"
            ? "bg-[color:var(--sf-accent)]"
            : step.state === "current"
              ? "bg-[color:var(--sf-accent)] ring-4 ring-[color:var(--sf-accent)]/15"
              : step.state === "cancelled"
                ? "bg-red-700"
                : "bg-[color:var(--sf-accent-border-25)]";
        const labelClass =
          step.state === "upcoming"
            ? "text-[color:var(--sf-accent-text-45)]"
            : step.state === "cancelled"
              ? "text-red-800"
              : "text-[color:var(--sf-accent)]";

        return (
          <li key={step.id} className="flex gap-4" aria-current={step.state === "current" ? "step" : undefined}>
            <div className="flex w-5 flex-col items-center">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${dotClass}`} />
              {!isLast ? (
                <span
                  className={`mt-1 w-px flex-1 ${
                    step.state === "complete"
                      ? "bg-[color:var(--sf-accent)]/35"
                      : "bg-[color:var(--sf-accent-border-15)]"
                  }`}
                  aria-hidden
                />
              ) : null}
            </div>
            <div className={`min-w-0 pb-8 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`font-sans text-sm font-semibold ${labelClass}`}
              >
                {step.label}
              </p>
              {step.description ? (
                <p className="mt-1 font-sans text-xs leading-relaxed text-[color:var(--sf-accent-text-55)]">
                  {step.description}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
