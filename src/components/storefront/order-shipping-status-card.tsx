"use client";

import { usePublicOrderShipping } from "@/hooks/use-public-order-shipping";
import { bobGoPublicTrackingUrl } from "@/lib/bob-go-tracking-url";

type OrderShippingStatusCardProps = {
  storeSlug: string;
  orderId: string;
};

export function OrderShippingStatusCard({
  storeSlug,
  orderId,
}: OrderShippingStatusCardProps) {
  const shippingQuery = usePublicOrderShipping(storeSlug, orderId);

  if (shippingQuery.isLoading && !shippingQuery.data) {
    return (
      <p className="mt-3 font-sans text-xs text-[color:var(--sf-accent-text-45)]">
        Loading delivery status…
      </p>
    );
  }

  if (shippingQuery.isError || !shippingQuery.data) {
    return (
      <p className="mt-3 font-sans text-xs text-[color:var(--sf-accent-text-45)]">
        Delivery timing is arranged by the store. Carrier tracking will appear
        here once your shipment is booked.
      </p>
    );
  }

  const data = shippingQuery.data;
  const trackingPageUrl = bobGoPublicTrackingUrl(
    data.trackingReference,
    data.trackingUrl,
  );
  const hasTracking =
    Boolean(data.trackingReference) ||
    Boolean(data.statusLabel) ||
    Boolean(data.carrierName);

  if (!hasTracking && !data.lastError) {
    return (
      <p className="mt-3 font-sans text-xs text-[color:var(--sf-accent-text-45)]">
        {shippingQuery.isFetching
          ? "Booking your shipment with the courier…"
          : "Your order is being prepared for dispatch. Tracking will appear here shortly."}
      </p>
    );
  }

  return (
    <dl className="mt-3 space-y-2 font-sans text-sm text-[color:var(--sf-accent-text-70)]">
      {data.shippingOptionLabel ? (
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--sf-accent-text-45)]">
            Service
          </dt>
          <dd>{data.shippingOptionLabel}</dd>
        </div>
      ) : null}
      {data.statusLabel ? (
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--sf-accent-text-45)]">
            Status
          </dt>
          <dd>{data.statusLabel}</dd>
        </div>
      ) : null}
      {data.carrierName ? (
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--sf-accent-text-45)]">
            Carrier
          </dt>
          <dd>{data.carrierName}</dd>
        </div>
      ) : null}
      {data.trackingReference ? (
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--sf-accent-text-45)]">
            Tracking reference
          </dt>
          <dd className="font-mono text-[13px]">{data.trackingReference}</dd>
          {trackingPageUrl ? (
            <dd className="mt-2">
              <a
                href={trackingPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex font-sans text-sm font-semibold text-[color:var(--sf-accent)] underline decoration-[color:var(--sf-accent-border-25)] underline-offset-4 hover:decoration-[color:var(--sf-accent)]"
              >
                Track on Bob Go
              </a>
            </dd>
          ) : null}
        </div>
      ) : null}
      {data.lastError ? (
        <p className="text-xs text-amber-800" role="status">
          Shipment update: {data.lastError}
        </p>
      ) : null}
      {shippingQuery.isFetching ? (
        <p className="text-[11px] text-[color:var(--sf-accent-text-45)]">
          Updating delivery status…
        </p>
      ) : null}
    </dl>
  );
}
