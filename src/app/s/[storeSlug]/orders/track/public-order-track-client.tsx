"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import {
  StorefrontButton,
  StorefrontButtonLink,
} from "@/components/storefront/storefront-button";
import { OrderStatusTimeline } from "@/components/storefront/order-status-timeline";
import { StorefrontThemeRoot } from "@/components/storefront/storefront-theme-root";
import { StorefrontSiteFooter, StorefrontSiteHeader } from "@/components/storefront/storefront-chrome";
import { useLookupPublicOrder } from "@/hooks/use-checkout";
import { usePublicStorefront } from "@/hooks/use-public-storefront";
import { formatMajorAmount } from "@/lib/format-money";
import {
  formatShipTo,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/order-status";
import { publicStorefrontBasePath } from "@/lib/preview-shop-href";
import type { Order } from "@/types/cart";

type PublicOrderTrackClientProps = {
  storeSlug: string;
};

const fieldClass =
  "mt-1.5 w-full border-0 bg-[color:var(--sf-nav-hover-wash)] px-4 py-3 font-sans text-sm text-[color:var(--sf-accent)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-accent)]/20";
const labelClass =
  "block font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--sf-accent-text-55)]";

function OrderResultCard({
  order,
  basePath,
}: {
  order: Order;
  basePath: string;
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--sf-accent-text-45)]">
          Order {order.orderNumber}
        </p>
        <h2 className="mt-2 font-serif text-2xl font-light text-[color:var(--sf-accent)]">
          {orderStatusLabel(order.status)}
        </h2>
        <p className="mt-2 font-sans text-sm text-[color:var(--sf-accent-text-60)]">
          Payment · {paymentStatusLabel(order.paymentStatus)}
        </p>
      </div>

      <OrderStatusTimeline order={order} />

      <div className="border border-[color:var(--sf-accent-border-10)] bg-white p-5">
        <h3 className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--sf-accent)]">
          Ship to
        </h3>
        <p className="mt-2 font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-70)]">
          {formatShipTo(order) || "—"}
        </p>
        <p className="mt-3 font-sans text-xs text-[color:var(--sf-accent-text-45)]">
          Delivery timing is arranged by the store. Carrier tracking is not
          available here yet.
        </p>
      </div>

      <div className="border border-[color:var(--sf-accent-border-10)] bg-white p-5">
        <h3 className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--sf-accent)]">
          Items
        </h3>
        <ul className="mt-3 divide-y divide-[color:var(--sf-accent-border-10)]">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between gap-4 py-3 font-sans text-sm"
            >
              <span>
                {item.title} × {item.quantity}
              </span>
              <span className="shrink-0 font-semibold">
                {formatMajorAmount(item.totalAmount, item.currency)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-[color:var(--sf-accent-border-10)] pt-3 font-sans text-sm font-bold text-[color:var(--sf-accent)]">
          <span>Total</span>
          <span>{formatMajorAmount(order.totalAmount, order.currency)}</span>
        </div>
      </div>

      <StorefrontButtonLink
        href={`${basePath}/order/${order.id}`}
        variant="outline"
        className="rounded-none"
      >
        Open order confirmation
      </StorefrontButtonLink>
    </div>
  );
}

export function PublicOrderTrackClient({
  storeSlug,
}: PublicOrderTrackClientProps) {
  const basePath = publicStorefrontBasePath(storeSlug);
  const storefrontQuery = usePublicStorefront(storeSlug);
  const lookupMutation = useLookupPublicOrder(storeSlug);
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<Order | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFound(null);
    const nextNumber = orderNumber.trim();
    const nextEmail = email.trim();
    if (!nextNumber || !nextEmail) {
      setFormError("Enter your order number and email.");
      return;
    }
    try {
      const order = await lookupMutation.mutateAsync({
        orderNumber: nextNumber,
        email: nextEmail,
      });
      setFound(order);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "We couldn’t find an order with those details.",
      );
    }
  }

  if (storefrontQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (storefrontQuery.isError || !storefrontQuery.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <h1 className="font-serif text-2xl text-primary-blue">
          Store not available
        </h1>
        <Link
          href="/"
          className="mt-2 font-sans text-sm font-semibold text-primary-blue underline"
        >
          Go home
        </Link>
      </div>
    );
  }

  const config = storefrontQuery.data.config;

  return (
    <StorefrontThemeRoot config={config}>
      <div className="@container/storefront min-h-screen bg-[color:var(--sf-page-bg)]">
        <StorefrontSiteHeader config={config} basePath={basePath} />
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-14">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--sf-accent-text-45)]">
            Orders
          </p>
          <h1 className="mt-2 font-serif text-3xl font-light text-[color:var(--sf-accent)] sm:text-4xl">
            Track your order
          </h1>
          <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-60)]">
            Enter the order number from your confirmation and the email you used
            at checkout.
          </p>

          <form
            onSubmit={(e) => void onSubmit(e)}
            className="mt-8 space-y-5 border border-[color:var(--sf-accent-border-10)] bg-white p-6 sm:p-8"
            noValidate
          >
            <label className={labelClass}>
              Order number
              <input
                required
                name="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="ORD-…"
                autoComplete="off"
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Email
              <input
                required
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className={fieldClass}
              />
            </label>
            {formError ? (
              <p className="font-sans text-xs text-red-700" role="alert">
                {formError}
              </p>
            ) : null}
            <StorefrontButton
              type="submit"
              className="rounded-none"
              disabled={lookupMutation.isPending}
            >
              {lookupMutation.isPending ? "Looking up…" : "Check status"}
            </StorefrontButton>
          </form>

          {found ? (
            <section className="mt-10 border border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-nav-hover-wash)] p-6 sm:p-8">
              <OrderResultCard order={found} basePath={basePath} />
            </section>
          ) : null}

          <p className="mt-8 font-sans text-xs text-[color:var(--sf-accent-text-45)]">
            Need help?{" "}
            <Link
              href={`${basePath}/contact`}
              className="font-semibold text-[color:var(--sf-accent)] underline"
            >
              Contact the store
            </Link>
          </p>
        </main>
        <StorefrontSiteFooter config={config} basePath={basePath} />
      </div>
    </StorefrontThemeRoot>
  );
}
