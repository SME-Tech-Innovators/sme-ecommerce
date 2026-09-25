"use client";

import { normalizeEditorialSettings } from "@/lib/storefront-editorial";
import type { StorefrontEditorialSettings } from "@/types/storefront";

export function MaisonEditorialSettings({
  value,
  onChange,
}: {
  value?: StorefrontEditorialSettings;
  onChange: (value: StorefrontEditorialSettings) => void;
}) {
  const settings = normalizeEditorialSettings(value);
  const fieldClass =
    "mt-2 w-full rounded-md border border-primary-blue/20 bg-white p-2 text-sm";
  return (
    <fieldset className="space-y-4 rounded-lg border border-primary-blue/15 p-4">
      <legend className="px-2 text-sm font-semibold">Maison Editorial</legend>
      <label className="block text-sm">
        Edition caption
        <input
          className={fieldClass}
          maxLength={120}
          value={settings.editionLabel}
          onChange={(e) =>
            onChange({ ...settings, editionLabel: e.target.value })
          }
        />
      </label>
      <label className="block text-sm">
        Cover layout
        <select
          className={fieldClass}
          value={settings.heroLayout}
          onChange={(e) =>
            onChange({
              ...settings,
              heroLayout: e.target.value === "cover" ? "cover" : "split",
            })
          }
        >
          <option value="split">Split editorial</option>
          <option value="cover">Full image cover</option>
        </select>
      </label>
      <label className="block text-sm">
        Section spacing
        <select
          className={fieldClass}
          value={settings.spacing}
          onChange={(e) =>
            onChange({
              ...settings,
              spacing: e.target.value === "compact" ? "compact" : "airy",
            })
          }
        >
          <option value="airy">Generous</option>
          <option value="compact">Compact</option>
        </select>
      </label>
      <label className="block text-sm">
        Product photography
        <select
          className={fieldClass}
          value={settings.imageRatio}
          onChange={(e) =>
            onChange({
              ...settings,
              imageRatio: e.target.value === "square" ? "square" : "portrait",
            })
          }
        >
          <option value="portrait">Portrait</option>
          <option value="square">Square</option>
        </select>
      </label>
    </fieldset>
  );
}
