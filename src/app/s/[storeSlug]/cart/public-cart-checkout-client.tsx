"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { getAppOrigin } from "@/apis/config";
import { postShippingQuote } from "@/apis/shipping";
import {
  StorefrontButton,
  StorefrontButtonLink,
} from "@/components/storefront/storefront-button";
import { StorefrontImagePlaceholder } from "@/components/storefront/storefront-image-placeholder";
import { StorefrontThemeRoot } from "@/components/storefront/storefront-theme-root";
import { StorefrontSiteFooter, StorefrontSiteHeader } from "@/components/storefront/storefront-chrome";
import { usePreviewCartOptional } from "@/contexts/preview-cart-context";
import { useCheckout } from "@/hooks/use-checkout";
import { usePublicStorefront } from "@/hooks/use-public-storefront";
import { StreetAddressAutocomplete } from "@/components/storefront/street-address-autocomplete";
import {
  formatCheckoutModalLines,
  shippingSummaryLabel,
  StorefrontCheckoutConfirmModal,
} from "@/components/storefront/storefront-checkout-confirm-modal";
import { useInitializeOrderPayment } from "@/hooks/use-payments";
import { formatMajorAmount, formatMinorAmount } from "@/lib/format-money";
import {
  paystackCallbackPath,
  savePaystackReturnPath,
} from "@/lib/paystack-return";
import { publicStorefrontBasePath } from "@/lib/preview-shop-href";
import { shippingOptionLabel } from "@/lib/shipping-option-label";
import type { ShippingAddress, ShippingOption } from "@/types/shipping";

type PublicCartCheckoutClientProps = {
  storeSlug: string;
};

type Step = "cart" | "checkout";

const fieldClass =
  "mt-2 w-full border-0 bg-[color:var(--sf-nav-hover-wash)] px-4 py-3 font-sans text-sm text-[color:var(--sf-accent)] outline-none placeholder:text-[color:var(--sf-accent-text-45)] focus:ring-2 focus:ring-[color:var(--sf-accent)]/15";

const labelClass =
  "font-sans text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--sf-accent)]";

function readShippingAddress(form: HTMLFormElement): ShippingAddress | null {
  const line1 = String(new FormData(form).get("address") ?? "").trim();
  const line2 = String(new FormData(form).get("address2") ?? "").trim();
  const city = String(new FormData(form).get("city") ?? "").trim();
  const province = String(new FormData(form).get("region") ?? "").trim();
  const postalCode = String(new FormData(form).get("postalCode") ?? "").trim();
  const country =
    String(new FormData(form).get("country") ?? "ZA").trim() || "ZA";
  if (!line1 || !city) return null;
  return {
    line1,
    ...(line2 ? { line2 } : {}),
    city,
    province,
    postalCode,
    country,
  };
}

function CheckoutSteps({ step }: { step: Step }) {
  const steps = [
    { id: "cart" as const, label: "Cart" },
    { id: "checkout" as const, label: "Details" },
    { id: "pay" as const, label: "Pay" },
  ];
  const activeIndex = step === "cart" ? 0 : 1;

  return (
    <ol className="mb-6 flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--sf-accent-text-45)] sm:mb-8">
      {steps.map((s, i) => {
        const done = i < activeIndex;
        const current = i === activeIndex;
        return (
          <li key={s.id} className="flex items-center gap-2">
            {i > 0 ? (
              <span className="text-[color:var(--sf-accent-border-15)]" aria-hidden>
                /
              </span>
            ) : null}
            <span
              className={
                current || done
                  ? "text-[color:var(--sf-accent)]"
                  : undefined
              }
              aria-current={current ? "step" : undefined}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function PublicCartCheckoutClient({
  storeSlug,
}: PublicCartCheckoutClientProps) {
  const router = useRouter();
  const basePath = publicStorefrontBasePath(storeSlug);
  const cart = usePreviewCartOptional();
  const storefrontQuery = usePublicStorefront(storeSlug);
  const checkoutMutation = useCheckout(storeSlug);
  const payMutation = useInitializeOrderPayment(storeSlug);
  const checkoutFormRef = useRef<HTMLFormElement>(null);
  const lastQuoteKeyRef = useRef<string | null>(null);
  const [step, setStep] = useState<Step>("cart");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingRequired, setShippingRequired] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [addressQuoteTick, setAddressQuoteTick] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [confirmingPay, setConfirmingPay] = useState(false);

  const bumpAddressQuote = useCallback(() => {
    setAddressQuoteTick((t) => t + 1);
  }, []);

  const shippingOptionsCountRef = useRef(0);
  shippingOptionsCountRef.current = shippingOptions.length;

  const fetchDeliveryOptions = useCallback(async () => {
    if (!cart?.cartId) {
      return;
    }
    const form = checkoutFormRef.current;
    if (!form) return;
    const shippingAddress = readShippingAddress(form);
    if (!shippingAddress) {
      return;
    }
    const quoteKey = JSON.stringify(shippingAddress);
    if (
      lastQuoteKeyRef.current === quoteKey &&
      shippingOptionsCountRef.current > 0
    ) {
      return;
    }
    lastQuoteKeyRef.current = quoteKey;
    setQuoteLoading(true);
    setShippingOptions([]);
    setSelectedOptionId(null);
    try {
      const quoteBody = {
        cartId: cart.cartId,
        shippingAddress,
      };
      let result = await postShippingQuote(storeSlug, quoteBody);
      if (!result.ok) {
        if (result.errorCode === "SHIPPING_NOT_CONFIGURED") {
          setShippingRequired(false);
          return;
        }
        throw new Error(result.errorMessage);
      }
      let options = result.data.options;
      let courierOptions = options.filter(
        (o) => o.provider === "bobgo" || o.id.startsWith("bobgo:"),
      );
      if (courierOptions.length === 0 && options.some((o) => o.id === "pickup")) {
        await new Promise((r) => setTimeout(r, 900));
        const retry = await postShippingQuote(storeSlug, quoteBody);
        if (retry.ok) {
          const retryCourier = retry.data.options.filter(
            (o) => o.provider === "bobgo" || o.id.startsWith("bobgo:"),
          );
          if (retryCourier.length > 0) {
            result = retry;
            options = retry.data.options;
            courierOptions = retryCourier;
          }
        }
      }
      setShippingRequired(true);
      setShippingOptions(options);
      if (courierOptions.length === 0 && options.length > 0) {
        toast.warning("Courier rates unavailable", {
          description:
            "Only pickup is available right now. Check the store’s delivery settings or try again.",
        });
        setSelectedOptionId(null);
      } else if (courierOptions.length === 1) {
        setSelectedOptionId(courierOptions[0].id);
      } else if (courierOptions.length > 1) {
        setSelectedOptionId(null);
      }
    } catch (error) {
      lastQuoteKeyRef.current = null;
      toast.error(
        error instanceof Error ? error.message : "Could not load delivery options.",
      );
    } finally {
      setQuoteLoading(false);
    }
  }, [cart?.cartId, storeSlug]);

  useEffect(() => {
    if (step !== "checkout") return;
    const timer = window.setTimeout(() => {
      void fetchDeliveryOptions();
    }, 650);
    return () => window.clearTimeout(timer);
  }, [addressQuoteTick, step, fetchDeliveryOptions]);

  if (storefrontQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--sf-page-bg)] font-sans text-sm text-[color:var(--sf-accent-text-55)]">
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
        <p className="max-w-md font-sans text-sm text-muted-foreground">
          {storefrontQuery.error instanceof Error
            ? storefrontQuery.error.message
            : "This storefront is unpublished or does not exist."}
        </p>
      </div>
    );
  }

  const config = storefrontQuery.data.config;
  const lines = cart?.lines ?? [];
  const busy = Boolean(
    cart?.isBusy ||
      checkoutMutation.isPending ||
      payMutation.isPending ||
      confirmingPay,
  );
  const canProceedCart = lines.length > 0 && !busy && Boolean(cart?.cartId);
  const canPlaceOrder = !busy && Boolean(cart?.cartId);

  const selectedOption =
    shippingOptions.find((o) => o.id === selectedOptionId) ?? null;

  const currency = cart?.currency ?? "ZAR";
  const subtotalMajor = cart?.subtotalAmount ?? 0;
  const shippingMinor = selectedOption?.amount ?? 0;
  const orderTotalMajor = subtotalMajor + shippingMinor / 100;
  const hasSubtotal = cart?.subtotalAmount != null;

  async function placeOrderFromForm() {
    if (!cart?.cartId) {
      throw new Error("Your cart is empty or not ready yet.");
    }
    const form = checkoutFormRef.current;
    if (!form) {
      throw new Error("Checkout form is not ready.");
    }
    const formData = new FormData(form);
    const name = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const line1 = String(formData.get("address") ?? "").trim();
    const line2 = String(formData.get("address2") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const province = String(formData.get("region") ?? "").trim();
    const postalCode = String(formData.get("postalCode") ?? "").trim();
    const country = String(formData.get("country") ?? "ZA").trim() || "ZA";

    if (!email) {
      throw new Error("Please enter your email address.");
    }
    if (shippingRequired && !selectedOption) {
      throw new Error("Choose a delivery option before paying.");
    }

    return checkoutMutation.mutateAsync({
      cartId: cart.cartId,
      customer: {
        name,
        phone,
        email,
      },
      shippingAddress: {
        line1,
        ...(line2 ? { line2 } : {}),
        city,
        province,
        postalCode,
        country,
      },
      ...(selectedOption
        ? {
            shippingSelection: {
              optionId: selectedOption.id,
              provider: selectedOption.provider,
              amount: selectedOption.amount,
              currency: selectedOption.currency,
              ...(selectedOption.bobgoRateToken
                ? { bobgoRateToken: selectedOption.bobgoRateToken }
                : {}),
            },
          }
        : {}),
    });
  }

  function openReviewModal() {
    const form = checkoutFormRef.current;
    if (!form) return;
    if (!form.reportValidity()) return;
    if (shippingRequired && !selectedOption) {
      toast.error("Choose a delivery option to continue.");
      return;
    }
    if (quoteLoading) {
      toast.message("Loading delivery rates…", {
        description: "Wait a moment, then try again.",
      });
      return;
    }
    setReviewModalOpen(true);
  }

  async function confirmReviewAndPay() {
    setConfirmingPay(true);
    try {
      const order = await placeOrderFromForm();
      cart?.discardCartSession?.();
      const orderConfirmPath = `${basePath}/order/${order.id}`;
      const callbackUrl = `${getAppOrigin()}${paystackCallbackPath()}`;
      const payment = await payMutation.mutateAsync({
        orderId: order.id,
        callbackUrl,
      });
      if (payment.reference) {
        savePaystackReturnPath(payment.reference, orderConfirmPath);
      }
      if (payment.authorizationUrl) {
        window.location.assign(payment.authorizationUrl);
        return;
      }
      setConfirmingPay(false);
      toast.error("Payment could not be started. Open your order to try again.");
      router.push(orderConfirmPath);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Checkout failed.",
      );
      setConfirmingPay(false);
    }
  }

  function onCheckoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openReviewModal();
  }

  const summaryTotals = (
    <div className="space-y-2 font-sans text-sm text-[color:var(--sf-accent)]">
      <div className="flex justify-between gap-3">
        <span>Items</span>
        <span>{cart?.itemCount ?? 0}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span>Subtotal</span>
        <span className="tabular-nums">
          {cart
            ? hasSubtotal
              ? formatMajorAmount(subtotalMajor, currency)
              : (cart.subtotalLabel ?? "—")
            : "—"}
        </span>
      </div>
      <div className="flex justify-between gap-3">
        <span>Shipping</span>
        <span>
          {selectedOption
            ? formatMinorAmount(selectedOption.amount, selectedOption.currency)
            : shippingRequired
              ? "Select option"
              : formatMinorAmount(0, currency)}
        </span>
      </div>
      <div className="flex justify-between gap-3 border-t border-[color:var(--sf-accent-border-10)] pt-3 text-base font-bold">
        <span>Total</span>
        <span className="tabular-nums">
          {cart
            ? hasSubtotal
              ? formatMajorAmount(orderTotalMajor, currency)
              : (cart.totalLabel ?? "—")
            : "—"}
        </span>
      </div>
    </div>
  );

  function renderPrimaryActions(compact?: boolean) {
    if (step === "cart") {
      return (
        <StorefrontButton
          type="button"
          className="w-full rounded-none font-bold"
          disabled={!canProceedCart}
          onClick={() => {
            setStep("checkout");
            bumpAddressQuote();
          }}
        >
          Proceed to checkout
        </StorefrontButton>
      );
    }
    return (
      <div className="space-y-2">
        <StorefrontButton
          type="submit"
          form="public-checkout-form"
          className="w-full rounded-none font-bold"
          disabled={!canPlaceOrder || quoteLoading}
        >
          Review & pay
        </StorefrontButton>
        {!compact ? (
          <StorefrontButton
            type="button"
            variant="outline"
            className="w-full rounded-none"
            disabled={busy}
            onClick={() => setStep("cart")}
          >
            Back to cart
          </StorefrontButton>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setStep("cart")}
            className="w-full font-sans text-xs font-semibold text-[color:var(--sf-accent)] underline disabled:opacity-40"
          >
            Back to cart
          </button>
        )}
        <p className="pt-1 text-center font-sans text-[11px] text-[color:var(--sf-accent-text-45)]">
          Confirm totals in a quick summary, then pay with Paystack.
        </p>
      </div>
    );
  }

  return (
    <StorefrontThemeRoot config={config}>
      <div className="min-h-screen bg-[color:var(--sf-page-bg)] pb-28 lg:pb-0">
        <StorefrontSiteHeader config={config} basePath={basePath} />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
          <CheckoutSteps step={step} />
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--sf-accent-text-45)]">
                Checkout
              </p>
              <h1 className="mt-2 font-serif text-3xl font-light text-[color:var(--sf-accent)]">
                {step === "cart" ? "Your cart" : "Delivery details"}
              </h1>
            </div>
            <StorefrontButtonLink
              href={`${basePath}/shop`}
              variant="text"
              className="text-sm"
            >
              Continue shopping
            </StorefrontButtonLink>
          </div>

          {cart?.cartError ? (
            <p className="mb-4 font-sans text-sm text-red-700" role="alert">
              {cart.cartError}
            </p>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(100%,22rem)] xl:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
            <div>
              {step === "cart" ? (
                <section className="overflow-hidden bg-white shadow-sm">
                  {lines.length === 0 ? (
                    <div className="p-8 text-center">
                      <h2 className="font-sans text-lg font-bold text-[color:var(--sf-accent)]">
                        Your shopping cart is empty
                      </h2>
                      <p className="mt-2 font-sans text-sm text-[color:var(--sf-accent-text-60)]">
                        Add products from the shop, then come back to check out.
                      </p>
                      <Link
                        href={`${basePath}/shop`}
                        className="mt-4 inline-block font-sans text-sm font-semibold text-[color:var(--sf-accent)] underline"
                      >
                        Browse shop
                      </Link>
                    </div>
                  ) : (
                    <ul className="divide-y divide-[color:var(--sf-accent-border-10)]">
                      {lines.map((line) => (
                        <li
                          key={line.productId}
                          className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-x-3 gap-y-3 p-4 sm:grid-cols-[4rem_minmax(0,1fr)_auto_auto] sm:gap-4 sm:p-5"
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden bg-[color:var(--sf-nav-hover-wash)]">
                            {line.imageUrl.trim() ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={line.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <StorefrontImagePlaceholder label={line.title} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-sans text-sm font-bold text-[color:var(--sf-accent)]">
                              {line.title}
                            </p>
                            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                              {line.sku}
                            </p>
                            <p className="mt-1 font-sans text-sm tabular-nums">
                              {line.priceLabel}
                            </p>
                          </div>
                          <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:justify-end">
                            <div className="inline-flex border border-[color:var(--sf-accent)]">
                              <button
                                type="button"
                                disabled={busy || line.quantity <= 1}
                                onClick={() =>
                                  cart?.decrementLine(line.productId)
                                }
                                className="h-9 w-9 disabled:opacity-40"
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="flex h-9 w-10 items-center justify-center border-x border-[color:var(--sf-accent)] text-sm tabular-nums">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  cart?.incrementLine(line.productId)
                                }
                                className="h-9 w-9 disabled:opacity-40"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                            <StorefrontButton
                              type="button"
                              variant="text"
                              disabled={busy}
                              onClick={() => cart?.removeLine(line.productId)}
                              className="text-xs"
                            >
                              Remove
                            </StorefrontButton>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ) : (
                <form
                  ref={checkoutFormRef}
                  id="public-checkout-form"
                  onSubmit={(e) => void onCheckoutSubmit(e)}
                  className="space-y-6"
                >
                  <section className="bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="font-sans text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--sf-accent)]">
                      Contact
                    </h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className={`${labelClass} sm:col-span-2`}>
                      Full name
                      <input
                        required
                        name="fullName"
                        autoComplete="name"
                        className={fieldClass}
                      />
                    </label>
                    <label className={labelClass}>
                      Email
                      <input
                        required
                        type="email"
                        name="email"
                        autoComplete="email"
                        className={fieldClass}
                      />
                    </label>
                    <label className={labelClass}>
                      Phone
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

                  <section className="bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="font-sans text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--sf-accent)]">
                      Delivery address
                    </h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className={`${labelClass} sm:col-span-2`}>
                      Street address
                      <StreetAddressAutocomplete
                        className={fieldClass}
                        onAddressApplied={() => bumpAddressQuote()}
                      />
                    </label>
                    <label className={`${labelClass} sm:col-span-2`}>
                      Apartment, suite (optional)
                      <input name="address2" className={fieldClass} />
                    </label>
                    <label className={labelClass}>
                      City
                      <input
                        required
                        name="city"
                        autoComplete="address-level2"
                        className={fieldClass}
                        onBlur={() => bumpAddressQuote()}
                      />
                    </label>
                    <label className={labelClass}>
                      Province
                      <input
                        required
                        name="region"
                        autoComplete="address-level1"
                        className={fieldClass}
                        onBlur={() => bumpAddressQuote()}
                      />
                    </label>
                    <label className={labelClass}>
                      Postal code
                      <input
                        required
                        name="postalCode"
                        autoComplete="postal-code"
                        className={fieldClass}
                        onBlur={() => bumpAddressQuote()}
                      />
                    </label>
                    <label className={labelClass}>
                      Country
                      <input
                        name="country"
                        defaultValue="ZA"
                        autoComplete="country"
                        className={fieldClass}
                        onBlur={() => bumpAddressQuote()}
                      />
                    </label>
                    </div>

                    <div className="mt-6 border-t border-[color:var(--sf-accent-border-10)] pt-5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-sans text-sm font-bold text-[color:var(--sf-accent)]">
                          Delivery method
                        </h3>
                        {quoteLoading ? (
                          <span className="font-sans text-[11px] text-[color:var(--sf-accent-text-45)]">
                            Updating rates…
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 font-sans text-xs text-[color:var(--sf-accent-text-60)]">
                        Options load automatically when your address is complete.
                      </p>
                      {shippingOptions.length > 0 ? (
                        <fieldset className="mt-4 space-y-2">
                          <legend className="sr-only">Choose delivery</legend>
                          {shippingOptions.map((option) => (
                            <label
                              key={option.id}
                              className="flex cursor-pointer items-start gap-3 border border-[color:var(--sf-accent-border-10)] p-3 transition-colors has-[:checked]:border-[color:var(--sf-accent)] has-[:checked]:bg-[color:var(--sf-nav-hover-wash)]/40"
                            >
                              <input
                                type="radio"
                                name="shippingOption"
                                className="mt-1"
                                checked={selectedOptionId === option.id}
                                onChange={() => setSelectedOptionId(option.id)}
                              />
                              <span className="min-w-0 flex-1 font-sans text-sm">
                                <span className="font-semibold text-[color:var(--sf-accent)]">
                                  {shippingOptionLabel(option)}
                                </span>
                                <span className="mt-0.5 block text-[color:var(--sf-accent-text-60)]">
                                  {formatMinorAmount(option.amount, option.currency)}
                                  {option.estimatedDays != null
                                    ? ` · ~${option.estimatedDays} days`
                                    : null}
                                </span>
                              </span>
                            </label>
                          ))}
                        </fieldset>
                      ) : quoteLoading ? (
                        <p className="mt-4 font-sans text-xs text-[color:var(--sf-accent-text-45)]">
                          Finding courier options for your address…
                        </p>
                      ) : (
                        <p className="mt-4 font-sans text-xs text-[color:var(--sf-accent-text-45)]">
                          Enter street address and city to see delivery options.
                        </p>
                      )}
                    </div>
                  </section>
                </form>
              )}
            </div>

            <aside className="hidden h-fit bg-white p-6 shadow-sm lg:block">
              <h2 className="font-sans text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--sf-accent)]">
                Order summary
              </h2>
              <div className="mt-4">{summaryTotals}</div>
              <div className="mt-6">{renderPrimaryActions()}</div>
            </aside>
          </div>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-header-surface)] px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md lg:hidden">
          <div className="mb-2 flex items-center justify-between font-sans text-sm font-bold text-[color:var(--sf-accent)]">
            <span>Total</span>
            <span className="tabular-nums">
              {step === "checkout" && hasSubtotal
                ? formatMajorAmount(orderTotalMajor, currency)
                : (cart?.totalLabel ?? "—")}
            </span>
          </div>
          {renderPrimaryActions(true)}
        </div>

        <StorefrontCheckoutConfirmModal
          open={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onConfirm={() => void confirmReviewAndPay()}
          confirming={confirmingPay}
          title="Review & pay"
          description="Confirm your order total. You’ll complete payment securely on Paystack."
          confirmLabel="Confirm payment"
          lines={formatCheckoutModalLines(lines)}
          subtotalLabel={
            hasSubtotal
              ? formatMajorAmount(subtotalMajor, currency)
              : (cart?.subtotalLabel ?? "—")
          }
          shippingLabel={shippingSummaryLabel(
            selectedOption,
            shippingRequired,
            currency,
          )}
          totalLabel={
            hasSubtotal
              ? formatMajorAmount(orderTotalMajor, currency)
              : (cart?.totalLabel ?? "—")
          }
        />

        <StorefrontSiteFooter config={config} basePath={basePath} />
      </div>
    </StorefrontThemeRoot>
  );
}
