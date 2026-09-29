"use client";

import { ExternalLink, RefreshCw } from "lucide-react";
import type { UberDirectDelivery } from "@/types/delivery";
import {
  buildDeliveryTimeline,
  normalizeUberDeliveryStatus,
  uberDeliveryStatusLabel,
} from "@/lib/uber-delivery-status";

type DeliveryTrackingProps = {
  delivery: UberDirectDelivery;
  variant?: "storefront" | "dashboard";
  onRefresh?: () => void;
  isRefreshing?: boolean;
  refreshError?: string | null;
  feeLabel?: string;
  estimatedDeliveryTime?: string | null;
};

function safeTrackingUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function DeliveryTracking({
  delivery,
  variant = "storefront",
  onRefresh,
  isRefreshing = false,
  refreshError,
  feeLabel,
  estimatedDeliveryTime,
}: DeliveryTrackingProps) {
  const dashboard = variant === "dashboard";
  const status = normalizeUberDeliveryStatus(delivery.status);
  const timeline = buildDeliveryTimeline(delivery.status);
  const trackingUrl = safeTrackingUrl(delivery.trackingUrl);
  const textClass = dashboard
    ? "text-primary-blue"
    : "text-[color:var(--sf-accent)]";
  const mutedClass = dashboard
    ? "text-muted-foreground"
    : "text-[color:var(--sf-accent-text-55)]";
  const borderClass = dashboard
    ? "border-primary-blue/10"
    : "border-[color:var(--sf-accent-border-10)]";
  const completedDot = dashboard
    ? "bg-primary-blue"
    : "bg-[color:var(--sf-accent)]";
  const upcomingDot = dashboard
    ? "bg-blue-gray"
    : "bg-[color:var(--sf-accent-border-25)]";
  const terminalText = "text-red-700";

  return (
    <section
      aria-label="Uber Direct delivery tracking"
      className={`space-y-4 ${dashboard ? "" : `border ${borderClass} bg-white p-4 sm:p-5`}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={`font-sans text-[11px] font-semibold uppercase tracking-[0.14em] ${mutedClass}`}>
            Delivery
          </h3>
          <p className={`mt-1 font-sans text-sm font-semibold ${textClass}`}>
            Uber Direct
          </p>
          <p className={`mt-1 font-sans text-xs ${mutedClass}`}>
            Status: {uberDeliveryStatusLabel(delivery.status)}
          </p>
          {feeLabel || estimatedDeliveryTime ? (
            <p className={`mt-1 font-sans text-xs ${mutedClass}`}>
              {[feeLabel, estimatedDeliveryTime].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`inline-flex items-center gap-2 border ${borderClass} px-3 py-2 font-sans text-xs font-semibold ${textClass} hover:bg-blue-gray/20 disabled:opacity-50`}
          >
            <RefreshCw
              aria-hidden
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing…" : "Refresh Status"}
          </button>
        ) : null}
      </div>

      <ol className="mt-5 space-y-0">
        {timeline.map((step, index) => {
          const last = index === timeline.length - 1;
          const isTerminal = step.state === "terminal";
          const dotClass = isTerminal
            ? "bg-red-700"
            : step.state === "complete"
              ? completedDot
              : step.state === "current"
                ? `${completedDot} ring-4 ${dashboard ? "ring-primary-blue/15" : "ring-[color:var(--sf-accent)]/15"}`
                : upcomingDot;
          const labelClass = isTerminal
            ? terminalText
            : step.state === "upcoming"
              ? mutedClass
              : textClass;

          return (
            <li key={step.id} className="flex gap-3">
              <span className="flex w-4 shrink-0 flex-col items-center">
                <span
                  className={`mt-1 size-2.5 rounded-full ${dotClass}`}
                  aria-hidden
                />
                {!last ? (
                  <span
                    className={`mt-1 w-px flex-1 ${step.state === "complete" ? completedDot : upcomingDot} opacity-30`}
                    aria-hidden
                  />
                ) : null}
              </span>
              <span
                className={`min-w-0 pb-4 font-sans text-xs font-semibold ${labelClass}`}
                aria-current={step.state === "current" ? "step" : undefined}
              >
                {step.label}
                {step.state === "complete" ? (
                  <span className="sr-only">, complete</span>
                ) : null}
                {step.state === "current" ? (
                  <span className="sr-only">, current</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>

      <dl className={`grid grid-cols-1 gap-3 border-t ${borderClass} pt-4 text-xs sm:grid-cols-2`}>
        {delivery.courier?.name ? (
          <div>
            <dt className={mutedClass}>Courier</dt>
            <dd className={`mt-0.5 font-semibold ${textClass}`}>
              {delivery.courier.name}
            </dd>
          </div>
        ) : null}
        {delivery.courier?.phone ? (
          <div>
            <dt className={mutedClass}>Courier phone</dt>
            <dd className={`mt-0.5 font-semibold ${textClass}`}>
              {delivery.courier.phone}
            </dd>
          </div>
        ) : null}
        {delivery.pickupEta != null ? (
          <div>
            <dt className={mutedClass}>Pickup ETA</dt>
            <dd className={`mt-0.5 font-semibold ${textClass}`}>
              {delivery.pickupEta} minutes
            </dd>
          </div>
        ) : null}
        {delivery.dropoffEta != null ? (
          <div>
            <dt className={mutedClass}>Drop-off ETA</dt>
            <dd className={`mt-0.5 font-semibold ${textClass}`}>
              {delivery.dropoffEta} minutes
            </dd>
          </div>
        ) : null}
      </dl>

      {refreshError ? (
        <p className="mt-3 font-sans text-xs text-red-700" role="alert">
          {refreshError}
        </p>
      ) : null}

      {trackingUrl ? (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-4 inline-flex items-center gap-2 font-sans text-xs font-semibold ${textClass} underline underline-offset-4`}
        >
          Track Delivery
          <ExternalLink aria-hidden className="size-3.5" />
        </a>
      ) : null}

      <span className="sr-only">Delivery status: {status}</span>
    </section>
  );
}