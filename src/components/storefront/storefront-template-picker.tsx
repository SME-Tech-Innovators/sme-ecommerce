"use client";

import { useId, useState } from "react";
import { Modal } from "@modals";
import { StorefrontTemplateView } from "@/components/storefront/storefront-template-view";
import {
  useStorefrontTemplates,
  useTemplatePreviewConfig,
} from "@/hooks/use-storefront-templates";
import type { StorefrontTemplateListItem } from "@/types/storefront-template-api";

type StorefrontTemplatePickerProps = {
  workspaceId?: string;
  /** Template already applied to this workspace — choose button is disabled. */
  activeTemplateId?: string | null;
  /** When re-opening from the editor, show a stronger reset warning. */
  replacingExisting?: boolean;
  isApplying: boolean;
  onCancel?: () => void;
  onApply: (template: {
    templateId: string;
    templateVersion: number;
  }) => void | Promise<void>;
};

export function StorefrontTemplatePicker({
  workspaceId,
  activeTemplateId = null,
  replacingExisting = false,
  isApplying,
  onCancel,
  onApply,
}: StorefrontTemplatePickerProps) {
  const templatesQuery = useStorefrontTemplates();
  const templates = templatesQuery.data ?? [];
  const [previewEntry, setPreviewEntry] =
    useState<StorefrontTemplateListItem | null>(null);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">(
    "desktop",
  );

  const previewConfigQuery = useTemplatePreviewConfig(
    previewEntry,
    Boolean(previewEntry),
  );

  const previewTitleId = useId();
  const previewIsActive =
    Boolean(previewEntry) && previewEntry?.id === activeTemplateId;

  function openPreview(entry: StorefrontTemplateListItem) {
    setPreviewViewport("desktop");
    setPreviewEntry(entry);
  }

  if (templatesQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 font-sans text-sm text-muted-foreground">
        Loading templates…
      </div>
    );
  }

  if (templatesQuery.isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <p className="font-sans text-sm text-red-700">
          {templatesQuery.error instanceof Error
            ? templatesQuery.error.message
            : "Could not load templates."}
        </p>
        <button
          type="button"
          onClick={() => void templatesQuery.refetch()}
          className="font-sans text-sm font-semibold text-primary-blue underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-blue-gray/20">
      <header className="w-full shrink-0 border-b border-primary-blue/10 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-blue/55">
              Templates
            </p>
            <h1 className="mt-2 font-serif text-3xl font-light tracking-tight text-primary-blue sm:text-4xl">
              Choose a template
            </h1>
            <p className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
              Preview layouts here. If you already selected a template, its
              choose button stays disabled so you do not overwrite your store.
            </p>
          </div>
          {replacingExisting && onCancel ? (
            <button
              type="button"
              disabled={isApplying}
              onClick={onCancel}
              className="px-4 py-2.5 font-sans text-sm font-medium text-primary-blue underline decoration-primary-blue/30 underline-offset-4 disabled:opacity-50"
            >
              Back to editor
            </button>
          ) : null}
        </div>
        {replacingExisting ? (
          <p className="mt-4 rounded-lg border border-amber-600/20 bg-amber-50 px-3 py-2 font-sans text-xs leading-relaxed text-amber-950">
            Choosing a different template resets your current draft layout.
            Published storefronts stay as-is until you publish again. Your
            products are kept.
          </p>
        ) : null}
      </header>

      <div className="flex w-full flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <ul className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((entry) => {
            const isCurrent = entry.id === activeTemplateId;
            return (
              <li key={entry.id} className="min-w-0">
                <TemplateCard
                  entry={entry}
                  workspaceId={workspaceId}
                  isCurrent={isCurrent}
                  disabled={isApplying}
                  isApplying={isApplying}
                  onPreview={() => openPreview(entry)}
                  onContinue={() =>
                    void onApply({
                      templateId: entry.id,
                      templateVersion: entry.latestVersion,
                    })
                  }
                />
              </li>
            );
          })}
        </ul>

        {templates.length === 0 ? (
          <p className="mt-8 text-center font-sans text-sm text-muted-foreground">
            No templates available yet.
          </p>
        ) : null}
      </div>

      <Modal
        open={Boolean(previewEntry)}
        onClose={() => setPreviewEntry(null)}
        labelledBy={previewTitleId}
        className="p-2 sm:p-4"
        panelClassName="!max-w-[min(100vw-1rem,96rem)] flex h-[min(100dvh-1rem,58rem)] w-full flex-col overflow-hidden !px-4 !py-4 sm:!px-6 sm:!py-5"
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-primary-blue/10 pb-4">
          <div className="min-w-0">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-blue/55">
              Template preview
            </p>
            <h2
              id={previewTitleId}
              className="mt-1 truncate font-serif text-2xl font-light text-primary-blue sm:text-3xl"
            >
              {previewEntry?.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex rounded-lg border border-primary-blue/15 bg-blue-gray/30 p-0.5"
              role="group"
              aria-label="Preview viewport"
            >
              <button
                type="button"
                aria-pressed={previewViewport === "desktop"}
                onClick={() => setPreviewViewport("desktop")}
                className={`rounded-md px-3 py-1.5 font-sans text-xs font-semibold transition-colors ${
                  previewViewport === "desktop"
                    ? "bg-white text-primary-blue shadow-sm"
                    : "text-primary-blue/60 hover:text-primary-blue"
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                aria-pressed={previewViewport === "mobile"}
                onClick={() => setPreviewViewport("mobile")}
                className={`rounded-md px-3 py-1.5 font-sans text-xs font-semibold transition-colors ${
                  previewViewport === "mobile"
                    ? "bg-white text-primary-blue shadow-sm"
                    : "text-primary-blue/60 hover:text-primary-blue"
                }`}
              >
                Mobile
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPreviewEntry(null)}
              className="px-2 py-1.5 font-sans text-sm font-medium text-primary-blue underline decoration-primary-blue/30 underline-offset-4"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 items-stretch justify-center overflow-hidden rounded-xl border border-primary-blue/10 bg-blue-gray/40 p-3 sm:p-4">
          <div
            className={`min-h-0 overflow-y-auto overscroll-contain bg-white shadow-lg transition-[width] duration-300 ${
              previewViewport === "mobile"
                ? "mx-auto w-full max-w-[390px] rounded-[1.5rem] border border-primary-blue/15 ring-4 ring-primary-blue/5"
                : "w-full rounded-lg"
            }`}
          >
            {previewConfigQuery.isLoading ? (
              <div className="flex min-h-[20rem] items-center justify-center p-8 font-sans text-sm text-muted-foreground">
                Loading preview…
              </div>
            ) : previewConfigQuery.data ? (
              <div className="pointer-events-none">
                <StorefrontTemplateView
                  config={previewConfigQuery.data}
                  workspaceId={workspaceId}
                  forceViewport={previewViewport}
                />
              </div>
            ) : previewConfigQuery.isError ? (
              <div className="flex min-h-[20rem] flex-col items-center justify-center gap-2 p-8 text-center font-sans text-sm text-red-700">
                <p>
                  {previewConfigQuery.error instanceof Error
                    ? previewConfigQuery.error.message
                    : "Preview could not be loaded."}
                </p>
                <button
                  type="button"
                  onClick={() => void previewConfigQuery.refetch()}
                  className="font-semibold text-primary-blue underline"
                >
                  Retry
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-primary-blue/10 pt-4">
          <button
            type="button"
            disabled={!previewEntry || isApplying || previewIsActive}
            onClick={() => {
              if (!previewEntry || previewIsActive) return;
              const entry = previewEntry;
              setPreviewEntry(null);
              void onApply({
                templateId: entry.id,
                templateVersion: entry.latestVersion,
              });
            }}
            className="bg-primary-blue px-5 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-primary-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {previewIsActive
              ? "Current template"
              : isApplying
                ? "Opening…"
                : "Continue with this template"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function TemplateCard({
  entry,
  workspaceId,
  isCurrent,
  disabled,
  isApplying,
  onPreview,
  onContinue,
}: {
  entry: StorefrontTemplateListItem;
  workspaceId?: string;
  isCurrent: boolean;
  disabled: boolean;
  isApplying: boolean;
  onPreview: () => void;
  onContinue: () => void;
}) {
  const previewConfigQuery = useTemplatePreviewConfig(entry);

  return (
    <article
      className={`flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm ${
        isCurrent
          ? "border-primary-blue ring-2 ring-primary-blue/20"
          : "border-primary-blue/10"
      }`}
    >
      <div className="relative h-56 w-full shrink-0 overflow-hidden bg-blue-gray/30 sm:h-64">
        {previewConfigQuery.data ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="origin-top-left"
              style={{
                width: "250%",
                transform: "scale(0.4)",
              }}
            >
              <StorefrontTemplateView
                config={previewConfigQuery.data}
                workspaceId={workspaceId}
              />
            </div>
          </div>
        ) : previewConfigQuery.isLoading ? (
          <div className="flex h-full items-center justify-center font-sans text-xs text-muted-foreground">
            Loading preview…
          </div>
        ) : entry.previewImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.previewImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-sans text-xs text-muted-foreground">
            Preview unavailable
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent"
          aria-hidden
        />
        {isCurrent ? (
          <span className="absolute left-3 top-3 z-10 rounded bg-primary-blue px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide text-white">
            Current
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 border-t border-primary-blue/10 p-4">
        <div className="space-y-1.5">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-blue/45">
            {entry.vibe}
          </p>
          <p className="font-sans text-base font-semibold text-primary-blue">
            {entry.name}
          </p>
          <p className="line-clamp-3 font-sans text-xs leading-relaxed text-muted-foreground">
            {entry.description}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-1">
          <button
            type="button"
            disabled={disabled}
            onClick={onPreview}
            className="w-full rounded-lg border border-primary-blue/20 bg-white px-3 py-2.5 font-sans text-sm font-semibold text-primary-blue transition-colors hover:bg-blue-gray/40 disabled:opacity-50"
          >
            Preview
          </button>
          <button
            type="button"
            disabled={disabled || isCurrent}
            onClick={onContinue}
            title={
              isCurrent
                ? "This template is already selected for your store"
                : undefined
            }
            className="w-full rounded-lg bg-primary-blue px-3 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-primary-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCurrent
              ? "Current template"
              : isApplying
                ? "Opening…"
                : "Continue with this template"}
          </button>
        </div>
      </div>
    </article>
  );
}
