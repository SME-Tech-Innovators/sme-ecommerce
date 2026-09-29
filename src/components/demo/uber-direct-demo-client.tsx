"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DeliverySettingsPanel } from "@/components/dashboard/delivery-settings-panel";
import { DeliveryTracking } from "@/components/storefront/delivery-tracking";
import type { UberDirectDelivery } from "@/types/delivery";

type DemoMethod = "pickup" | "uber-direct";

const quote = {
  quoteId: "demo_quote_4f29",
  providerName: "Uber Direct",
  fee: 49.99,
  currency: "ZAR",
  estimatedDeliveryTime: "12–35 min",
  expiresAt: "2099-12-31T23:59:59.000Z",
  available: true,
  unavailableReason: null,
};

const DEMO_TRACKING_URL = "https://example.com/demo-uber-tracking";

const initialDelivery: UberDirectDelivery = {
  id: "demo_delivery_6a10",
  status: "pending",
  trackingUrl: DEMO_TRACKING_URL,
  courier: { name: "Jordan D.", phone: "+27 82 123 4567" },
  pickupEta: 12,
  dropoffEta: 35,
};

const fieldClass =
  "mt-1.5 w-full border border-primary-blue/15 bg-white px-3 py-2.5 font-sans text-sm text-primary-blue outline-none focus-visible:border-primary-blue/35 focus-visible:ring-2 focus-visible:ring-primary-blue/15";

const labelClass =
  "block font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-blue/60";

export function UberDirectDemoClient() {
  const [address, setAddress] = useState({
    line1: "45 Long Street",
    line2: "",
    city: "Cape Town",
    province: "Western Cape",
    postalCode: "8001",
    country: "ZA",
  });
  const [quoteRequested, setQuoteRequested] = useState(true);
  const [demoUberAvailable, setDemoUberAvailable] = useState(true);
  const [method, setMethod] = useState<DemoMethod>("uber-direct");
  const [orderPaid, setOrderPaid] = useState(false);
  const [delivery, setDelivery] = useState<UberDirectDelivery | null>(null);

  function requestQuote() {
    setQuoteRequested(true);
    setMethod("uber-direct");
    toast.message("Demo quote refreshed", {
      description: "This simulated quote was not requested from a backend.",
    });
  }

  function bookDemoDelivery() {
    if (!quoteRequested || !orderPaid || method !== "uber-direct") return;
    setDelivery(initialDelivery);
    toast.success("Demo courier booked", {
      description: "No booking request was sent to Uber or the SME backend.",
    });
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-primary-blue/10 pb-5">
          <div>
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-primary-blue/55">
              SME Operations · Frontend preview
            </p>
            <h1 className="mt-2 font-serif text-3xl font-light text-primary-blue">
              Uber Direct setup
            </h1>
          </div>
          <span className="border border-amber-700/20 bg-amber-50 px-3 py-2 font-sans text-xs font-semibold text-amber-900">
            Demo only · No backend calls
          </span>
        </header>

        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl font-light text-primary-blue">
              Merchant settings
            </h2>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              Edit the pickup profile and toggle availability. Changes reset when this page reloads.
            </p>
          </div>
          <div className="border border-primary-blue/10 bg-white">
            <DeliverySettingsPanel
              workspaceId="demo-workspace"
              demoMode
              onDemoSettingsChange={(settings) => {
                setDemoUberAvailable(settings.uberDirectAvailable);
                if (!settings.uberDirectAvailable) setMethod("pickup");
              }}
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
          <div className="space-y-5 border border-primary-blue/10 bg-white p-5 sm:p-6">
            <div>
              <h2 className="font-serif text-2xl font-light text-primary-blue">
                Customer checkout
              </h2>
              <p className="mt-1 font-sans text-sm text-muted-foreground">
                Sample delivery address · Demo cart total R450.00
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={`${labelClass} sm:col-span-2`}>
                Address Line 1
                <input
                  value={address.line1}
                  onChange={(event) =>
                    setAddress({ ...address, line1: event.target.value })
                  }
                  className={fieldClass}
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Address Line 2
                <input
                  value={address.line2}
                  onChange={(event) =>
                    setAddress({ ...address, line2: event.target.value })
                  }
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                City
                <input
                  value={address.city}
                  onChange={(event) =>
                    setAddress({ ...address, city: event.target.value })
                  }
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                Province
                <input
                  value={address.province}
                  onChange={(event) =>
                    setAddress({ ...address, province: event.target.value })
                  }
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                Postal Code
                <input
                  value={address.postalCode}
                  onChange={(event) =>
                    setAddress({ ...address, postalCode: event.target.value })
                  }
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                Country
                <input
                  value={address.country}
                  onChange={(event) =>
                    setAddress({ ...address, country: event.target.value })
                  }
                  className={fieldClass}
                />
              </label>
            </div>

            <div className="border-t border-primary-blue/10 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-sans text-sm font-bold text-primary-blue">
                  Delivery Options
                </h3>
                <button
                  type="button"
                  onClick={requestQuote}
                  className="border border-primary-blue/20 px-3 py-2 font-sans text-xs font-semibold text-primary-blue hover:bg-blue-gray/30"
                >
                  Refresh demo quote
                </button>
              </div>
              {quoteRequested && demoUberAvailable ? (
                <fieldset className="mt-4 space-y-3">
                  <legend className="sr-only">Choose delivery method</legend>
                  <label className="flex items-start gap-3 border border-primary-blue/15 p-4 has-[:checked]:border-primary-blue has-[:checked]:bg-blue-gray/20">
                    <input
                      type="radio"
                      name="demo-delivery-method"
                      checked={method === "uber-direct"}
                      onChange={() => setMethod("uber-direct")}
                      className="mt-1 accent-primary-blue"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap justify-between gap-2 font-sans text-sm font-semibold text-primary-blue">
                        <span>{quote.providerName}</span>
                        <span>R{quote.fee.toFixed(2)}</span>
                      </span>
                      <span className="mt-1 block font-sans text-xs text-muted-foreground">
                        {quote.estimatedDeliveryTime} · Quote {quote.quoteId}
                      </span>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 border border-primary-blue/15 p-4 has-[:checked]:border-primary-blue has-[:checked]:bg-blue-gray/20">
                    <input
                      type="radio"
                      name="demo-delivery-method"
                      checked={method === "pickup"}
                      onChange={() => setMethod("pickup")}
                      className="accent-primary-blue"
                    />
                    <span className="font-sans text-sm font-semibold text-primary-blue">
                      Store pickup · Free
                    </span>
                  </label>
                </fieldset>
              ) : !demoUberAvailable ? (
                <p className="mt-4 font-sans text-sm text-muted-foreground">
                  Uber Direct is disabled in the demo settings. Store pickup remains available.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3 border-t border-primary-blue/10 pt-5">
              <button
                type="button"
                aria-pressed={orderPaid}
                onClick={() => setOrderPaid((paid) => !paid)}
                className="border border-primary-blue/20 px-4 py-2.5 font-sans text-sm font-semibold text-primary-blue hover:bg-blue-gray/30"
              >
                {orderPaid ? "Reset demo payment" : "Simulate payment"}
              </button>
              <button
                type="button"
                disabled={!orderPaid || method !== "uber-direct" || Boolean(delivery)}
                onClick={bookDemoDelivery}
                className="bg-primary-blue px-4 py-2.5 font-sans text-sm font-semibold text-white hover:bg-primary-blue/90 disabled:opacity-50"
              >
                {delivery ? "Demo courier booked" : "Simulate courier booking"}
              </button>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="border border-primary-blue/10 bg-white p-5">
              <h2 className="font-serif text-xl font-light text-primary-blue">
                Order preview
              </h2>
              <dl className="mt-4 space-y-2 font-sans text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Delivery method</dt>
                  <dd className="font-medium text-primary-blue">
                    {method === "uber-direct" ? "Uber Direct" : "Store pickup"}
                  </dd>
                </div>
                {method === "uber-direct" ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Quote ID</dt>
                    <dd className="font-mono text-xs text-primary-blue">
                      {quote.quoteId}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3 border-t border-primary-blue/10 pt-2 font-semibold">
                  <dt>Total</dt>
                  <dd>{method === "uber-direct" ? "R499.99" : "R450.00"}</dd>
                </div>
              </dl>
              <p className="mt-4 border-t border-primary-blue/10 pt-3 font-sans text-xs text-muted-foreground">
                {address.line1}, {address.city}, {address.country}
              </p>
            </div>

            {delivery ? (
              <DeliveryTracking
                delivery={delivery}
                variant="dashboard"
                feeLabel={`R${quote.fee.toFixed(2)}`}
                estimatedDeliveryTime={quote.estimatedDeliveryTime}
              />
            ) : (
              <div className="border border-dashed border-primary-blue/20 p-5 font-sans text-sm text-muted-foreground">
                Book the simulated courier to preview status, courier details, and tracking.
              </div>
            )}

            {delivery ? (
              <label className={labelClass}>
                Simulate delivery status
                <select
                  value={delivery.status}
                  onChange={(event) =>
                    setDelivery((current) =>
                      current ? { ...current, status: event.target.value } : current,
                    )
                  }
                  className={fieldClass}
                >
                  {[
                    "pending",
                    "pickup",
                    "pickup_complete",
                    "dropoff",
                    "delivered",
                    "cancelled",
                    "returned",
                  ].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  );
}