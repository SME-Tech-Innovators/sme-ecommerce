"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  StorefrontEditor,
  type StorefrontCustomizeMode,
} from "@/components/storefront/storefront-editor";
import { StorefrontPublishControls } from "@/components/storefront/storefront-publish-controls";
import { StorefrontShopCollectionPreview } from "@/components/storefront/storefront-shop-collection-preview";
import { StorefrontTemplateView } from "@/components/storefront/storefront-template-view";
import {
  useSaveStorefrontDraft,
  useStorefrontDraft,
} from "@/hooks/use-storefront-draft";
import { usePublishedStorefront } from "@/hooks/use-storefront-publish";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import {
  STOREFRONT_COLLECTION_PAGE_META,
  parseCollectionPageSelectionId,
} from "@/lib/storefront-collection-pages";
import {
  hasChosenStorefrontTemplate,
  markStorefrontTemplateChosen,
} from "@/lib/storefront-template-setup";
import type { StorefrontConfig, StorefrontSection } from "@/types/storefront";

type StorefrontPanelProps = {
  workspaceId: string;
};

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const SAVE_DEBOUNCE_MS = 800;

function createStorefrontSection(type: StorefrontSection["type"]): StorefrontSection {
  const id = `${type}-${Date.now()}`;
  switch (type) {
    case "hero":
      return {
        id,
        type,
        imageUrl: "",
        heading: "New page hero",
        subheading: "Tell customers what this section is about.",
        primaryCta: { label: "Shop collection", href: "@shop" },
        secondaryCta: { label: "Learn more", href: "#" },
      };
    case "featuredProducts":
      return {
        id,
        type,
        title: "Featured products",
        viewAll: { label: "View all", href: "@shop" },
        limit: 4,
      };
    case "newArrivals":
      return {
        id,
        type,
        eyebrow: "Just landed",
        title: "New arrivals",
        viewAll: { label: "Shop all new", href: "@shop" },
        limit: 4,
      };
    case "sale":
      return {
        id,
        type,
        eyebrow: "Sale",
        title: "On sale now",
        description: "Hand-picked deals while stocks last.",
        viewAll: { label: "Shop all sale", href: "@shop" },
        imageUrl: "",
        limit: 4,
      };
    case "shopByCategory":
      return {
        id,
        type,
        title: "Shop by category",
        viewAll: { label: "View all", href: "@shop" },
        categories: [],
      };
    case "promoBanner":
      return {
        id,
        type,
        title: "Special offer",
        description: "Highlight a launch, sale, or seasonal promotion.",
        buttonLabel: "Shop now",
        imageUrl: "",
        href: "@shop",
      };
    case "textImage":
      return {
        id,
        type,
        eyebrow: "Story",
        title: "Add your story",
        body: "Use this section to explain your brand, service, or product range.",
        imageUrl: "",
        imagePosition: "right",
        cta: { label: "Learn more", href: "#" },
      };
    case "features":
      return {
        id,
        type,
        title: "Why shop with us",
        items: [
          {
            title: "Fast service",
            description: "Help customers understand why ordering is easy.",
            icon: "check",
          },
          {
            title: "Reliable delivery",
            description: "Explain pickup, shipping, or local fulfilment.",
            icon: "truck",
          },
          {
            title: "Helpful support",
            description: "Mention WhatsApp support or personal service.",
            icon: "sparkle",
          },
        ],
      };
    case "testimonials":
      return {
        id,
        type,
        title: "What customers say",
        items: [
          {
            quote: "Beautiful products and such an easy ordering experience.",
            name: "Thandi M.",
            role: "Cape Town",
            imageUrl: "",
          },
        ],
      };
    case "instagramGallery":
      return {
        id,
        type,
        title: "Follow us",
        handle: "@yourstore",
        images: [
          { imageUrl: "", href: "#" },
          { imageUrl: "", href: "#" },
          { imageUrl: "", href: "#" },
          { imageUrl: "", href: "#" },
        ],
      };
    case "newsletter":
      return {
        id,
        type,
        title: "Stay in the loop",
        body: "Get new arrivals and offers first. No spam.",
        placeholder: "you@email.com",
        buttonLabel: "Subscribe",
        successMessage: "Thanks — you are on the list.",
      };
    case "faq":
      return {
        id,
        type,
        title: "Frequently asked questions",
        items: [
          {
            question: "How do I place an order?",
            answer: "Browse products, add them to cart, and complete checkout.",
          },
        ],
      };
    case "contactCta":
      return {
        id,
        type,
        title: "Need help?",
        body: "Message us and we will help you choose the right products.",
        buttonLabel: "Contact us",
        href: "@page:contact",
      };
    case "contact":
      return {
        id,
        type,
        eyebrow: "Contact",
        title: "Get in touch",
        body: "Prefer WhatsApp for a quick reply, or leave a message and we’ll follow up by email.",
        email: "hello@example.com",
        hours: "Mon–Fri, 9:00–17:00",
        note: "Usually replies within a few hours.",
        whatsappLabel: "Chat on WhatsApp",
        whatsappHref: "",
        formTitle: "Send a message",
        submitLabel: "Send message",
        successMessage: "Thanks — we have your message and will reply soon.",
      };
  }
}

export function StorefrontPanel({ workspaceId }: StorefrontPanelProps) {
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setSignedIn(Boolean(getStoredAuthSession()?.accessToken));
    setAuthReady(true);
  }, []);

  const draftQuery = useStorefrontDraft(workspaceId, signedIn);
  const publishedQuery = usePublishedStorefront(workspaceId, signedIn);
  const saveMutation = useSaveStorefrontDraft(workspaceId);

  const [config, setConfig] = useState<StorefrontConfig | null>(null);
  const [templateVersion, setTemplateVersion] = useState(1);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [customizeMode, setCustomizeMode] =
    useState<StorefrontCustomizeMode>("section");
  const [previewPageId, setPreviewPageId] = useState<"home" | string>("home");
  const [sectionEditTarget, setSectionEditTarget] = useState<{
    id: string;
    pageId: "home" | string;
    requestId: number;
  } | null>(null);
  const [setupGateReady, setSetupGateReady] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const saveTimerRef = useRef<number | null>(null);
  const latestConfigRef = useRef<StorefrontConfig | null>(null);
  const templateVersionRef = useRef(1);
  const hasHydratedRef = useRef(false);
  const saveStatusRef = useRef<SaveStatus>("idle");

  useEffect(() => {
    saveStatusRef.current = saveStatus;
  }, [saveStatus]);

  // Template picker only for first-time setup. Existing stores go straight to the editor.
  useEffect(() => {
    if (!authReady) return;
    if (!signedIn) {
      setSetupGateReady(true);
      setShowTemplatePicker(false);
      return;
    }
    if (draftQuery.isLoading || publishedQuery.isLoading) return;

    const chosen = hasChosenStorefrontTemplate(workspaceId);
    const hasPublished = Boolean(publishedQuery.data);
    const templateId =
      draftQuery.data?.config.templateId ??
      draftQuery.data?.draft.templateId ??
      "classic-boutique";

    if (chosen || hasPublished) {
      if (!chosen) {
        markStorefrontTemplateChosen(workspaceId, String(templateId));
      }
      setShowTemplatePicker(false);
    } else {
      setShowTemplatePicker(true);
    }
    setSetupGateReady(true);
  }, [
    authReady,
    signedIn,
    workspaceId,
    draftQuery.isLoading,
    draftQuery.data,
    publishedQuery.isLoading,
    publishedQuery.data,
  ]);

  useEffect(() => {
    if (!draftQuery.data) return;
    // Don't overwrite local edits while a debounced/in-flight save is running,
    // and don't wipe "Draft saved" back to idle when the query cache updates.
    if (
      saveStatusRef.current === "pending" ||
      saveStatusRef.current === "saving"
    ) {
      return;
    }

    const incoming = draftQuery.data.config;
    const local = latestConfigRef.current;
    // Keep newer in-progress local edits if the cache updates with an older snapshot.
    if (
      hasHydratedRef.current &&
      local &&
      local.updatedAt > (incoming.updatedAt ?? 0)
    ) {
      return;
    }

    setConfig(incoming);
    setTemplateVersion(draftQuery.data.draft.templateVersion);
    latestConfigRef.current = incoming;
    templateVersionRef.current = draftQuery.data.draft.templateVersion;

    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      setSaveStatus("idle");
    }
  }, [draftQuery.data]);

  useEffect(() => {
    templateVersionRef.current = templateVersion;
  }, [templateVersion]);

  const flushSave = useCallback(async () => {
    const next = latestConfigRef.current;
    if (!next) return;
    const savedUpdatedAt = next.updatedAt;
    setSaveStatus("saving");
    try {
      const view = await saveMutation.mutateAsync({
        config: next,
        templateVersion: templateVersionRef.current,
      });
      setTemplateVersion(view.draft.templateVersion);
      templateVersionRef.current = view.draft.templateVersion;

      // If the user typed while this request was in flight, don't mark saved
      // (or clobber) — keep pending and save again.
      if (latestConfigRef.current?.updatedAt !== savedUpdatedAt) {
        setSaveStatus("pending");
        if (saveTimerRef.current != null) {
          window.clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = window.setTimeout(() => {
          void flushSave().catch(() => {
            /* toast already shown in flushSave */
          });
        }, SAVE_DEBOUNCE_MS);
        return;
      }

      setSaveStatus("saved");
    } catch (error) {
      setSaveStatus("error");
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save storefront draft.",
      );
      throw error;
    }
  }, [saveMutation]);

  const flushDraftBeforePublish = useCallback(async () => {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await flushSave();
  }, [flushSave]);

  const persist = useCallback(
    (next: StorefrontConfig) => {
      const stamped = { ...next, updatedAt: Date.now() };
      setConfig(stamped);
      latestConfigRef.current = stamped;
      setSaveStatus("pending");
      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        void flushSave().catch(() => {
          /* toast already shown in flushSave */
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [flushSave],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const moveHomepageSection = useCallback(
    (from: number, to: number) => {
      if (!config) return;
      const pageSections =
        previewPageId === "home"
          ? config.sections
          : config.pages.find((p) => p.id === previewPageId)?.sections;
      if (!pageSections || to < 0 || to >= pageSections.length || from === to) {
        return;
      }
      const sections = [...pageSections];
      const [section] = sections.splice(from, 1);
      sections.splice(to, 0, section);
      if (previewPageId === "home") {
        persist({ ...config, sections });
        return;
      }
      persist({
        ...config,
        pages: config.pages.map((page) =>
          page.id === previewPageId ? { ...page, sections } : page,
        ),
      });
    },
    [config, persist, previewPageId],
  );

  const addHomepageSection = useCallback(
    (type: StorefrontSection["type"], index: number) => {
      if (!config) return;
      if (previewPageId === "home") {
        const sections = [...config.sections];
        sections.splice(index, 0, createStorefrontSection(type));
        persist({ ...config, sections });
        return;
      }
      persist({
        ...config,
        pages: config.pages.map((page) => {
          if (page.id !== previewPageId) return page;
          const sections = [...page.sections];
          sections.splice(index, 0, createStorefrontSection(type));
          return { ...page, sections };
        }),
      });
    },
    [config, persist, previewPageId],
  );

  const editHomepageSection = useCallback(
    (sectionId: string) => {
      setSectionEditTarget((current) => ({
        id: sectionId,
        pageId: previewPageId,
        requestId: (current?.requestId ?? 0) + 1,
      }));
    },
    [previewPageId],
  );

  const removeHomepageSection = useCallback(
    (index: number) => {
      if (!config) return;
      if (previewPageId === "home") {
        persist({
          ...config,
          sections: config.sections.filter((_, i) => i !== index),
        });
        return;
      }
      persist({
        ...config,
        pages: config.pages.map((page) => {
          if (page.id !== previewPageId) return page;
          return {
            ...page,
            sections: page.sections.filter((_, i) => i !== index),
          };
        }),
      });
    },
    [config, persist, previewPageId],
  );

  const handleSelectedPageChange = useCallback((pageId: string) => {
    setPreviewPageId(pageId);
  }, []);

  const previewCollectionPageId =
    parseCollectionPageSelectionId(previewPageId);
  const previewPage =
    config && previewPageId !== "home" && !previewCollectionPageId
      ? config.pages.find((page) => page.id === previewPageId) ?? null
      : null;

  const previewConfig = useMemo(() => {
    if (!config) return null;
    if (!previewPage) return config;
    return {
      ...config,
      sections: previewPage.sections,
    };
  }, [config, previewPage]);

  if (!authReady || !setupGateReady || (signedIn && (draftQuery.isLoading || publishedQuery.isLoading))) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 font-sans text-sm text-muted-foreground">
        Loading storefront…
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
          Storefront drafts are loaded from the backend. Sign in to edit your
          workspace storefront.
        </p>
        <Link
          href="/signin"
          className="mt-2 font-sans text-sm font-semibold text-primary-blue underline"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  if (draftQuery.isLoading || (!config && draftQuery.isFetching)) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 font-sans text-sm text-muted-foreground">
        Loading storefront draft…
      </div>
    );
  }

  if (draftQuery.isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <h2 className="font-serif text-2xl font-light text-primary-blue">
          Could not load storefront
        </h2>
        <p className="max-w-md font-sans text-sm text-muted-foreground">
          {draftQuery.error instanceof Error
            ? draftQuery.error.message
            : "The storefront draft could not be loaded."}
        </p>
        <button
          type="button"
          onClick={() => void draftQuery.refetch()}
          className="mt-2 bg-primary-blue px-4 py-2 font-sans text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (showTemplatePicker) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <h2 className="font-serif text-2xl font-light text-primary-blue">
          Choose a template first
        </h2>
        <p className="max-w-md font-sans text-sm text-muted-foreground">
          Pick a layout under Templates, then come back to My Store to edit your
          shop.
        </p>
        <Link
          href={`/dashboard/${workspaceId}?section=templates`}
          className="mt-2 bg-primary-blue px-5 py-2.5 font-sans text-sm font-semibold text-white"
        >
          Browse templates
        </Link>
      </div>
    );
  }

  if (!config || !previewConfig) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 font-sans text-sm text-muted-foreground">
        Loading storefront draft…
      </div>
    );
  }

  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "pending"
        ? "Unsaved changes…"
        : saveStatus === "saved"
          ? "Draft saved"
          : saveStatus === "error"
            ? "Save failed"
            : "All changes saved";

  const saveTone =
    saveStatus === "error"
      ? "text-red-700"
      : saveStatus === "pending" || saveStatus === "saving"
        ? "text-amber-800"
        : saveStatus === "saved"
          ? "text-emerald-800"
          : "text-primary-blue/55";

  const asideMobileHeightClass =
    customizeMode === "section"
      ? "max-lg:min-h-0 max-lg:flex-1 max-lg:h-full"
      : "max-lg:max-h-[min(60dvh,28rem)] max-lg:min-h-0";

  const previewLabel =
    previewPageId === "home"
      ? "Homepage"
      : STOREFRONT_COLLECTION_PAGE_META.find(
          (item) => item.id === previewCollectionPageId,
        )?.label ||
        previewPage?.title.trim() ||
        "Custom page";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <StorefrontPublishControls
        workspaceId={workspaceId}
        flushDraftSave={flushDraftBeforePublish}
        hasUnsavedDraft={
          saveStatus === "pending" || saveStatus === "saving"
        }
        draftUpdatedAt={config?.updatedAt ?? null}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row lg:items-stretch">
      <aside
        className={`flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-primary-blue/10 bg-white ${asideMobileHeightClass} lg:h-full lg:w-[min(100%,22rem)] lg:border-b-0 lg:border-r`}
      >
        <div className="flex shrink-0 flex-col gap-2 border-b border-primary-blue/10 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-primary-blue/55">
              Customize
            </p>
            <Link
              href={`/preview/${workspaceId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden font-sans text-xs font-medium text-primary-blue underline decoration-primary-blue/30 underline-offset-2 hover:decoration-primary-blue lg:inline"
            >
              Open customer preview
            </Link>
          </div>
          <p
            className={`inline-flex items-center gap-1.5 font-sans text-xs font-semibold ${saveTone}`}
            role="status"
            aria-live="polite"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                saveStatus === "error"
                  ? "bg-red-600"
                  : saveStatus === "pending" || saveStatus === "saving"
                    ? "animate-pulse bg-amber-500"
                    : saveStatus === "saved"
                      ? "bg-emerald-600"
                      : "bg-primary-blue/40"
              }`}
              aria-hidden
            />
            {saveLabel}
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pt-2">
          <StorefrontEditor
            workspaceId={workspaceId}
            config={config}
            onChange={persist}
            previewHref={`/preview/${workspaceId}`}
            onCustomizeModeChange={setCustomizeMode}
            selectedPageId={previewPageId}
            onSelectedPageChange={handleSelectedPageChange}
            sectionEditTarget={sectionEditTarget}
          />
        </div>
        <footer
          className={`shrink-0 border-t border-primary-blue/10 bg-white px-5 py-3 ${
            customizeMode === "section" ? "max-lg:hidden" : ""
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`font-sans text-[11px] leading-relaxed ${saveTone}`}>
              Autosave · {saveLabel}
            </p>
            <Link
              href={`/dashboard/${workspaceId}?section=templates`}
              className="font-sans text-[11px] font-semibold text-primary-blue underline decoration-primary-blue/30 underline-offset-2 hover:decoration-primary-blue"
            >
              Templates
            </Link>
          </div>
          <Link
            href={`/preview/${workspaceId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex font-sans text-xs font-semibold text-primary-blue underline decoration-primary-blue/30 underline-offset-2 hover:decoration-primary-blue lg:hidden"
          >
            Open customer preview
          </Link>
        </footer>
      </aside>
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-blue-gray/30 ${
          customizeMode === "section" ? "max-lg:hidden" : ""
        }`}
      >
        <p className="sticky top-0 z-10 shrink-0 border-b border-primary-blue/10 bg-white/90 px-4 py-2 text-center font-sans text-[11px] uppercase tracking-[0.14em] text-primary-blue/50 backdrop-blur supports-[backdrop-filter]:bg-white/75">
          Live preview · {previewLabel} · {saveLabel}
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {previewCollectionPageId && config ? (
            <StorefrontShopCollectionPreview
              workspaceId={workspaceId}
              config={config}
              pageId={previewCollectionPageId}
              onSelectPage={handleSelectedPageChange}
            />
          ) : (
            <StorefrontTemplateView
              config={previewConfig}
              workspaceId={workspaceId}
              isEditing
              onMoveSection={moveHomepageSection}
              onAddSection={addHomepageSection}
              onEditSection={editHomepageSection}
              onRemoveSection={removeHomepageSection}
            />
          )}
        </div>
        <footer className="shrink-0 border-t border-primary-blue/10 bg-white px-4 py-2.5 text-center font-sans text-[11px] leading-snug text-primary-blue/55">
          <span className="font-medium text-primary-blue/70">
            {config.shopName}
          </span>
          <span className="mx-1.5 text-primary-blue/30" aria-hidden>
            ·
          </span>
          <span>{config.copyrightLine}</span>
        </footer>
      </div>
      </div>
    </div>
  );
}
