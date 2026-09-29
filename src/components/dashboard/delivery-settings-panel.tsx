"use client";

import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useDeliverySettings,
  useUpdateDeliverySettings,
} from "@/hooks/use-delivery-settings";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import type {
  DeliverySettings,
  UpdateDeliverySettingsBody,
} from "@/types/delivery";

type DeliverySettingsPanelProps = {
  workspaceId: string;
};

const fieldClass =
  "mt-1.5 w-full border border-primary-blue/15 bg-white px-3 py-2.5 font-sans text-sm text-primary-blue outline-none focus-visible:border-primary-blue/35 focus-visible:ring-2 focus-visible:ring-primary-blue/15";

const labelClass =
  "block font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-blue/60";

function settingsToForm(data: DeliverySettings): UpdateDeliverySettingsBody {
  return {
    uberDirectEnabled: data.uberDirectEnabled,
    pickupAddressLine1: data.pickupAddressLine1 ?? "",
    pickupAddressLine2: data.pickupAddressLine2 ?? "",
    pickupCity: data.pickupCity ?? "",
    pickupProvince: data.pickupProvince ?? "",
    pickupPostalCode: data.pickupPostalCode ?? "",
    pickupCountry: data.pickupCountry ?? "ZA",
    pickupLatitude: data.pickupLatitude ?? null,
    pickupLongitude: data.pickupLongitude ?? null,
    pickupContactName: data.pickupContactName ?? "",
    pickupContactPhone: data.pickupContactPhone ?? "",
  };
}

function statusClass(active: boolean): string {
  return active
    ? "bg-emerald-50 text-emerald-800 ring-emerald-700/15"
    : "bg-blue-gray/40 text-primary-blue/70 ring-primary-blue/10";
}

export function DeliverySettingsPanel({
  workspaceId,
}: DeliverySettingsPanelProps) {
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [form, setForm] = useState<UpdateDeliverySettingsBody>({
    uberDirectEnabled: false,
    pickupAddressLine1: "",
    pickupAddressLine2: "",
    pickupCity: "",
    pickupProvince: "",
    pickupPostalCode: "",
    pickupCountry: "ZA",
    pickupLatitude: null,
    pickupLongitude: null,
    pickupContactName: "",
    pickupContactPhone: "",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSignedIn(Boolean(getStoredAuthSession()?.accessToken));
      setAuthReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const settingsQuery = useDeliverySettings(workspaceId, signedIn);
  const saveMutation = useUpdateDeliverySettings(workspaceId);

  useEffect(() => {
    if (!settingsQuery.data) return;
    const nextForm = settingsToForm(settingsQuery.data);
    const timer = window.setTimeout(() => setForm(nextForm), 0);
    return () => window.clearTimeout(timer);
  }, [settingsQuery.data]);

  const isActive = settingsQuery.data?.uberDirectAvailable === true;

  function updateField<K extends keyof UpdateDeliverySettingsBody>(
    key: K,
    value: UpdateDeliverySettingsBody[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key.startsWith("pickupAddress") ||
      key === "pickupCity" ||
      key === "pickupProvince" ||
      key === "pickupPostalCode" ||
      key === "pickupCountry"
        ? { pickupLatitude: null, pickupLongitude: null }
        : {}),
    }));
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saveMutation.isPending) return;

    try {
      await saveMutation.mutateAsync({
        ...form,
        pickupAddressLine1: form.pickupAddressLine1.trim(),
        pickupAddressLine2: form.pickupAddressLine2?.trim() ?? "",
        pickupCity: form.pickupCity.trim(),
        pickupProvince: form.pickupProvince.trim(),
        pickupPostalCode: form.pickupPostalCode.trim(),
        pickupCountry: form.pickupCountry.trim().toUpperCase(),
        pickupContactName: form.pickupContactName.trim(),
        pickupContactPhone: form.pickupContactPhone.trim(),
      });
      toast.success("Delivery settings saved");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save delivery settings.",
      );
    }
  }

  if (!authReady || (signedIn && settingsQuery.isLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 font-sans text-sm text-muted-foreground">
        Loading delivery settings…
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <h2 className="font-serif text-2xl font-light text-primary-blue">
          Sign in required
        </h2>
        <p className="max-w-md font-sans text-sm text-muted-foreground">
          Sign in to manage Uber Direct pickup and delivery settings.
        </p>
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <h2 className="font-serif text-2xl font-light text-primary-blue">
          Could not load delivery settings
        </h2>
        <p className="max-w-md font-sans text-sm text-muted-foreground">
          {settingsQuery.error instanceof Error
            ? settingsQuery.error.message
            : "Try again in a moment."}
        </p>
        <button
          type="button"
          onClick={() => void settingsQuery.refetch()}
          className="border border-primary-blue/20 bg-white px-4 py-2.5 font-sans text-sm font-semibold text-primary-blue transition-colors hover:bg-blue-gray/40"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-light text-primary-blue">
              Uber Direct
            </h2>
          </div>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-wide ring-1 ${statusClass(isActive)}`}
            aria-live="polite"
          >
            Status: {isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <form
          onSubmit={(event) => void onSave(event)}
          className="space-y-5 border border-primary-blue/10 bg-white p-5 shadow-sm"
        >
          <section className="space-y-4">
            <h3 className="font-sans text-sm font-bold text-primary-blue">
              Delivery availability
            </h3>
            <label className="flex items-center gap-3 font-sans text-sm font-medium text-primary-blue">
              <Checkbox
                checked={form.uberDirectEnabled}
                onCheckedChange={(checked) =>
                  updateField("uberDirectEnabled", checked === true)
                }
                aria-label="Enable Uber Direct"
              />
              Enable Uber Direct
            </label>
          </section>

          <section className="space-y-4 border-t border-primary-blue/10 pt-5">
            <h3 className="font-sans text-sm font-bold text-primary-blue">
              Pickup Address
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={`${labelClass} sm:col-span-2`}>
                Address Line 1
                <input
                  required
                  autoComplete="address-line1"
                  value={form.pickupAddressLine1}
                  onChange={(event) =>
                    updateField("pickupAddressLine1", event.target.value)
                  }
                  className={fieldClass}
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Address Line 2
                <input
                  autoComplete="address-line2"
                  value={form.pickupAddressLine2 ?? ""}
                  onChange={(event) =>
                    updateField("pickupAddressLine2", event.target.value)
                  }
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                City
                <input
                  required
                  autoComplete="address-level2"
                  value={form.pickupCity}
                  onChange={(event) =>
                    updateField("pickupCity", event.target.value)
                  }
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                Province
                <input
                  autoComplete="address-level1"
                  value={form.pickupProvince}
                  onChange={(event) =>
                    updateField("pickupProvince", event.target.value)
                  }
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                Postal Code
                <input
                  autoComplete="postal-code"
                  value={form.pickupPostalCode}
                  onChange={(event) =>
                    updateField("pickupPostalCode", event.target.value)
                  }
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                Country
                <input
                  required
                  autoComplete="country"
                  value={form.pickupCountry}
                  onChange={(event) =>
                    updateField("pickupCountry", event.target.value)
                  }
                  className={fieldClass}
                />
              </label>
            </div>
          </section>

          <section className="space-y-4 border-t border-primary-blue/10 pt-5">
            <h3 className="font-sans text-sm font-bold text-primary-blue">
              Pickup Contact
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Name
                <input
                  autoComplete="name"
                  value={form.pickupContactName}
                  onChange={(event) =>
                    updateField("pickupContactName", event.target.value)
                  }
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                Phone
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.pickupContactPhone}
                  onChange={(event) =>
                    updateField("pickupContactPhone", event.target.value)
                  }
                  className={fieldClass}
                />
              </label>
            </div>
          </section>

          <div className="border-t border-primary-blue/10 pt-4">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-primary-blue px-4 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-primary-blue/90 disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving…" : "Save Delivery Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}