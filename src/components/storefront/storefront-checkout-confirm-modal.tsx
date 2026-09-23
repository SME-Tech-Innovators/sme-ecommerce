"use client";

import { useId } from "react";
import { Modal } from "@modals";
import {
  StorefrontButton,
} from "@/components/storefront/storefront-button";
import { formatMinorAmount } from "@/lib/format-money";

type SummaryLine = {
  label: string;
  detail?: string;
  amountLabel: string;
};

type StorefrontCheckoutConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirming: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  lines: SummaryLine[];
  subtotalLabel: string;
  shippingLabel: string;
  totalLabel: string;
};

export function StorefrontCheckoutConfirmModal({
  open,
  onClose,
  onConfirm,
  confirming,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  lines,
  subtotalLabel,
  shippingLabel,
  totalLabel,
}: StorefrontCheckoutConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Modal
      open={open}
      onClose={confirming ? () => undefined : onClose}
      labelledBy={titleId}
      describedBy={descriptionId}
      closeOnBackdropClick={!confirming}
      panelClassName="max-w-lg border-[color:var(--sf-accent-border-15)] px-5 py-6 sm:px-7 sm:py-8"
      overlayClassName="absolute inset-0 bg-[color:var(--sf-accent)]/40 backdrop-blur-sm"
    >
      <p
        id={titleId}
        className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--sf-accent-text-45)]"
      >
        {title}
      </p>
      <p
        id={descriptionId}
        className="mt-2 font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-60)]"
      >
        {description}
      </p>

      {lines.length > 0 ? (
        <ul className="mt-5 max-h-40 space-y-2 overflow-y-auto border-y border-[color:var(--sf-accent-border-10)] py-4">
          {lines.map((line) => (
            <li
              key={`${line.label}-${line.amountLabel}`}
              className="flex justify-between gap-3 font-sans text-sm"
            >
              <span className="min-w-0 text-[color:var(--sf-accent)]">
                {line.label}
                {line.detail ? (
                  <span className="mt-0.5 block text-xs text-[color:var(--sf-accent-text-45)]">
                    {line.detail}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 tabular-nums text-[color:var(--sf-accent)]">
                {line.amountLabel}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <dl className="mt-4 space-y-1.5 font-sans text-sm text-[color:var(--sf-accent)]">
        <div className="flex justify-between gap-3">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{subtotalLabel}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Shipping</dt>
          <dd className="tabular-nums">{shippingLabel}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-[color:var(--sf-accent-border-10)] pt-3 text-base font-bold">
          <dt>Total</dt>
          <dd className="tabular-nums">{totalLabel}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <StorefrontButton
          type="button"
          variant="outline"
          className="w-full rounded-none sm:w-auto"
          disabled={confirming}
          onClick={onClose}
        >
          {cancelLabel}
        </StorefrontButton>
        <StorefrontButton
          type="button"
          className="w-full rounded-none font-bold sm:w-auto"
          disabled={confirming}
          onClick={onConfirm}
        >
          {confirming ? "Please wait…" : confirmLabel}
        </StorefrontButton>
      </div>
      <p className="mt-3 text-center font-sans text-[11px] text-[color:var(--sf-accent-text-45)] sm:text-left">
        Card payments are processed securely via Paystack.
      </p>
    </Modal>
  );
}

export function formatCheckoutModalLines(
  items: { title: string; quantity: number; priceLabel: string }[],
): SummaryLine[] {
  return items.map((line) => ({
    label: `${line.title} × ${line.quantity}`,
    amountLabel: line.priceLabel,
  }));
}

export function shippingSummaryLabel(
  selected: { amount: number; currency: string; label: string } | null,
  shippingRequired: boolean,
  currency: string,
): string {
  if (selected) {
    return formatMinorAmount(selected.amount, selected.currency);
  }
  return shippingRequired ? "Not selected" : formatMinorAmount(0, currency);
}
