"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAppOrigin } from "@/apis/config";
import {
  StorefrontButton,
  StorefrontButtonLink,
} from "@/components/storefront/storefront-button";
import { OrderShippingStatusCard } from "@/components/storefront/order-shipping-status-card";
import { StorefrontCheckoutConfirmModal } from "@/components/storefront/storefront-checkout-confirm-modal";
import { StorefrontOrderSuccessModal } from "@/components/storefront/storefront-order-success-modal";
import { StorefrontThemeRoot } from "@/components/storefront/storefront-theme-root";
import { StorefrontSiteFooter, StorefrontSiteHeader } from "@/components/storefront/storefront-chrome";
import { useOrderConfirmation, useVerifyOrderPayment } from "@/hooks/use-checkout";
import { useInitializeOrderPayment } from "@/hooks/use-payments";
import { usePublicOrderShipping } from "@/hooks/use-public-order-shipping";
import { usePublicStorefront } from "@/hooks/use-public-storefront";
import { bobGoPublicTrackingUrl } from "@/lib/bob-go-tracking-url";
import { formatMajorAmount } from "@/lib/format-money";
import { paymentStatusLabel } from "@/lib/order-status";
import {
  paystackCallbackPath,
  savePaystackReturnPath,
} from "@/lib/paystack-return";
import { publicStorefrontBasePath } from "@/lib/preview-shop-href";

type PublicOrderConfirmationClientProps = {
  storeSlug: string;
  orderId: string;
};

type OrderConfirmationView = {
  paymentStatus: string;
  status: string;
};

function orderCanPay(
  order: OrderConfirmationView | undefined,
  returnedFromPaystack: boolean,
  awaitingPaystack: boolean,
): boolean {
  if (!order) return false;
  const isPaid =
    order.paymentStatus === "paid" || order.status === "paid";
  return (
    !isPaid &&
    !returnedFromPaystack &&
    !awaitingPaystack &&
    (order.paymentStatus === "unpaid" ||
      order.paymentStatus === "initialized" ||
      order.paymentStatus === "failed")
  );
}

export function PublicOrderConfirmationClient({
  storeSlug,
  orderId,
}: PublicOrderConfirmationClientProps) {
  const basePath = publicStorefrontBasePath(storeSlug);
  const searchParams = useSearchParams();
  const storefrontQuery = usePublicStorefront(storeSlug);
  const [awaitingPaystack, setAwaitingPaystack] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payModalDismissed, setPayModalDismissed] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalDismissed, setSuccessModalDismissed] = useState(false);
  const returnedFromPaystack = Boolean(
    searchParams.get("reference") || searchParams.get("trxref"),
  );

  const orderQuery = useOrderConfirmation(storeSlug, orderId, {
    refetchInterval: (order) => {
      if (!order) return false;
      if (order.paymentStatus === "paid") return false;
      if (
        returnedFromPaystack ||
        awaitingPaystack ||
        order.paymentStatus === "initialized" ||
        order.paymentStatus === "unpaid"
      ) {
        return 2500;
      }
      return false;
    },
  });
  const payMutation = useInitializeOrderPayment(storeSlug);
  const verifyMutation = useVerifyOrderPayment(storeSlug);
  const paystackReference =
    searchParams.get("reference")?.trim() ||
    searchParams.get("trxref")?.trim() ||
    "";

  const orderForShipping = orderQuery.data;
  const isPaidForShipping =
    orderForShipping?.paymentStatus === "paid" ||
    orderForShipping?.status === "paid";
  const shippingQuery = usePublicOrderShipping(
    storeSlug,
    orderId,
    Boolean(isPaidForShipping),
  );
  const bobGoTrackingUrl = bobGoPublicTrackingUrl(
    shippingQuery.data?.trackingReference,
    shippingQuery.data?.trackingUrl,
  );
  useEffect(() => {
    if (returnedFromPaystack) {
      setAwaitingPaystack(true);
      void orderQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when Paystack returns
  }, [returnedFromPaystack]);

  useEffect(() => {
    if (!returnedFromPaystack || !paystackReference) return;
    // Always verify on return — even if the order already shows paid (e.g. webhook
    // from another host). Backend heals missing stock decrement idempotently.
    void (async () => {
      try {
        await verifyMutation.mutateAsync({
          orderId,
          reference: paystackReference,
        });
        await orderQuery.refetch();
      } catch {
        /* webhook may still catch up — keep polling */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one verify attempt on return
  }, [returnedFromPaystack, paystackReference, orderId]);

  useEffect(() => {
    if (orderQuery.data?.paymentStatus === "paid") {
      setAwaitingPaystack(false);
      setPayModalOpen(false);
    }
  }, [orderQuery.data?.paymentStatus]);

  useEffect(() => {
    if (successModalDismissed) return;
    const order = orderQuery.data;
    if (!order) return;
    const paid =
      order.paymentStatus === "paid" || order.status === "paid";
    if (paid) {
      setSuccessModalOpen(true);
    }
  }, [
    orderQuery.data,
    orderQuery.data?.paymentStatus,
    orderQuery.data?.status,
    successModalDismissed,
  ]);

  function scrollToDeliverySection() {
    setSuccessModalOpen(false);
    window.requestAnimationFrame(() => {
      document
        .getElementById("order-delivery")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  useEffect(() => {
    if (payModalDismissed) return;
    if (orderCanPay(orderQuery.data, returnedFromPaystack, awaitingPaystack)) {
      setPayModalOpen(true);
    }
  }, [
    orderQuery.data,
    orderQuery.data?.paymentStatus,
    returnedFromPaystack,
    awaitingPaystack,
    payModalDismissed,
  ]);

  async function onPay() {
    try {
      const orderConfirmPath = `${basePath}/order/${orderId}`;
      const callbackUrl = `${getAppOrigin()}${paystackCallbackPath()}`;
      const result = await payMutation.mutateAsync({
        orderId,
        callbackUrl,
      });
      if (result.reference) {
        savePaystackReturnPath(result.reference, orderConfirmPath);
      }
      setAwaitingPaystack(true);
      if (result.authorizationUrl) {
        window.location.assign(result.authorizationUrl);
        return;
      }
      toast.error("Payment could not be started. Please try again.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start payment.",
      );
    }
  }

  if (storefrontQuery.isLoading || orderQuery.isLoading) {
    const loadingShell = (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--sf-page-bg)] font-sans text-sm text-[color:var(--sf-accent-text-55)]">
        Loading order…
      </div>
    );
    if (storefrontQuery.data?.config) {
      return (
        <StorefrontThemeRoot config={storefrontQuery.data.config}>
          {loadingShell}
        </StorefrontThemeRoot>
      );
    }
    return loadingShell;
  }

  if (storefrontQuery.isError || !storefrontQuery.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-serif text-2xl text-primary-blue">
          Store not available
        </h1>
      </div>
    );
  }

  const config = storefrontQuery.data.config;
  const businessName =
    config.shopName?.trim() ||
    storefrontQuery.data.storefront.storeName?.trim() ||
    "our store";

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <StorefrontThemeRoot config={config}>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-serif text-2xl text-[color:var(--sf-accent)]">
            Order not found
          </h1>
          <Link
            href={basePath}
            className="font-sans text-sm font-semibold underline"
          >
            Back to store
          </Link>
        </div>
      </StorefrontThemeRoot>
    );
  }

  const order = orderQuery.data;
  const isPaid =
    order.paymentStatus === "paid" || order.status === "paid";
  const canPay =
    !isPaid &&
    !returnedFromPaystack &&
    !awaitingPaystack &&
    (order.paymentStatus === "unpaid" ||
      order.paymentStatus === "initialized" ||
      order.paymentStatus === "failed");

  return (
    <StorefrontThemeRoot config={config}>
      <div className="min-h-screen bg-[color:var(--sf-page-bg)]">
        <StorefrontSiteHeader config={config} basePath={basePath} />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
          {isPaid ? (
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--sf-accent-text-45)]">
                  Order confirmed
                </p>
                <h1 className="mt-2 font-serif text-3xl font-light text-[color:var(--sf-accent)]">
                  {order.orderNumber}
                </h1>
                <p className="mt-2 font-sans text-sm text-[color:var(--sf-accent-text-60)]">
                  Payment received ·{" "}
                  {formatMajorAmount(order.totalAmount, order.currency)}
                </p>
              </div>
              <StorefrontButton
                type="button"
                variant="outline"
                className="rounded-none text-sm"
                onClick={() => setSuccessModalOpen(true)}
              >
                Order confirmation
              </StorefrontButton>
            </div>
          ) : (
            <div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--sf-accent-text-45)]">
                Order confirmation
              </p>
              <h1 className="mt-2 font-serif text-3xl font-light text-[color:var(--sf-accent)]">
                Thanks, {order.customerName}
              </h1>
              <p className="mt-3 font-sans text-sm text-[color:var(--sf-accent-text-60)]">
                Your order with{" "}
                <span className="font-semibold text-[color:var(--sf-accent)]">
                  {businessName}
                </span>{" "}
                is almost done. Reference{" "}
                <span className="font-semibold">{order.orderNumber}</span>
                {" · "}
                <span className="font-semibold">
                  {paymentStatusLabel(order.paymentStatus)}
                </span>
                .
              </p>
              <p className="mt-2 font-sans text-sm text-[color:var(--sf-accent-text-60)]">
                {awaitingPaystack ||
                returnedFromPaystack ||
                order.paymentStatus === "initialized"
                  ? "Confirming your payment… this page updates automatically."
                  : "Complete payment to confirm this order."}
              </p>
              {canPay ? (
                <div className="mt-5">
                  <StorefrontButton
                    type="button"
                    className="rounded-none"
                    disabled={payMutation.isPending}
                    onClick={() => setPayModalOpen(true)}
                  >
                    Pay now
                  </StorefrontButton>
                </div>
              ) : null}
            </div>
          )}

          {order.shippingAmount > 0 || isPaid ? (
            <section
              id="order-delivery"
              className="mt-8 scroll-mt-24 border border-[color:var(--sf-accent-border-10)] bg-white p-6 shadow-sm"
            >
              <h2 className="font-sans text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--sf-accent)]">
                Delivery
              </h2>
              <OrderShippingStatusCard storeSlug={storeSlug} orderId={orderId} />
            </section>
          ) : null}

          <section className="mt-8 bg-white p-6 shadow-sm">
            <h2 className="font-sans text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--sf-accent)]">
              Order summary
            </h2>
            <ul className="mt-4 divide-y divide-[color:var(--sf-accent-border-10)]">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between gap-4 py-3 font-sans text-sm"
                >
                  <span>
                    {item.title} × {item.quantity}
                    <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                      {item.sku}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {formatMajorAmount(item.totalAmount, item.currency)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-[color:var(--sf-accent-border-10)] pt-4 font-sans text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  {formatMajorAmount(order.subtotalAmount, order.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {formatMajorAmount(order.shippingAmount, order.currency)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>
                  {formatMajorAmount(order.totalAmount, order.currency)}
                </span>
              </div>
            </div>
            {order.customerEmail || order.customerPhone ? (
              <div className="mt-5 border-t border-[color:var(--sf-accent-border-10)] pt-4 font-sans text-xs text-muted-foreground">
                <p>
                  Contact on order:{" "}
                  {[order.customerEmail, order.customerPhone]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            ) : null}
          </section>

          <div className="mt-8 flex flex-wrap gap-3">
            <StorefrontButtonLink href={basePath} className="rounded-none">
              Back to {businessName}
            </StorefrontButtonLink>
            <StorefrontButtonLink
              href={`${basePath}/shop`}
              variant="outline"
              className="rounded-none"
            >
              Continue shopping
            </StorefrontButtonLink>
          </div>
        </main>

        {order && isPaid ? (
          <StorefrontOrderSuccessModal
            open={successModalOpen}
            onClose={() => {
              setSuccessModalDismissed(true);
              setSuccessModalOpen(false);
            }}
            onViewDelivery={scrollToDeliverySection}
            customerName={order.customerName}
            businessName={businessName}
            orderNumber={order.orderNumber}
            totalAmount={order.totalAmount}
            currency={order.currency}
            customerEmail={order.customerEmail}
            customerPhone={order.customerPhone}
            homeHref={basePath}
            shopHref={`${basePath}/shop`}
            trackHref={`${basePath}/orders/track?orderNumber=${encodeURIComponent(order.orderNumber)}`}
            bobGoTrackingUrl={bobGoTrackingUrl}
          />
        ) : null}

        {order && canPay ? (
          <StorefrontCheckoutConfirmModal
            open={payModalOpen}
            onClose={() => {
              setPayModalDismissed(true);
              setPayModalOpen(false);
            }}
            onConfirm={() => void onPay()}
            confirming={payMutation.isPending}
            title="Complete payment"
            description={`Order ${order.orderNumber} · ${formatMajorAmount(order.totalAmount, order.currency)}`}
            confirmLabel="Confirm payment"
            lines={order.items.map((item) => ({
              label: `${item.title} × ${item.quantity}`,
              amountLabel: formatMajorAmount(item.totalAmount, item.currency),
            }))}
            subtotalLabel={formatMajorAmount(
              order.subtotalAmount,
              order.currency,
            )}
            shippingLabel={formatMajorAmount(
              order.shippingAmount,
              order.currency,
            )}
            totalLabel={formatMajorAmount(order.totalAmount, order.currency)}
          />
        ) : null}

        <StorefrontSiteFooter config={config} basePath={basePath} />
      </div>
    </StorefrontThemeRoot>
  );
}
