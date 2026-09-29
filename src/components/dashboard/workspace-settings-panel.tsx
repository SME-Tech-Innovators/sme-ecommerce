"use client";

import { useState } from "react";
import { DeliverySettingsPanel } from "@/components/dashboard/delivery-settings-panel";
import { PaymentsSettingsPanel } from "@/components/dashboard/payments-settings-panel";

type SettingsTab = "payments" | "delivery";

type WorkspaceSettingsPanelProps = {
  workspaceId: string;
};

const tabClass =
  "border-b-2 px-4 py-3 font-sans text-sm font-semibold transition-colors";

export function WorkspaceSettingsPanel({
  workspaceId,
}: WorkspaceSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("payments");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="tablist"
        aria-label="Workspace settings"
        className="flex shrink-0 gap-2 border-b border-primary-blue/10 bg-white px-5 sm:px-8"
      >
        <button
          type="button"
          role="tab"
          id="payments-settings-tab"
          aria-selected={activeTab === "payments"}
          aria-controls="payments-settings-panel"
          onClick={() => setActiveTab("payments")}
          className={`${tabClass} ${activeTab === "payments" ? "border-primary-blue text-primary-blue" : "border-transparent text-muted-foreground hover:text-primary-blue"}`}
        >
          Payments
        </button>
        <button
          type="button"
          role="tab"
          id="delivery-settings-tab"
          aria-selected={activeTab === "delivery"}
          aria-controls="delivery-settings-panel"
          onClick={() => setActiveTab("delivery")}
          className={`${tabClass} ${activeTab === "delivery" ? "border-primary-blue text-primary-blue" : "border-transparent text-muted-foreground hover:text-primary-blue"}`}
        >
          Delivery
        </button>
      </div>

      <div
        role="tabpanel"
        id={`${activeTab}-settings-panel`}
        aria-labelledby={`${activeTab}-settings-tab`}
        className="flex min-h-0 flex-1 flex-col"
      >
        {activeTab === "payments" ? (
          <PaymentsSettingsPanel workspaceId={workspaceId} />
        ) : (
          <DeliverySettingsPanel workspaceId={workspaceId} />
        )}
      </div>
    </div>
  );
}