"use client";

import { useId } from "react";
import { Modal } from "@modals";
import {
  StorefrontButton,
  StorefrontButtonLink,
} from "@/components/storefront/storefront-button";
import { formatMajorAmount } from "@/lib/format-money";

type StorefrontOrderSuccessModalProps = {
  open: boolean;
  onClose: () => void;
  onViewDelivery: () => void;
  customerName: string;
  businessName: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  homeHref: string;
  shopHref: string;
  trackHref: string;
  bobGoTrackingUrl?: string | null;
};

export function StorefrontOrderSuccessModal({
  open,
  onClose,
  onViewDelivery,
  customerName,
  businessName,
  orderNumber,
  totalAmount,
  currency,
  customerEmail,
  customerPhone,
  homeHref,
  shopHref,
  trackHref,
  bobGoTrackingUrl,
}: StorefrontOrderSuccessModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={descriptionId}
      panelClassName="max-w-lg border-[color:var(--sf-accent-border-15)] px-5 py-6 sm:px-7 sm:py-8"
      overlayClassName="absolute inset-0 bg-[color:var(--sf-accent)]/40 backdrop-blur-sm"
    >
      <p
        id={titleId}
        className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800/80"
      >
        Payment confirmed
      </p>
      <h2 className="mt-2 font-serif text-2xl font-light text-[color:var(--sf-accent)] sm:text-3xl">
        Thank you for your order
      </h2>
      <p
        id={descriptionId}
        className="mt-3 font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-60)]"
      >
        Hi {customerName}, your payment to{" "}
        <span className="font-semibold text-[color:var(--sf-accent)]">
          {businessName}
        </span>{" "}
        was successful. Order{" "}
        <span className="font-semibold text-[color:var(--sf-accent)]">
          {orderNumber}
        </span>{" "}
        is confirmed (
        <span className="tabular-nums">
          {formatMajorAmount(totalAmount, currency)}
        </span>
        ).
      </p>
      {customerEmail ? (
        <p className="mt-2 font-sans text-xs leading-relaxed text-[color:var(--sf-accent-text-45)]">
          Confirmation details will be sent to{" "}
          <span className="font-medium text-[color:var(--sf-accent)]">
            {customerEmail}
          </span>
          .
        </p>
      ) : customerPhone ? (
        <p className="mt-2 font-sans text-xs leading-relaxed text-[color:var(--sf-accent-text-45)]">
          We’ll use{" "}
          <span className="font-medium text-[color:var(--sf-accent)]">
            {customerPhone}
          </span>{" "}
          if the store needs to reach you about delivery.
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-2">
        {bobGoTrackingUrl ? (
          <StorefrontButtonLink
            href={bobGoTrackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-none font-bold"
            onClick={onClose}
          >
            Track on Bob Go
          </StorefrontButtonLink>
        ) : null}
        <StorefrontButton
          type="button"
          variant={bobGoTrackingUrl ? "outline" : "primary"}
          className="w-full rounded-none font-bold"
          onClick={onViewDelivery}
        >
          View order on this page
        </StorefrontButton>
        <StorefrontButtonLink
          href={trackHref}
          variant="outline"
          className="w-full rounded-none"
          onClick={onClose}
        >
          Look up order later
        </StorefrontButtonLink>
        <StorefrontButtonLink
          href={shopHref}
          variant="outline"
          className="w-full rounded-none"
          onClick={onClose}
        >
          Continue shopping
        </StorefrontButtonLink>
        <StorefrontButtonLink
          href={homeHref}
          variant="text"
          className="w-full justify-center text-sm"
          onClick={onClose}
        >
          Back to home
        </StorefrontButtonLink>
      </div>
    </Modal>
  );
}
