"use client";

import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useShippingSettings,
  useUpdateShippingSettings,
} from "@/hooks/use-shipping-settings";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import { formatMinorAmount } from "@/lib/format-money";
import type { ShippingAddress } from "@/types/shipping";

type ShippingSettingsPanelProps = {
  workspaceId: string;
};

const fieldClass =
  "mt-1.5 w-full border border-primary-blue/15 bg-white px-3 py-2.5 font-sans text-sm text-primary-blue outline-none focus-visible:border-primary-blue/35 focus-visible:ring-2 focus-visible:ring-primary-blue/15";

const labelClass =
  "block font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-blue/60";

export function ShippingSettingsPanel({
  workspaceId,
}: ShippingSettingsPanelProps) {
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [allowPickup, setAllowPickup] = useState(true);
  const [pickupLabel, setPickupLabel] = useState("Collect in store");
  const [flatRateMajor, setFlatRateMajor] = useState("");
  const [collection, setCollection] = useState<ShippingAddress>({
    line1: "",
    city: "",
    province: "",
    postalCode: "",
    country: "ZA",
  });

  useEffect(() => {
    setSignedIn(Boolean(getStoredAuthSession()?.accessToken));
    setAuthReady(true);
  }, []);

  const settingsQuery = useShippingSettings(workspaceId, signedIn);
  const saveMutation = useUpdateShippingSettings(workspaceId);

  useEffect(() => {
    const data = settingsQuery.data;
    if (!data) return;
    setEnabled(data.enabled);
    setAllowPickup(data.allowPickup);
    setPickupLabel(data.pickupLabel ?? "Collect in store");
    setFlatRateMajor(
      data.fallbackFlatRateAmount != null
        ? String(data.fallbackFlatRateAmount / 100)
        : "",
    );
    if (data.collectionAddress) {
      setCollection({
        line1: data.collectionAddress.line1,
        line2: data.collectionAddress.line2,
        city: data.collectionAddress.city,
        province: data.collectionAddress.province ?? "",
        postalCode: data.collectionAddress.postalCode ?? "",
        country: data.collectionAddress.country || "ZA",
      });
    }
  }, [settingsQuery.data]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const flat = flatRateMajor.trim();
    try {
      await saveMutation.mutateAsync({
        provider: "bobgo",
        enabled,
        allowPickup,
        pickupLabel: pickupLabel.trim() || undefined,
        fallbackFlatRateCurrency: "ZAR",
        ...(flat ? { fallbackFlatRateAmount: Number.parseFloat(flat) } : {}),
        collectionAddress: {
          line1: collection.line1.trim(),
          ...(collection.line2?.trim()
            ? { line2: collection.line2.trim() }
            : {}),
          city: collection.city.trim(),
          province: collection.province?.trim() || undefined,
          postalCode: collection.postalCode?.trim() || undefined,
          country: collection.country.trim() || "ZA",
        },
      });
      toast.success("Shipping settings saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save settings.",
      );
    }
  }

  if (!authReady) {
    return (
      <p className="px-6 py-10 font-sans text-sm text-muted-foreground">
        Loading…
      </p>
    );
  }

  if (!signedIn) {
    return (
      <p className="px-6 py-10 font-sans text-sm text-muted-foreground">
        Sign in to configure Bob Go delivery.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
      <section className="space-y-2">
        <h2 className="font-serif text-2xl font-light text-primary-blue">
          Delivery (Bob Go)
        </h2>
        <p className="font-sans text-sm leading-relaxed text-muted-foreground">
          Enable live shipping quotes at checkout and automatic shipment creation
          after Paystack payment. Use your Bob Go sandbox account on the backend.
        </p>
      </section>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-5 rounded-xl border border-primary-blue/10 bg-white p-5"
      >
        <label className="flex items-center gap-3 font-sans text-sm text-primary-blue">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          Enable shipping at checkout
        </label>

        <div>
          <p className={labelClass}>Collection address (warehouse)</p>
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            Required for Bob Go live rates. Parcels are collected from this address.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>
              Line 1
              <input
                className={fieldClass}
                value={collection.line1}
                onChange={(e) =>
                  setCollection((c) => ({ ...c, line1: e.target.value }))
                }
              />
            </label>
            <label className={labelClass}>
              City
              <input
                className={fieldClass}
                value={collection.city}
                onChange={(e) =>
                  setCollection((c) => ({ ...c, city: e.target.value }))
                }
              />
            </label>
            <label className={labelClass}>
              Province
              <input
                className={fieldClass}
                value={collection.province ?? ""}
                onChange={(e) =>
                  setCollection((c) => ({ ...c, province: e.target.value }))
                }
              />
            </label>
            <label className={labelClass}>
              Postal code
              <input
                className={fieldClass}
                value={collection.postalCode ?? ""}
                onChange={(e) =>
                  setCollection((c) => ({ ...c, postalCode: e.target.value }))
                }
              />
            </label>
            <label className={labelClass}>
              Country
              <input
                className={fieldClass}
                value={collection.country}
                onChange={(e) =>
                  setCollection((c) => ({ ...c, country: e.target.value }))
                }
              />
            </label>
          </div>
        </div>

        <label className={labelClass}>
          Fallback flat rate (ZAR, optional)
          <input
            className={fieldClass}
            inputMode="decimal"
            placeholder="99.00"
            value={flatRateMajor}
            onChange={(e) => setFlatRateMajor(e.target.value)}
          />
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            Shown when Bob Go rates fail or as a manual option alongside courier
            quotes.
          </p>
        </label>

        <label className="flex items-center gap-3 font-sans text-sm text-primary-blue">
          <input
            type="checkbox"
            checked={allowPickup}
            onChange={(e) => setAllowPickup(e.target.checked)}
            className="h-4 w-4"
          />
          Allow store pickup
        </label>

        {allowPickup ? (
          <label className={labelClass}>
            Pickup label
            <input
              className={fieldClass}
              value={pickupLabel}
              onChange={(e) => setPickupLabel(e.target.value)}
            />
          </label>
        ) : null}

        {settingsQuery.data?.fallbackFlatRateAmount != null ? (
          <p className="font-sans text-xs text-muted-foreground">
            Current flat rate on quote:{" "}
            {formatMinorAmount(
              settingsQuery.data.fallbackFlatRateAmount,
              settingsQuery.data.fallbackFlatRateCurrency,
            )}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="bg-primary-blue px-4 py-2.5 font-sans text-sm font-semibold text-white hover:bg-primary-blue/90 disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving…" : "Save shipping settings"}
        </button>
      </form>
    </div>
  );
}
