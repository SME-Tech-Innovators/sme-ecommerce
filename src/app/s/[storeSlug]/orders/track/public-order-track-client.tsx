"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useState, useSyncExternalStore } from "react";
import {
  StorefrontButton,
  StorefrontButtonLink,
} from "@/components/storefront/storefront-button";
import { OrderShippingStatusCard } from "@/components/storefront/order-shipping-status-card";
import { usePublicOrderShipping } from "@/hooks/use-public-order-shipping";
import { OrderStatusTimeline } from "@/components/storefront/order-status-timeline";
import { StorefrontThemeRoot } from "@/components/storefront/storefront-theme-root";
import { StorefrontSiteFooter, StorefrontSiteHeader } from "@/components/storefront/storefront-chrome";
import { useMutation, useQuery } from "@tanstack/react-query";
import { requestOrderAccessLink, getSecureCustomerOrder } from "@/apis/order-cancellation";
import { CustomerCancellationPanel } from "@/components/storefront/customer-cancellation-panel";
import { usePublicStorefront } from "@/hooks/use-public-storefront";
import { formatMajorAmount } from "@/lib/format-money";
import {
  formatShipTo,
  paymentStatusLabel,
} from "@/lib/order-status";
import { publicStorefrontBasePath } from "@/lib/preview-shop-href";
import type { Order } from "@/types/cart";

type PublicOrderTrackClientProps = {
  storeSlug: string;
};

function subscribeToHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
function readAccessToken() {
  return new URLSearchParams(window.location.hash.slice(1)).get("access") || "";
}
const emptyToken = () => "";

const fieldClass =
  "mt-1.5 w-full border-0 bg-[color:var(--sf-nav-hover-wash)] px-4 py-3 font-sans text-sm text-[color:var(--sf-accent)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-accent)]/20";
const labelClass =
  "block font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--sf-accent-text-55)]";

function OrderResultCard({
  order,
  basePath,
  storeSlug,
  token,
}: {
  order: Order;
  basePath: string;
  storeSlug: string;
  token: string;
}) {
  const shippingQuery = usePublicOrderShipping(storeSlug, order.id);
  const shipping = shippingQuery.data;
  const isBobGo = shipping?.provider?.toLowerCase() === "bobgo";
  return (
    <div className="space-y-8">
      <div>
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--sf-accent-text-45)]">
          Order {order.orderNumber}
        </p>
        <h2 className="mt-2 font-serif text-2xl font-light text-[color:var(--sf-accent)]">
          {shippingQuery.isError ? "Delivery status unavailable" : shipping?.statusLabel || "Awaiting delivery status"}
        </h2>
        <p className="mt-2 font-sans text-sm text-[color:var(--sf-accent-text-60)]">
          Payment · {paymentStatusLabel(order.paymentStatus)}
        </p>
      </div>

      {shippingQuery.isLoading ? <p role="status">Loading Bob Go delivery status…</p> : null}
      {shippingQuery.isError ? <p role="alert">Could not load delivery tracking. Please try again.</p> : null}
      {isBobGo && shipping && !shippingQuery.isError ? <OrderStatusTimeline shipping={shipping} /> : null}
      {shipping && !isBobGo && !shippingQuery.isError ? <p>Delivery is arranged by the store. Contact the store for updates.</p> : null}
      <StorefrontButton variant="outline" disabled={shippingQuery.isFetching} onClick={() => void shippingQuery.refetch()}>
        {shippingQuery.isFetching ? "Updating…" : "Refresh delivery status"}
      </StorefrontButton>
      <CustomerCancellationPanel storeSlug={storeSlug} orderId={order.id} token={token} />

      <div className="border border-[color:var(--sf-accent-border-10)] bg-white p-5">
        <h3 className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--sf-accent)]">
          Ship to
        </h3>
        <p className="mt-2 font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-70)]">
          {formatShipTo(order) || "—"}
        </p>
        <OrderShippingStatusCard storeSlug={storeSlug} orderId={order.id} />
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
  const searchParams = useSearchParams();
  const storefrontQuery = usePublicStorefront(storeSlug);
  const lookupMutation = useMutation({
    mutationFn: (input: { orderNumber: string; email: string }) =>
      requestOrderAccessLink(storeSlug, input.orderNumber, input.email),
  });
  const accessToken = useSyncExternalStore(subscribeToHash, readAccessToken, emptyToken);
  const orderId = searchParams.get("orderId") || "";
  const secureOrder = useQuery({
    queryKey: ["secure-customer-order", storeSlug, orderId, accessToken],
    enabled: !!orderId && !!accessToken, retry: false, gcTime: 0,
    queryFn: () => getSecureCustomerOrder(storeSlug, orderId, accessToken),
    refetchInterval: 30_000,
  });
  const [orderNumber, setOrderNumber] = useState(() => searchParams.get("orderNumber")?.trim() || "");
  const [email, setEmail] = useState("");

  const found = secureOrder.data ?? null;
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setLinkMessage(null);
    const nextNumber = orderNumber.trim();
    const nextEmail = email.trim();
    if (!nextNumber || !nextEmail) {
      setFormError("Enter your order number and email.");
      return;
    }
    try {
      const result = await lookupMutation.mutateAsync({
        orderNumber: nextNumber,
        email: nextEmail,
      });
      setLinkMessage(result.message);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "The order number and email do not match. Check your confirmation and try again.",
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
            at checkout. We’ll email you a secure link to view your order.
          </p>

          <form
            onSubmit={(e) => void onSubmit(e)}
            className="mt-8 space-y-5 border border-[color:var(--sf-accent-border-10)] bg-white p-6 sm:p-8"
          >
            <label className={labelClass}>
              Order number
              <input
                required
                name="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="ORD-…"
                maxLength={50}
                autoComplete="off"
                className={fieldClass}
              />
            </label>
            <p className="font-sans text-xs text-[color:var(--sf-accent-text-60)]">Use the order number from your confirmation email, not the shipping tracking number.</p>
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
            {linkMessage ? <p role="status" className="text-sm">{linkMessage}</p> : null}
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
              {lookupMutation.isPending ? "Sending…" : "Email me a secure link"}
            </StorefrontButton>
          </form>

          {accessToken && secureOrder.isLoading ? <p role="status" className="mt-6">Loading your order…</p> : null}
          {secureOrder.isError ? <p role="alert" className="mt-6 text-red-700">{secureOrder.error.message}</p> : null}

          {found ? (
            <section className="mt-10 border border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-nav-hover-wash)] p-6 sm:p-8">
              <OrderResultCard
                order={found}
                basePath={basePath}
                storeSlug={storeSlug}
                token={accessToken}
              />
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
