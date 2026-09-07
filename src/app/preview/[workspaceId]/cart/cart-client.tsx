"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { usePreviewCartOptional } from "@/contexts/preview-cart-context";
import {
  StorefrontButton,
  StorefrontButtonLink,
} from "@/components/storefront/storefront-button";
import { StorefrontThemeRoot } from "@/components/storefront/storefront-theme-root";
import { StorefrontSiteFooter, StorefrontSiteHeader } from "@/components/storefront/storefront-chrome";
import { usePreviewStorefrontConfig } from "@/hooks/use-preview-storefront-config";
import { StreetAddressAutocomplete } from "@/components/storefront/street-address-autocomplete";
import type { PreviewCartLine } from "@/types/preview-cart";

type CartClientProps = {
  workspaceId: string;
  initialStep?: CartStep;
};

type CartStep = "cart" | "checkout" | "payment" | "confirmation";

type StepMeta = {
  id: CartStep;
  label: string;
  number: number;
};

const steps: StepMeta[] = [
  { id: "cart", label: "Shopping Cart", number: 1 },
  { id: "checkout", label: "Checkout", number: 2 },
  { id: "payment", label: "Payment", number: 3 },
  { id: "confirmation", label: "Confirmation", number: 4 },
];

const fieldClass =
  "mt-2 w-full border-0 bg-[color:var(--sf-nav-hover-wash)] px-4 py-3 font-sans text-sm text-[color:var(--sf-accent)] outline-none placeholder:text-[color:var(--sf-accent-text-45)] focus:ring-2 focus:ring-[color:var(--sf-accent)]/15";

const labelClass =
  "font-sans text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--sf-accent)]";

function parsePriceLabel(label: string): number | null {
  const cleaned = label.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

function currencyPrefix(label: string): string {
  const match = label.match(/^[^\d-]+/);
  return match?.[0].trim() || "R";
}

function formatMoney(value: number, prefix: string): string {
  return `${prefix} ${value.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function stepIndex(step: CartStep): number {
  return steps.findIndex((s) => s.id === step);
}

function Stepper({ activeStep }: { activeStep: CartStep }) {
  const activeIndex = stepIndex(activeStep);

  return (
    <div className="rounded-sm bg-white px-6 py-7 shadow-sm">
      <div className="grid grid-cols-4 items-start gap-2">
        {steps.map((step, index) => {
          const complete = index < activeIndex;
          const active = step.id === activeStep;

          return (
            <div key={step.id} className="relative flex flex-col items-center">
              {index < steps.length - 1 ? (
                <div className="absolute left-1/2 top-4 h-px w-full bg-[color:var(--sf-accent-border-10)]" />
              ) : null}
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full font-sans text-xs font-bold ${
                  active
                    ? "bg-[color:var(--sf-accent)] text-[color:var(--sf-cart-badge-fg)]"
                    : complete
                      ? "bg-[color:var(--sf-accent)]/10 text-[color:var(--sf-accent)]"
                      : "bg-white text-[color:var(--sf-accent-text-45)] ring-1 ring-[color:var(--sf-accent-border-15)]"
                }`}
              >
                {complete ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </span>
              <span className="mt-3 max-w-24 text-center font-sans text-sm font-bold text-[color:var(--sf-accent)]">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderTotals({
  lines,
  itemCount,
}: {
  lines: PreviewCartLine[];
  itemCount: number;
}) {
  const pricedLines = lines.map((line) => ({
    line,
    price: parsePriceLabel(line.priceLabel),
  }));
  const canCalculate = pricedLines.every(({ price }) => price !== null);
  const prefix = lines[0] ? currencyPrefix(lines[0].priceLabel) : "R";
  const subtotal = pricedLines.reduce(
    (sum, { line, price }) => sum + (price ?? 0) * line.quantity,
    0,
  );
  const promo = 0;
  const vat = canCalculate ? subtotal * 0.15 : 0;
  const shipping = 0;
  const total = subtotal - promo + vat + shipping;

  return {
    canCalculate,
    itemCount,
    prefix,
    subtotal,
    promo,
    vat,
    shipping,
    total,
  };
}

function OrderSummary({
  lines,
  itemCount,
  onCheckout,
  showCheckoutButton,
}: {
  lines: PreviewCartLine[];
  itemCount: number;
  onCheckout?: () => void;
  showCheckoutButton?: boolean;
}) {
  const totals = OrderTotals({ lines, itemCount });

  return (
    <aside className="h-fit bg-white p-6 shadow-sm lg:sticky lg:top-28">
      <h2 className="border-b border-[color:var(--sf-accent-border-15)] pb-4 font-sans text-lg font-bold text-[color:var(--sf-accent)]">
        Order Summary
      </h2>
      <div className="mt-5 space-y-4 font-sans text-sm text-[color:var(--sf-accent)]">
        <div className="flex justify-between gap-4">
          <span>Total Items: {itemCount}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Total costs (excl VAT)</span>
          <span>
            {totals.canCalculate
              ? formatMoney(totals.subtotal, totals.prefix)
              : `${itemCount} products`}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Promo discount</span>
          <span>
            {totals.canCalculate
              ? formatMoney(totals.promo, totals.prefix)
              : "R 0.00"}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>VAT (15%)</span>
          <span>
            {totals.canCalculate
              ? formatMoney(totals.vat, totals.prefix)
              : "Confirmed later"}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Shipping</span>
          <span>
            {totals.canCalculate
              ? formatMoney(totals.shipping, totals.prefix)
              : "Confirmed later"}
          </span>
        </div>
        <div className="flex justify-between gap-4 pt-5 text-lg font-bold">
          <span>Total amount</span>
          <span>
            {totals.canCalculate
              ? formatMoney(totals.total, totals.prefix)
              : "Shown in product prices"}
          </span>
        </div>
      </div>

      {showCheckoutButton ? (
        <StorefrontButton
          type="button"
          disabled={lines.length === 0}
          onClick={onCheckout}
          className="mt-7 w-full rounded-none font-bold"
        >
          Proceed to Checkout
        </StorefrontButton>
      ) : null}
    </aside>
  );
}

function CartStepView({
  lines,
  incrementLine,
  decrementLine,
  removeLine,
}: {
  lines: PreviewCartLine[];
  incrementLine: (productId: string) => void;
  decrementLine: (productId: string) => void;
  removeLine: (productId: string) => void;
}) {
  if (lines.length === 0) {
    return (
      <section className="bg-white p-8 text-center shadow-sm">
        <h2 className="font-sans text-lg font-bold text-[color:var(--sf-accent)]">
          Your shopping cart is empty
        </h2>
        <p className="mt-2 font-sans text-sm text-[color:var(--sf-accent-text-60)]">
          Add products from the catalogue before checking out.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden bg-white shadow-sm">
      <div className="hidden grid-cols-[1fr_160px_140px_48px] border-b border-[color:var(--sf-accent-border-10)] px-6 py-3 font-sans text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--sf-accent)] md:grid">
        <span>Product</span>
        <span>Quantity</span>
        <span>Price</span>
        <span />
      </div>
      <ul className="divide-y divide-[color:var(--sf-accent-border-10)]">
        {lines.map((line) => (
          <li
            key={line.productId}
            className="grid gap-4 bg-[color:var(--sf-nav-hover-wash)] p-6 md:grid-cols-[1fr_160px_140px_48px] md:items-center"
          >
            <div className="flex min-w-0 gap-5">
              <div className="h-20 w-20 shrink-0 overflow-hidden bg-white">
                {line.imageUrl.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={line.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-sans text-sm font-bold uppercase text-[color:var(--sf-accent)]">
                  {line.title}
                </h2>
                <p className="mt-3 font-sans text-sm text-[color:var(--sf-accent-text-60)]">
                  {line.sku}
                </p>
              </div>
            </div>
            <div className="inline-flex w-fit border border-[color:var(--sf-accent)] bg-white">
              <button
                type="button"
                onClick={() => decrementLine(line.productId)}
                disabled={line.quantity <= 1}
                className="h-10 w-10 font-sans text-sm text-[color:var(--sf-accent)] disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="flex h-10 w-14 items-center justify-center border-x border-[color:var(--sf-accent)] font-sans text-sm text-[color:var(--sf-accent)]">
                {line.quantity}
              </span>
              <button
                type="button"
                onClick={() => incrementLine(line.productId)}
                className="h-10 w-10 font-sans text-sm text-[color:var(--sf-accent)]"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <p className="font-sans text-sm font-bold text-[color:var(--sf-accent)]">
              {line.priceLabel}
            </p>
            <StorefrontButton
              type="button"
              onClick={() => removeLine(line.productId)}
              variant="text"
              className="h-10 w-10 text-xl no-underline"
              aria-label="Remove item"
            >
              &times;
            </StorefrontButton>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CheckoutStepView() {
  return (
    <section className="bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-sans text-base font-bold text-[color:var(--sf-accent)]">
        Checkout Address
      </h2>
      <p className="mt-2 font-sans text-sm text-[color:var(--sf-accent-text-60)]">
        Add and confirm the delivery address before moving to payment.
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className={`${labelClass} sm:col-span-2`}>
          Full name
          <input
            required
            name="fullName"
            autoComplete="name"
            className={fieldClass}
            placeholder="Enter your full name"
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Street address
          <StreetAddressAutocomplete
            className={fieldClass}
            placeholder="House number and street name"
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Apartment, suite, unit etc. (optional)
          <input
            name="address2"
            className={fieldClass}
            placeholder="Apt, suite, bldg"
          />
        </label>
        <label className={labelClass}>
          City
          <input
            required
            name="city"
            autoComplete="address-level2"
            className={fieldClass}
            placeholder="City"
          />
        </label>
        <label className={labelClass}>
          Province / State
          <select
            required
            name="region"
            autoComplete="address-level1"
            className={fieldClass}
            defaultValue=""
          >
            <option value="" disabled>
              Select Province
            </option>
            <option>Eastern Cape</option>
            <option>Free State</option>
            <option>Gauteng</option>
            <option>KwaZulu-Natal</option>
            <option>Limpopo</option>
            <option>Mpumalanga</option>
            <option>North West</option>
            <option>Northern Cape</option>
            <option>Western Cape</option>
          </select>
        </label>
        <label className={labelClass}>
          Postal code
          <input
            name="postalCode"
            autoComplete="postal-code"
            className={fieldClass}
            placeholder="0000"
          />
        </label>
        <label className={labelClass}>
          Phone number
          <input
            required
            type="tel"
            name="phone"
            autoComplete="tel"
            className={fieldClass}
            placeholder="+27"
          />
        </label>
      </div>
    </section>
  );
}

function PaymentStepView() {
  return (
    <section className="bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-sans text-base font-bold text-[color:var(--sf-accent)]">
        Payment
      </h2>
      <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-60)]">
        Paystack payment will connect here later. For now this preview skips
        the payment integration and lets you move to confirmation.
      </p>
      <div className="mt-7 rounded-sm bg-[color:var(--sf-nav-hover-wash)] p-5 font-sans text-sm text-[color:var(--sf-accent-text-60)]">
        Paystack checkout placeholder
      </div>
    </section>
  );
}

function ConfirmationStepView() {
  return (
    <section className="bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-sans text-base font-bold text-[color:var(--sf-accent)]">
        Confirmation
      </h2>
      <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-60)]">
        Your preview order has been confirmed locally. A real order record can
        be created once checkout and Paystack are wired to the backend.
      </p>
    </section>
  );
}

export function CartClient({
  workspaceId,
  initialStep = "cart",
}: CartClientProps) {
  const cart = usePreviewCartOptional();
  const storefront = usePreviewStorefrontConfig(workspaceId);
  const [activeStep, setActiveStep] = useState<CartStep>(initialStep);

  if (storefront.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (storefront.status === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <h1 className="font-serif text-2xl text-primary-blue">
          Sign in to preview
        </h1>
        <Link
          href="/signin"
          className="mt-2 font-sans text-sm font-semibold text-primary-blue underline"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  if (storefront.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <h1 className="font-serif text-2xl text-primary-blue">
          No storefront draft
        </h1>
        <p className="max-w-md font-sans text-sm text-muted-foreground">
          {storefront.message}
        </p>
        <Link
          href={`/dashboard/${workspaceId}`}
          className="mt-2 font-sans text-sm font-semibold text-primary-blue underline"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  const config = storefront.config;

  const lines = cart?.lines ?? [];
  const itemCount = cart?.itemCount ?? 0;
  const hasItems = lines.length > 0;

  function goToStep(step: CartStep) {
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    if (activeStep === "checkout") goToStep("cart");
    if (activeStep === "payment") goToStep("checkout");
    if (activeStep === "confirmation") goToStep("payment");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasItems) return;

    if (activeStep === "checkout") {
      goToStep("payment");
      return;
    }

    if (activeStep === "payment") {
      goToStep("confirmation");
    }
  }

  const primaryLabel =
    activeStep === "checkout"
      ? "Confirm Address"
      : activeStep === "payment"
        ? "Skip Payment for Now"
        : "Back to Shop";

  return (
    <StorefrontThemeRoot config={config}>
      <div className="min-h-screen bg-[color:var(--sf-page-bg)]">
        <StorefrontSiteHeader config={config} workspaceId={workspaceId} />

        <main className="mx-auto max-w-[100%] px-4 py-8 sm:px-8 sm:py-10">
          <h1 className="mb-6 font-sans text-2xl font-bold text-[color:var(--sf-accent)]">
            Shopping Cart
          </h1>
          <Stepper activeStep={activeStep} />

          <form
            onSubmit={handleSubmit}
            className="mt-3 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"
          >
            <div>
              {activeStep === "cart" ? (
                <CartStepView
                  lines={lines}
                  incrementLine={cart?.incrementLine ?? (() => undefined)}
                  decrementLine={cart?.decrementLine ?? (() => undefined)}
                  removeLine={cart?.removeLine ?? (() => undefined)}
                />
              ) : null}
              {activeStep === "checkout" ? <CheckoutStepView /> : null}
              {activeStep === "payment" ? <PaymentStepView /> : null}
              {activeStep === "confirmation" ? <ConfirmationStepView /> : null}

              {activeStep !== "cart" ? (
                <div className="mt-8 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={goBack}
                    className="font-sans text-sm font-semibold text-[color:var(--sf-accent)]"
                  >
                    Return to{" "}
                    {activeStep === "checkout"
                      ? "Cart"
                      : activeStep === "payment"
                        ? "Checkout"
                        : "Payment"}
                  </button>
                  {activeStep === "confirmation" ? (
                    <StorefrontButtonLink
                      href={`/preview/${workspaceId}/shop`}
                      className="rounded-none px-10 font-bold"
                    >
                      {primaryLabel}
                    </StorefrontButtonLink>
                  ) : (
                    <StorefrontButton
                      type="submit"
                      disabled={!hasItems}
                      className="rounded-none px-10 font-bold"
                    >
                      {primaryLabel}
                    </StorefrontButton>
                  )}
                </div>
              ) : null}
            </div>

            <OrderSummary
              lines={lines}
              itemCount={itemCount}
              showCheckoutButton={activeStep === "cart"}
              onCheckout={() => goToStep("checkout")}
            />
          </form>
        </main>

        <StorefrontSiteFooter config={config} workspaceId={workspaceId} />
      </div>
    </StorefrontThemeRoot>
  );
}
