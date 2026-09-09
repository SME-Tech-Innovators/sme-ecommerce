"use client";

import { useState } from "react";
import { PaymentsSettingsPanel } from "@/components/dashboard/payments-settings-panel";
import { WhatsAppSettingsPanel } from "@/components/dashboard/whatsapp-settings-panel";

type SettingsPanelProps = {
  workspaceId: string;
};

type SettingsTab = "payments" | "whatsapp";

export function SettingsPanel({ workspaceId }: SettingsPanelProps) {
  const [tab, setTab] = useState<SettingsTab>("payments");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-primary-blue/10 bg-white px-6 pt-4">
        <div
          className="inline-flex rounded-lg border border-primary-blue/15 bg-blue-gray/30 p-0.5"
          role="tablist"
          aria-label="Settings sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "payments"}
            onClick={() => setTab("payments")}
            className={`rounded-md px-4 py-2 font-sans text-sm font-semibold transition-colors ${
              tab === "payments"
                ? "bg-white text-primary-blue shadow-sm"
                : "text-primary-blue/60 hover:text-primary-blue"
            }`}
          >
            Payments
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "whatsapp"}
            onClick={() => setTab("whatsapp")}
            className={`rounded-md px-4 py-2 font-sans text-sm font-semibold transition-colors ${
              tab === "whatsapp"
                ? "bg-white text-primary-blue shadow-sm"
                : "text-primary-blue/60 hover:text-primary-blue"
            }`}
          >
            WhatsApp
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "payments" ? (
          <PaymentsSettingsPanel workspaceId={workspaceId} />
        ) : (
          <WhatsAppSettingsPanel workspaceId={workspaceId} />
        )}
      </div>
    </div>
  );
}
