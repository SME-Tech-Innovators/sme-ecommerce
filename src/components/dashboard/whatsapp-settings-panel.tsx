"use client";

import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useDisconnectWhatsAppIntegration,
  useSyncWhatsAppCatalog,
  useUpdateWhatsAppIntegration,
  useWhatsAppIntegration,
} from "@/hooks/use-whatsapp-integration";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import type {
  WhatsAppIntegrationStatus,
  WhatsAppSyncStatus,
} from "@/types/whatsapp-integration";

type WhatsAppSettingsPanelProps = {
  workspaceId: string;
};

const fieldClass =
  "mt-1.5 w-full border border-primary-blue/15 bg-white px-3 py-2.5 font-sans text-sm text-primary-blue outline-none focus-visible:border-primary-blue/35 focus-visible:ring-2 focus-visible:ring-primary-blue/15";

const labelClass =
  "block font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-blue/60";

function statusLabel(status: WhatsAppIntegrationStatus): string {
  switch (status) {
    case "connected":
      return "Connected";
    case "error":
      return "Error";
    default:
      return "Not connected";
  }
}

function statusClass(status: WhatsAppIntegrationStatus): string {
  switch (status) {
    case "connected":
      return "bg-emerald-50 text-emerald-800 ring-emerald-700/15";
    case "error":
      return "bg-red-50 text-red-800 ring-red-700/15";
    default:
      return "bg-blue-gray/40 text-primary-blue/70 ring-primary-blue/10";
  }
}

function syncLabel(status: WhatsAppSyncStatus): string {
  switch (status) {
    case "running":
      return "Syncing…";
    case "success":
      return "Last sync succeeded";
    case "partial":
      return "Last sync partially failed";
    case "failed":
      return "Last sync failed";
    default:
      return "Not synced yet";
  }
}

export function WhatsAppSettingsPanel({
  workspaceId,
}: WhatsAppSettingsPanelProps) {
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [metaCatalogId, setMetaCatalogId] = useState("");
  const [metaWabaId, setMetaWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    setSignedIn(Boolean(getStoredAuthSession()?.accessToken));
    setAuthReady(true);
  }, []);

  const integrationQuery = useWhatsAppIntegration(workspaceId, signedIn);
  const saveMutation = useUpdateWhatsAppIntegration(workspaceId);
  const syncMutation = useSyncWhatsAppCatalog(workspaceId);
  const disconnectMutation = useDisconnectWhatsAppIntegration(workspaceId);

  useEffect(() => {
    const data = integrationQuery.data;
    if (!data) return;
    setMetaCatalogId(data.metaCatalogId ?? "");
    setMetaWabaId(data.metaWabaId ?? "");
  }, [integrationQuery.data]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!metaCatalogId.trim()) {
      toast.error("Catalog ID is required.");
      return;
    }
    const token = accessToken.trim();
    if (!integration?.hasAccessToken && !token) {
      toast.error("Access token is required for the first connection.");
      return;
    }
    if (!token) {
      toast.error("Enter a new access token to update the connection.");
      return;
    }
    try {
      await saveMutation.mutateAsync({
        metaCatalogId: metaCatalogId.trim(),
        metaWabaId: metaWabaId.trim() || undefined,
        accessToken: token,
      });
      setAccessToken("");
      toast.success("WhatsApp catalog connected.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save WhatsApp settings.",
      );
    }
  }

  async function handleSync() {
    try {
      const result = await syncMutation.mutateAsync();
      const { synced, skipped, failed } = result.lastSyncSummary;
      toast.success("Catalog sync finished", {
        description: `${synced} synced, ${skipped} skipped, ${failed} failed.`,
      });
      if (result.errors.length) {
        console.warn("WhatsApp sync errors", result.errors);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Catalog sync failed.",
      );
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectMutation.mutateAsync();
      setAccessToken("");
      toast.message("WhatsApp disconnected.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not disconnect.",
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
        Sign in to connect Meta WhatsApp catalog.
      </p>
    );
  }

  const integration = integrationQuery.data;
  const isConnected = integration?.status === "connected";

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-light text-primary-blue">
          WhatsApp catalog (Meta)
        </h2>
        <p className="font-sans text-sm leading-relaxed text-muted-foreground">
          Connect your Meta Commerce catalog so active products appear in the
          official WhatsApp Business catalog. Requires a system user token with{" "}
          <code className="text-xs">catalog_management</code>.
        </p>
        {integration ? (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 font-sans text-xs font-semibold ring-1 ring-inset ${statusClass(integration.status)}`}
          >
            {statusLabel(integration.status)}
          </span>
        ) : null}
      </section>

      <form onSubmit={handleSave} className="space-y-5 rounded-xl border border-primary-blue/10 bg-white p-5">
        <div>
          <label htmlFor="wa-catalog-id" className={labelClass}>
            Meta catalog ID
          </label>
          <input
            id="wa-catalog-id"
            className={fieldClass}
            value={metaCatalogId}
            onChange={(e) => setMetaCatalogId(e.target.value)}
            placeholder="123456789012345"
            required
          />
        </div>
        <div>
          <label htmlFor="wa-waba-id" className={labelClass}>
            WhatsApp Business account ID (optional)
          </label>
          <input
            id="wa-waba-id"
            className={fieldClass}
            value={metaWabaId}
            onChange={(e) => setMetaWabaId(e.target.value)}
            placeholder="987654321098765"
          />
        </div>
        <div>
          <label htmlFor="wa-access-token" className={labelClass}>
            System user access token
          </label>
          <input
            id="wa-access-token"
            type="password"
            autoComplete="off"
            className={fieldClass}
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder={
              integration?.hasAccessToken
                ? "Leave blank to keep current token"
                : "EAAG..."
            }
          />
          <p className="mt-1.5 font-sans text-xs text-muted-foreground">
            Create in Meta Business Settings → System users. Token is stored
            encrypted on the server and never shown again.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="bg-primary-blue px-4 py-2.5 font-sans text-sm font-semibold text-white hover:bg-primary-blue/90 disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving…" : "Save connection"}
          </button>
          {isConnected ? (
            <button
              type="button"
              disabled={disconnectMutation.isPending}
              onClick={() => void handleDisconnect()}
              className="border border-primary-blue/20 px-4 py-2.5 font-sans text-sm font-semibold text-primary-blue hover:bg-blue-gray/30 disabled:opacity-50"
            >
              Disconnect
            </button>
          ) : null}
        </div>
      </form>

      <section className="space-y-4 rounded-xl border border-primary-blue/10 bg-white p-5">
        <div>
          <h3 className="font-sans text-sm font-semibold text-primary-blue">
            Sync catalog
          </h3>
          <p className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground">
            Pushes all <strong>active</strong> products with HTTPS images to
            Meta. Draft and archived products are removed from the catalog.
          </p>
        </div>
        {integration ? (
          <p className="font-sans text-xs text-muted-foreground">
            {syncLabel(integration.lastSyncStatus)}
            {integration.lastSyncSummary
              ? ` — ${integration.lastSyncSummary.synced} synced, ${integration.lastSyncSummary.skipped} skipped, ${integration.lastSyncSummary.failed} failed`
              : null}
            {integration.lastSyncAt
              ? ` (${new Date(integration.lastSyncAt).toLocaleString()})`
              : null}
          </p>
        ) : null}
        {integration?.lastError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 font-sans text-xs text-red-800">
            {integration.lastError}
          </p>
        ) : null}
        <button
          type="button"
          disabled={!isConnected || syncMutation.isPending}
          onClick={() => void handleSync()}
          className="bg-primary-blue px-4 py-2.5 font-sans text-sm font-semibold text-white hover:bg-primary-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncMutation.isPending ? "Syncing…" : "Sync now"}
        </button>
      </section>

      <section className="rounded-xl border border-primary-blue/10 bg-blue-gray/20 p-5">
        <h3 className="font-sans text-sm font-semibold text-primary-blue">
          Meta setup checklist
        </h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 font-sans text-xs leading-relaxed text-muted-foreground">
          <li>Create a catalog in Commerce Manager.</li>
          <li>Link the catalog to your WhatsApp Business number.</li>
          <li>Create a system user + long-lived token with catalog access.</li>
          <li>Publish products here with public HTTPS images.</li>
          <li>Save connection above, then run Sync now.</li>
        </ol>
        <p className="mt-3 font-sans text-xs text-muted-foreground">
          Backend spec:{" "}
          <code className="text-[11px]">
            docs/storefront-backend-step-13-meta-whatsapp-catalog.md
          </code>
        </p>
      </section>
    </div>
  );
}
