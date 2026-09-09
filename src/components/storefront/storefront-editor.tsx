"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/storefront/image-upload-field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  STOREFRONT_COLLECTION_PAGE_META,
  collectionPageSelectionId,
  mergeCollectionPages,
  parseCollectionPageSelectionId,
} from "@/lib/storefront-collection-pages";
import {
  STOREFRONT_DEFAULT_MEDIA,
  defaultInstagramImageUrl,
  defaultPromoImageUrl,
} from "@/lib/storefront-default-media";
import {
  downloadStorefrontBrandKit,
  parseStorefrontBrandKitImport,
} from "@/lib/storefront-brand-kit";
import { STOREFRONT_FONT_PAIRS } from "@/lib/storefront-fonts";
import {
  STOREFRONT_THEME_DEFINITIONS,
  normalizeAccentColor,
} from "@/lib/storefront-themes";
import { isReservedStorefrontPageSlug } from "@/lib/storefront-reserved-slugs";
import type {
  StorefrontCollectionPageConfig,
  StorefrontCollectionPageId,
  StorefrontConfig,
  StorefrontCustomPage,
  StorefrontFeature,
  StorefrontFeatureIconId,
  StorefrontLink,
  StorefrontPromoCard,
  StorefrontSection,
  StorefrontShopChromeConfig,
  StorefrontThemeId,
  StorefrontFontPairId,
} from "@/types/storefront";

type StorefrontEditorSectionId =
  | "appearance"
  | "pages"
  | "brand"
  | "navbar"
  | "hero"
  | "products"
  | "promos"
  | "values"
  | "footer";

const EDITOR_SECTIONS: { id: StorefrontEditorSectionId; label: string }[] = [
  { id: "appearance", label: "Appearance" },
  { id: "pages", label: "Pages" },
  { id: "brand", label: "Brand" },
  { id: "navbar", label: "Navbar" },
  { id: "footer", label: "Footer" },
];

export type StorefrontCustomizeMode = "sections" | "section";

type StorefrontEditorProps = {
  workspaceId: string;
  config: StorefrontConfig;
  onChange: (next: StorefrontConfig) => void;
  /** Lets the parent resize the shell (e.g. hide preview) when a section is open vs. the list. */
  onCustomizeModeChange?: (mode: StorefrontCustomizeMode) => void;
  /** Controlled page selection (home / collection:* / custom page id). */
  selectedPageId: string;
  onSelectedPageChange: (pageId: string) => void;
  /** Shown next to Return on small screens while the preview column is hidden. */
  previewHref?: string;
  sectionEditTarget?: {
    id: string;
    pageId: "home" | string;
    requestId: number;
  } | null;
};

function Field({
  label,
  id,
  ...inputProps
}: ComponentPropsWithoutRef<"input"> & { label: string; id: string }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60"
      >
        {label}
      </label>
      <input
        id={id}
        className="w-full border border-primary-blue/15 bg-white px-3 py-2 font-sans text-sm text-foreground outline-none focus-visible:border-primary-blue/35 focus-visible:ring-2 focus-visible:ring-primary-blue/15"
        {...inputProps}
      />
    </div>
  );
}

function TextAreaField({
  label,
  id,
  ...props
}: ComponentPropsWithoutRef<"textarea"> & { label: string; id: string }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60"
      >
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className="w-full resize-y border border-primary-blue/15 bg-white px-3 py-2 font-sans text-sm text-foreground outline-none focus-visible:border-primary-blue/35 focus-visible:ring-2 focus-visible:ring-primary-blue/15"
        {...props}
      />
    </div>
  );
}

function LinkPairEditor({
  label,
  link,
  onChange,
  onRemove,
  idPrefix,
}: {
  label: string;
  link: StorefrontLink;
  onChange: (next: StorefrontLink) => void;
  onRemove?: () => void;
  idPrefix: string;
}) {
  return (
    <div className="rounded border border-primary-blue/10 bg-blue-gray/15 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-blue/55">
          {label}
        </p>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="font-sans text-[11px] font-medium text-red-700/90"
          >
            Remove
          </button>
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field
          label="Label"
          id={`${idPrefix}-l`}
          value={link.label}
          onChange={(e) => onChange({ ...link, label: e.target.value })}
        />
        <Field
          label="Link (URL or #)"
          id={`${idPrefix}-h`}
          value={link.href}
          onChange={(e) => onChange({ ...link, href: e.target.value })}
        />
      </div>
    </div>
  );
}

function OptionalHeroCtaEditor({
  label,
  link,
  defaultLink,
  idPrefix,
  onChange,
}: {
  label: string;
  link: StorefrontLink | null;
  defaultLink: StorefrontLink;
  idPrefix: string;
  onChange: (next: StorefrontLink | null) => void;
}) {
  if (!link) {
    return (
      <button
        type="button"
        onClick={() => onChange({ ...defaultLink })}
        className="w-full rounded border border-dashed border-primary-blue/25 bg-white px-3 py-2.5 font-sans text-xs font-semibold text-primary-blue"
      >
        + Add {label.toLowerCase()}
      </button>
    );
  }

  return (
    <LinkPairEditor
      label={label}
      link={link}
      idPrefix={idPrefix}
      onChange={onChange}
      onRemove={() => onChange(null)}
    />
  );
}

/** Limit picker for Featured / New arrivals / Sale: custom count or show all. */
function ProductLimitField({
  id,
  limit,
  onChange,
  hint,
}: {
  id: string;
  limit: number | null | undefined;
  onChange: (next: number | null) => void;
  hint?: string;
}) {
  const showAll = limit === null;
  return (
    <div className="space-y-2">
      <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-foreground">
        <Checkbox
          checked={showAll}
          onCheckedChange={(checked) =>
            onChange(checked === true ? null : 4)
          }
        />
        Show all products
      </label>
      {!showAll ? (
        <Field
          label="Products to show"
          id={id}
          type="number"
          min={1}
          max={48}
          value={limit ?? 4}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(
              Number.isFinite(n)
                ? Math.min(48, Math.max(1, Math.floor(n)))
                : 4,
            );
          }}
        />
      ) : null}
      {hint ? (
        <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const SECTION_LIBRARY: Array<{
  type: StorefrontSection["type"];
  label: string;
  description: string;
}> = [
  {
    type: "hero",
    label: "Hero banner",
    description: "Large image-led intro with optional buttons.",
  },
  {
    type: "featuredProducts",
    label: "Featured products",
    description: "Active products from your catalogue.",
  },
  {
    type: "newArrivals",
    label: "New arrivals",
    description:
      "Newest active products. Use Show all on a dedicated page.",
  },
  {
    type: "sale",
    label: "Sale",
    description:
      "On-sale catalogue products (compare-at price). Use Show all for a full sale page.",
  },
  {
    type: "shopByCategory",
    label: "Shop by category",
    description: "Category cards from products or manual cards.",
  },
  {
    type: "promoBanner",
    label: "Promo banner",
    description: "Sale or campaign card with image and CTA.",
  },
  {
    type: "textImage",
    label: "Text + image",
    description: "Story block with supporting image.",
  },
  {
    type: "features",
    label: "Benefits",
    description: "Three feature columns with icons.",
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Customer quotes with optional photos.",
  },
  {
    type: "instagramGallery",
    label: "Instagram gallery",
    description: "Grid of lifestyle images and links.",
  },
  {
    type: "newsletter",
    label: "Newsletter",
    description: "Email capture form (UI only for now).",
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Frequently asked questions.",
  },
  {
    type: "contact",
    label: "Contact form",
    description: "Channels + message form for a Contact page.",
  },
  {
    type: "contactCta",
    label: "Contact CTA",
    description: "WhatsApp or contact call-to-action.",
  },
];

function slugifyPageTitle(title: string, fallback: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const next = slug || fallback;
  if (isReservedStorefrontPageSlug(next)) {
    return `${next}-page`;
  }
  return next;
}

function newSection(type: StorefrontSection["type"]): StorefrontSection {
  const id = `${type}-${Date.now()}`;
  switch (type) {
    case "hero":
      return {
        id,
        type,
        imageUrl: STOREFRONT_DEFAULT_MEDIA.hero,
        heading: "New page hero",
        subheading: "Tell customers what this page is about.",
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
        viewAll: { label: "Shop all new", href: "@shop/new" },
        limit: 4,
      };
    case "sale":
      return {
        id,
        type,
        eyebrow: "Sale",
        title: "On sale now",
        description: "Hand-picked deals while stocks last.",
        viewAll: { label: "Shop all sale", href: "@shop/sale" },
        imageUrl: STOREFRONT_DEFAULT_MEDIA.saleBanner,
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
        imageUrl: defaultPromoImageUrl(0),
        href: "@shop",
      };
    case "textImage":
      return {
        id,
        type,
        eyebrow: "Story",
        title: "Add your story",
        body: "Use this section to explain your brand, service, or product range.",
        imageUrl: STOREFRONT_DEFAULT_MEDIA.textImage,
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
            title: "Free shipping & returns",
            description: "Easy online returns on eligible orders.",
            icon: "truck",
          },
          {
            title: "Secure checkout",
            description: "Card payments are encrypted and secure.",
            icon: "check",
          },
          {
            title: "Helpful support",
            description: "Message us anytime — we reply fast.",
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
          {
            quote: "The quality exceeded my expectations. Will order again.",
            name: "James K.",
            role: "Johannesburg",
            imageUrl: "",
          },
          {
            quote: "Friendly support and fast delivery. Highly recommend.",
            name: "Lerato P.",
            role: "Durban",
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
          { imageUrl: defaultInstagramImageUrl(0), href: "#" },
          { imageUrl: defaultInstagramImageUrl(1), href: "#" },
          { imageUrl: defaultInstagramImageUrl(2), href: "#" },
          { imageUrl: defaultInstagramImageUrl(3), href: "#" },
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
          {
            question: "Can I contact you first?",
            answer: "Yes, use the contact button and we will help on WhatsApp.",
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

export function StorefrontEditor({
  workspaceId,
  config,
  onChange,
  onCustomizeModeChange,
  selectedPageId,
  onSelectedPageChange,
  previewHref,
  sectionEditTarget,
}: StorefrontEditorProps) {
  const brandKitImportRef = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<StorefrontEditorSectionId>(
    EDITOR_SECTIONS[0].id,
  );
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);

  useEffect(() => {
    // Keep the taller sidebar + mobile preview behavior while editing settings.
    onCustomizeModeChange?.("section");
  }, [onCustomizeModeChange]);

  useEffect(() => {
    if (!sectionEditTarget) return;
    const timeoutId = window.setTimeout(() => {
      setSection("pages");
      onSelectedPageChange(sectionEditTarget.pageId);
      setFocusedSectionId(sectionEditTarget.id);
      window.requestAnimationFrame(() => {
        document
          .getElementById(`storefront-editor-section-${sectionEditTarget.id}`)
          ?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [sectionEditTarget, onSelectedPageChange]);

  function setSelectedPageId(pageId: string) {
    onSelectedPageChange(pageId);
  }

  function patch(partial: Partial<StorefrontConfig>) {
    onChange({ ...config, ...partial });
  }

  function patchNav(i: number, next: StorefrontLink) {
    const navLinks = config.navLinks.map((l, j) => (j === i ? next : l));
    patch({ navLinks });
  }

  function addNavLink() {
    patch({ navLinks: [...config.navLinks, { label: "New link", href: "/" }] });
  }

  function removeNavLink(i: number) {
    patch({ navLinks: config.navLinks.filter((_, j) => j !== i) });
  }

  function moveNavLink(i: number, dir: -1 | 1) {
    const links = [...config.navLinks];
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    [links[i], links[j]] = [links[j], links[i]];
    patch({ navLinks: links });
  }

  function patchPromo(index: 0 | 1, partial: Partial<StorefrontPromoCard>) {
    const next = { ...config.promos[index], ...partial };
    const promos: [StorefrontPromoCard, StorefrontPromoCard] =
      index === 0
        ? [next, config.promos[1]]
        : [config.promos[0], next];
    patch({ promos });
  }

  function patchFeature(index: number, partial: Partial<StorefrontFeature>) {
    const features = config.features.map((f, j) =>
      j === index ? { ...f, ...partial } : f,
    ) as StorefrontConfig["features"];
    patch({ features });
  }

  function patchFooterColumn(
    key: "footerShopLinks" | "footerPolicyLinks" | "footerConnectLinks",
    index: number,
    next: StorefrontLink,
  ) {
    const list = config[key].map((l, j) => (j === index ? next : l));
    patch({ [key]: list });
  }

  const selectedCollectionPageId =
    parseCollectionPageSelectionId(selectedPageId);
  const collectionPages = mergeCollectionPages(config.collectionPages);
  const selectedCollectionPage = selectedCollectionPageId
    ? collectionPages[selectedCollectionPageId]
    : null;
  const selectedPage =
    selectedPageId === "home" || selectedCollectionPageId
      ? null
      : config.pages.find((p) => p.id === selectedPageId) ?? null;
  const editableSections =
    selectedPageId === "home"
      ? config.sections
      : selectedCollectionPageId
        ? []
        : selectedPage?.sections ?? [];

  function patchCollectionPage(
    id: StorefrontCollectionPageId,
    partial: Partial<StorefrontCollectionPageConfig>,
  ) {
    patch({
      collectionPages: {
        ...collectionPages,
        [id]: { ...collectionPages[id], ...partial },
      },
    });
  }

  function patchSelectedCollectionChrome(
    partial: Partial<StorefrontShopChromeConfig>,
  ) {
    if (!selectedCollectionPageId || !selectedCollectionPage) return;
    patchCollectionPage(selectedCollectionPageId, {
      chrome: { ...selectedCollectionPage.chrome, ...partial },
    });
  }

  function patchSections(nextSections: StorefrontSection[]) {
    if (selectedCollectionPageId) return;
    if (selectedPageId === "home") {
      patch({ sections: nextSections });
      return;
    }
    patch({
      pages: config.pages.map((page) =>
        page.id === selectedPageId
          ? { ...page, sections: nextSections }
          : page,
      ),
    });
  }

  function patchSelectedPage(partial: Partial<StorefrontCustomPage>) {
    if (selectedPageId === "home" || selectedCollectionPageId) return;
    patch({
      pages: config.pages.map((page) =>
        page.id === selectedPageId ? { ...page, ...partial } : page,
      ),
    });
  }

  function addPage() {
    const n = config.pages.length + 1;
    const title = `New page ${n}`;
    const page: StorefrontCustomPage = {
      id: `page-${Date.now()}`,
      title,
      slug: slugifyPageTitle(title, `page-${n}`),
      sections: [],
    };
    patch({ pages: [...config.pages, page] });
    setSelectedPageId(page.id);
  }

  function removeSelectedPage() {
    if (selectedPageId === "home" || selectedCollectionPageId) return;
    patch({ pages: config.pages.filter((page) => page.id !== selectedPageId) });
    setSelectedPageId("home");
  }

  function addSection(type: StorefrontSection["type"]) {
    patchSections([...editableSections, newSection(type)]);
  }

  function removeSection(index: number) {
    patchSections(editableSections.filter((_, i) => i !== index));
  }

  function patchSectionAt(index: number, nextSection: StorefrontSection) {
    patchSections(
      editableSections.map((item, i) => (i === index ? nextSection : item)),
    );
  }

  const sectionLabel =
    EDITOR_SECTIONS.find((s) => s.id === section)?.label ?? section;
  const focusedSectionIndex = focusedSectionId
    ? editableSections.findIndex((item) => item.id === focusedSectionId)
    : -1;
  const isFocusedSectionEditing = focusedSectionIndex >= 0;
  const visibleSectionEntries = isFocusedSectionEditing
    ? [
        {
          item: editableSections[focusedSectionIndex],
          index: focusedSectionIndex,
        },
      ]
    : editableSections.map((item, index) => ({ item, index }));

  function selectSection(id: StorefrontEditorSectionId) {
    setSection(id);
    setFocusedSectionId(null);
  }

  function selectTheme(themeId: StorefrontThemeId) {
    patch({
      themeId,
      accentColor: STOREFRONT_THEME_DEFINITIONS[themeId].defaultAccent,
    });
  }

  function selectFontPair(fontPairId: StorefrontFontPairId) {
    patch({ fontPairId });
  }

  function patchAccentColor(raw: string) {
    patch({
      accentColor: normalizeAccentColor(
        raw,
        STOREFRONT_THEME_DEFINITIONS[config.themeId].defaultAccent,
      ),
    });
  }

  async function handleBrandKitImport(file: File | undefined) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const next = parseStorefrontBrandKitImport(parsed, config);
      onChange(next);
      toast.success("Brand kit imported", {
        description: "Review your storefront, then save or publish.",
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not import brand kit.",
      );
    }
  }

  function renderSectionLayoutField(item: StorefrontSection, index: number) {
    return (
      <div>
        <label
          htmlFor={`sec-${item.id}-desktop-layout`}
          className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60"
        >
          Desktop layout
        </label>
        <select
          id={`sec-${item.id}-desktop-layout`}
          value={item.desktopLayout ?? "full"}
          onChange={(event) =>
            patchSectionAt(index, {
              ...item,
              desktopLayout:
                event.target.value === "half" ? "half" : "full",
            })
          }
          className="w-full border border-primary-blue/15 bg-white px-3 py-2 font-sans text-sm text-foreground outline-none focus-visible:border-primary-blue/35 focus-visible:ring-2 focus-visible:ring-primary-blue/15"
        >
          <option value="full">Full width</option>
          <option value="half">Half width, pair on desktop</option>
        </select>
        <p className="mt-1 font-sans text-[11px] leading-relaxed text-muted-foreground">
          Place two half-width sections next to each other to create a desktop
          flex row.
        </p>
      </div>
    );
  }

  function renderSectionFields(item: StorefrontSection, index: number) {
    switch (item.type) {
      case "hero":
        return (
          <div className="space-y-3">
            <Field
              label="Heading"
              id={`sec-${item.id}-heading`}
              value={item.heading}
              onChange={(e) =>
                patchSectionAt(index, { ...item, heading: e.target.value })
              }
            />
            <TextAreaField
              label="Subheading"
              id={`sec-${item.id}-subheading`}
              value={item.subheading}
              onChange={(e) =>
                patchSectionAt(index, { ...item, subheading: e.target.value })
              }
            />
            <ImageUploadField
              workspaceId={workspaceId}
              label="Background image"
              value={item.imageUrl}
              onChange={(url) =>
                patchSectionAt(index, { ...item, imageUrl: url })
              }
            />
            <OptionalHeroCtaEditor
              label="Primary button"
              link={item.primaryCta}
              defaultLink={{ label: "Shop collection", href: "@shop" }}
              idPrefix={`sec-${item.id}-primary`}
              onChange={(next) =>
                patchSectionAt(index, { ...item, primaryCta: next })
              }
            />
            <OptionalHeroCtaEditor
              label="Secondary button"
              link={item.secondaryCta}
              defaultLink={{ label: "Learn more", href: "#" }}
              idPrefix={`sec-${item.id}-secondary`}
              onChange={(next) =>
                patchSectionAt(index, { ...item, secondaryCta: next })
              }
            />
          </div>
        );
      case "featuredProducts":
        return (
          <div className="space-y-3">
            <Field
              label="Title"
              id={`sec-${item.id}-title`}
              value={item.title}
              onChange={(e) =>
                patchSectionAt(index, { ...item, title: e.target.value })
              }
            />
            <ProductLimitField
              id={`sec-${item.id}-limit`}
              limit={item.limit}
              onChange={(next) =>
                patchSectionAt(index, { ...item, limit: next })
              }
              hint="Use Show all on a full catalogue page; keep a small number for homepage teasers."
            />
            <OptionalHeroCtaEditor
              label="View all button"
              link={item.viewAll}
              defaultLink={{ label: "View all", href: "@shop" }}
              idPrefix={`sec-${item.id}-view-all`}
              onChange={(next) =>
                patchSectionAt(index, { ...item, viewAll: next })
              }
            />
            <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
              Shows active products from your{" "}
              <span className="font-medium text-primary-blue/80">Products</span>{" "}
              catalogue (not local placeholders). Manage titles, prices, and
              images in the Products dashboard.
            </p>
          </div>
        );
      case "promoBanner":
        return (
          <div className="space-y-3">
            <Field
              label="Title"
              id={`sec-${item.id}-title`}
              value={item.title}
              onChange={(e) =>
                patchSectionAt(index, { ...item, title: e.target.value })
              }
            />
            <TextAreaField
              label="Description"
              id={`sec-${item.id}-description`}
              value={item.description}
              onChange={(e) =>
                patchSectionAt(index, {
                  ...item,
                  description: e.target.value,
                })
              }
            />
            <Field
              label="Button label"
              id={`sec-${item.id}-button`}
              value={item.buttonLabel}
              onChange={(e) =>
                patchSectionAt(index, {
                  ...item,
                  buttonLabel: e.target.value,
                })
              }
            />
            <Field
              label="Link"
              id={`sec-${item.id}-href`}
              value={item.href}
              onChange={(e) =>
                patchSectionAt(index, { ...item, href: e.target.value })
              }
            />
            <ImageUploadField
              workspaceId={workspaceId}
              label="Image"
              value={item.imageUrl}
              onChange={(url) =>
                patchSectionAt(index, { ...item, imageUrl: url })
              }
            />
          </div>
        );
      case "textImage":
        return (
          <div className="space-y-3">
            <Field
              label="Eyebrow"
              id={`sec-${item.id}-eyebrow`}
              value={item.eyebrow}
              onChange={(e) =>
                patchSectionAt(index, { ...item, eyebrow: e.target.value })
              }
            />
            <Field
              label="Title"
              id={`sec-${item.id}-title`}
              value={item.title}
              onChange={(e) =>
                patchSectionAt(index, { ...item, title: e.target.value })
              }
            />
            <TextAreaField
              label="Body"
              id={`sec-${item.id}-body`}
              value={item.body}
              onChange={(e) =>
                patchSectionAt(index, { ...item, body: e.target.value })
              }
            />
            <ImageUploadField
              workspaceId={workspaceId}
              label="Image"
              value={item.imageUrl}
              onChange={(url) =>
                patchSectionAt(index, { ...item, imageUrl: url })
              }
            />
            <label
              htmlFor={`sec-${item.id}-position`}
              className="block font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60"
            >
              Image position
            </label>
            <select
              id={`sec-${item.id}-position`}
              value={item.imagePosition}
              onChange={(e) =>
                patchSectionAt(index, {
                  ...item,
                  imagePosition:
                    e.target.value === "left" ? "left" : "right",
                })
              }
              className="w-full border border-primary-blue/15 bg-white px-3 py-2 font-sans text-sm outline-none"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
            <LinkPairEditor
              label="Button"
              link={item.cta}
              idPrefix={`sec-${item.id}-cta`}
              onChange={(next) => patchSectionAt(index, { ...item, cta: next })}
            />
          </div>
        );
      case "features":
        return (
          <div className="space-y-3">
            <Field
              label="Section title"
              id={`sec-${item.id}-title`}
              value={item.title}
              onChange={(e) =>
                patchSectionAt(index, { ...item, title: e.target.value })
              }
            />
            {item.items.map((feature, featureIndex) => (
              <div
                key={`${item.id}-feature-${featureIndex}`}
                className="rounded border border-primary-blue/10 bg-white p-3"
              >
                <Field
                  label={`Feature ${featureIndex + 1} title`}
                  id={`sec-${item.id}-feature-${featureIndex}-title`}
                  value={feature.title}
                  onChange={(e) =>
                    patchSectionAt(index, {
                      ...item,
                      items: item.items.map((f, i) =>
                        i === featureIndex ? { ...f, title: e.target.value } : f,
                      ),
                    })
                  }
                />
                <div className="mt-2">
                  <TextAreaField
                    label="Description"
                    id={`sec-${item.id}-feature-${featureIndex}-description`}
                    value={feature.description}
                    onChange={(e) =>
                      patchSectionAt(index, {
                        ...item,
                        items: item.items.map((f, i) =>
                          i === featureIndex
                            ? { ...f, description: e.target.value }
                            : f,
                        ),
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        );
      case "faq":
        return (
          <div className="space-y-3">
            <Field
              label="Title"
              id={`sec-${item.id}-title`}
              value={item.title}
              onChange={(e) =>
                patchSectionAt(index, { ...item, title: e.target.value })
              }
            />
            {item.items.map((faq, faqIndex) => (
              <div
                key={`${item.id}-faq-${faqIndex}`}
                className="rounded border border-primary-blue/10 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-blue/45">
                    FAQ {faqIndex + 1}
                  </p>
                  <button
                    type="button"
                    disabled={item.items.length <= 1}
                    onClick={() =>
                      patchSectionAt(index, {
                        ...item,
                        items: item.items.filter((_, i) => i !== faqIndex),
                      })
                    }
                    className="font-sans text-xs font-semibold text-red-700/90 disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
                <Field
                  label="Question"
                  id={`sec-${item.id}-faq-${faqIndex}-question`}
                  value={faq.question}
                  onChange={(e) =>
                    patchSectionAt(index, {
                      ...item,
                      items: item.items.map((f, i) =>
                        i === faqIndex
                          ? { ...f, question: e.target.value }
                          : f,
                      ),
                    })
                  }
                />
                <div className="mt-2">
                  <TextAreaField
                    label="Answer"
                    id={`sec-${item.id}-faq-${faqIndex}-answer`}
                    value={faq.answer}
                    onChange={(e) =>
                      patchSectionAt(index, {
                        ...item,
                        items: item.items.map((f, i) =>
                          i === faqIndex ? { ...f, answer: e.target.value } : f,
                        ),
                      })
                    }
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                patchSectionAt(index, {
                  ...item,
                  items: [
                    ...item.items,
                    { question: "New question", answer: "New answer" },
                  ],
                })
              }
              className="font-sans text-xs font-semibold text-primary-blue underline decoration-primary-blue/30 underline-offset-2"
            >
              Add FAQ
            </button>
          </div>
        );
      case "contactCta":
        return (
          <div className="space-y-3">
            <Field
              label="Title"
              id={`sec-${item.id}-title`}
              value={item.title}
              onChange={(e) =>
                patchSectionAt(index, { ...item, title: e.target.value })
              }
            />
            <TextAreaField
              label="Body"
              id={`sec-${item.id}-body`}
              value={item.body}
              onChange={(e) =>
                patchSectionAt(index, { ...item, body: e.target.value })
              }
            />
            <Field
              label="Button label"
              id={`sec-${item.id}-button`}
              value={item.buttonLabel}
              onChange={(e) =>
                patchSectionAt(index, {
                  ...item,
                  buttonLabel: e.target.value,
                })
              }
            />
            <Field
              label="Link"
              id={`sec-${item.id}-href`}
              value={item.href}
              placeholder="@page:contact"
              onChange={(e) =>
                patchSectionAt(index, { ...item, href: e.target.value })
              }
            />
          </div>
        );
      case "contact":
        return (
          <div className="space-y-3">
            <Field
              label="Eyebrow"
              id={`sec-${item.id}-eyebrow`}
              value={item.eyebrow}
              onChange={(e) =>
                patchSectionAt(index, { ...item, eyebrow: e.target.value })
              }
            />
            <Field
              label="Title"
              id={`sec-${item.id}-title`}
              value={item.title}
              onChange={(e) =>
                patchSectionAt(index, { ...item, title: e.target.value })
              }
            />
            <TextAreaField
              label="Body"
              id={`sec-${item.id}-body`}
              value={item.body}
              onChange={(e) =>
                patchSectionAt(index, { ...item, body: e.target.value })
              }
            />
            <Field
              label="Email"
              id={`sec-${item.id}-email`}
              value={item.email}
              placeholder="hello@example.com"
              onChange={(e) =>
                patchSectionAt(index, { ...item, email: e.target.value })
              }
            />
            <Field
              label="Hours"
              id={`sec-${item.id}-hours`}
              value={item.hours}
              placeholder="Mon–Fri, 9:00–17:00"
              onChange={(e) =>
                patchSectionAt(index, { ...item, hours: e.target.value })
              }
            />
            <TextAreaField
              label="Note"
              id={`sec-${item.id}-note`}
              value={item.note}
              placeholder="Usually replies within a few hours."
              onChange={(e) =>
                patchSectionAt(index, { ...item, note: e.target.value })
              }
            />
            <Field
              label="WhatsApp label"
              id={`sec-${item.id}-wa-label`}
              value={item.whatsappLabel}
              onChange={(e) =>
                patchSectionAt(index, {
                  ...item,
                  whatsappLabel: e.target.value,
                })
              }
            />
            <Field
              label="WhatsApp link (optional)"
              id={`sec-${item.id}-wa-href`}
              value={item.whatsappHref}
              placeholder="Leave empty to use Footer WhatsApp number"
              onChange={(e) =>
                patchSectionAt(index, {
                  ...item,
                  whatsappHref: e.target.value,
                })
              }
            />
            <Field
              label="Form title"
              id={`sec-${item.id}-form-title`}
              value={item.formTitle}
              onChange={(e) =>
                patchSectionAt(index, { ...item, formTitle: e.target.value })
              }
            />
            <Field
              label="Submit label"
              id={`sec-${item.id}-submit`}
              value={item.submitLabel}
              onChange={(e) =>
                patchSectionAt(index, {
                  ...item,
                  submitLabel: e.target.value,
                })
              }
            />
            <TextAreaField
              label="Success message"
              id={`sec-${item.id}-success`}
              value={item.successMessage}
              onChange={(e) =>
                patchSectionAt(index, {
                  ...item,
                  successMessage: e.target.value,
                })
              }
            />
          </div>
        );
      case "newArrivals":
        return (
          <div className="space-y-3">
            <Field
              label="Eyebrow (optional)"
              id={`sec-${item.id}-eyebrow`}
              value={item.eyebrow}
              placeholder="Just landed"
              onChange={(e) =>
                patchSectionAt(index, { ...item, eyebrow: e.target.value })
              }
            />
            <Field
              label="Title (optional)"
              id={`sec-${item.id}-title`}
              value={item.title}
              placeholder="New arrivals"
              onChange={(e) =>
                patchSectionAt(index, { ...item, title: e.target.value })
              }
            />
            <ProductLimitField
              id={`sec-${item.id}-limit`}
              limit={item.limit}
              onChange={(next) =>
                patchSectionAt(index, { ...item, limit: next })
              }
              hint="On a dedicated New arrivals page, enable Show all and hide the labels above."
            />
            <OptionalHeroCtaEditor
              label="View all button"
              link={item.viewAll}
              defaultLink={{ label: "Shop all new", href: "@shop/new" }}
              idPrefix={`sec-${item.id}-view-all`}
              onChange={(next) =>
                patchSectionAt(index, { ...item, viewAll: next })
              }
            />
            <button
              type="button"
              onClick={() =>
                patchSectionAt(index, {
                  ...item,
                  eyebrow: "",
                  title: "",
                  viewAll: null,
                })
              }
              className="font-sans text-xs font-semibold text-primary-blue underline decoration-primary-blue/30 underline-offset-2"
            >
              Products only (hide eyebrow, title &amp; button)
            </button>
            <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
              On a dedicated New arrivals page: enable Show all, hide the labels
              above, and keep titles on a Hero instead. Homepage teasers usually
              keep title + View all linking to{" "}
              <code className="rounded bg-blue-gray/50 px-1">@page:new-arrivals</code>.
            </p>
          </div>
        );
      case "sale":
        return (
          <div className="space-y-3">
            <Field
              label="Eyebrow (optional)"
              id={`sec-${item.id}-eyebrow`}
              value={item.eyebrow}
              placeholder="Sale"
              onChange={(e) =>
                patchSectionAt(index, { ...item, eyebrow: e.target.value })
              }
            />
            <Field
              label="Title (optional)"
              id={`sec-${item.id}-title`}
              value={item.title}
              placeholder="On sale now"
              onChange={(e) =>
                patchSectionAt(index, { ...item, title: e.target.value })
              }
            />
            <TextAreaField
              label="Description (optional)"
              id={`sec-${item.id}-description`}
              value={item.description}
              onChange={(e) =>
                patchSectionAt(index, {
                  ...item,
                  description: e.target.value,
                })
              }
            />
            <ProductLimitField
              id={`sec-${item.id}-limit`}
              limit={item.limit}
              onChange={(next) =>
                patchSectionAt(index, { ...item, limit: next })
              }
              hint="On a dedicated Sale page, enable Show all and hide the labels above."
            />
            <OptionalHeroCtaEditor
              label="View all button"
              link={item.viewAll}
              defaultLink={{ label: "Shop all sale", href: "@shop/sale" }}
              idPrefix={`sec-${item.id}-view-all`}
              onChange={(next) =>
                patchSectionAt(index, { ...item, viewAll: next })
              }
            />
            <button
              type="button"
              onClick={() =>
                patchSectionAt(index, {
                  ...item,
                  eyebrow: "",
                  title: "",
                  description: "",
                  viewAll: null,
                })
              }
              className="font-sans text-xs font-semibold text-primary-blue underline decoration-primary-blue/30 underline-offset-2"
            >
              Products only (hide eyebrow, title, description &amp; button)
            </button>
            <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
              Loads active products that have a compare-at price set in the
              Products panel. Homepage teasers keep title + View all; a dedicated
              Sale page can use Show all + Products only.
            </p>
          </div>
        );
      case "shopByCategory":
        return (
          <div className="space-y-3">
            <Field
              label="Title"
              id={`sec-${item.id}-title`}
              value={item.title}
              onChange={(e) =>
                patchSectionAt(index, { ...item, title: e.target.value })
              }
            />
            <LinkPairEditor
              label="View all link"
              link={item.viewAll}
              idPrefix={`sec-${item.id}-view-all`}
              onChange={(next) =>
                patchSectionAt(index, { ...item, viewAll: next })
              }
            />
            <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
              Leave cards empty to auto-detect categories from products. Or add
              manual cards below.
            </p>
            {item.categories.map((cat, catIndex) => (
              <div
                key={`${item.id}-cat-${catIndex}`}
                className="rounded border border-primary-blue/10 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-blue/45">
                    Category {catIndex + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      patchSectionAt(index, {
                        ...item,
                        categories: item.categories.filter(
                          (_, i) => i !== catIndex,
                        ),
                      })
                    }
                    className="font-sans text-xs font-semibold text-red-700/90"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-2">
                  <Field
                    label="Name"
                    id={`sec-${item.id}-cat-${catIndex}-name`}
                    value={cat.name}
                    onChange={(e) =>
                      patchSectionAt(index, {
                        ...item,
                        categories: item.categories.map((c, i) =>
                          i === catIndex ? { ...c, name: e.target.value } : c,
                        ),
                      })
                    }
                  />
                  <ImageUploadField
                    workspaceId={workspaceId}
                    label="Image"
                    value={cat.imageUrl}
                    onChange={(url) =>
                      patchSectionAt(index, {
                        ...item,
                        categories: item.categories.map((c, i) =>
                          i === catIndex ? { ...c, imageUrl: url } : c,
                        ),
                      })
                    }
                  />
                  <Field
                    label="Link"
                    id={`sec-${item.id}-cat-${catIndex}-href`}
                    value={cat.href}
                    onChange={(e) =>
                      patchSectionAt(index, {
                        ...item,
                        categories: item.categories.map((c, i) =>
                          i === catIndex ? { ...c, href: e.target.value } : c,
                        ),
                      })
                    }
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                patchSectionAt(index, {
                  ...item,
                  categories: [
                    ...item.categories,
                    { name: "New category", imageUrl: "", href: "@shop" },
                  ],
                })
              }
              className="font-sans text-xs font-semibold text-primary-blue underline decoration-primary-blue/30 underline-offset-2"
            >
              Add category card
            </button>
          </div>
        );
      case "testimonials":
        return (
          <div className="space-y-3">
            <Field
              label="Title"
              id={`sec-${item.id}-title`}
              value={item.title}
              onChange={(e) =>
                patchSectionAt(index, { ...item, title: e.target.value })
              }
            />
            {item.items.map((testimonial, tIndex) => (
              <div
                key={`${item.id}-t-${tIndex}`}
                className="rounded border border-primary-blue/10 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-blue/45">
                    Quote {tIndex + 1}
                  </p>
                  <button
                    type="button"
                    disabled={item.items.length <= 1}
                    onClick={() =>
                      patchSectionAt(index, {
                        ...item,
                        items: item.items.filter((_, i) => i !== tIndex),
                      })
                    }
                    className="font-sans text-xs font-semibold text-red-700/90 disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-2">
                  <TextAreaField
                    label="Quote"
                    id={`sec-${item.id}-t-${tIndex}-quote`}
                    value={testimonial.quote}
                    onChange={(e) =>
                      patchSectionAt(index, {
                        ...item,
                        items: item.items.map((t, i) =>
                          i === tIndex ? { ...t, quote: e.target.value } : t,
                        ),
                      })
                    }
                  />
                  <Field
                    label="Name"
                    id={`sec-${item.id}-t-${tIndex}-name`}
                    value={testimonial.name}
                    onChange={(e) =>
                      patchSectionAt(index, {
                        ...item,
                        items: item.items.map((t, i) =>
                          i === tIndex ? { ...t, name: e.target.value } : t,
                        ),
                      })
                    }
                  />
                  <Field
                    label="Role / location"
                    id={`sec-${item.id}-t-${tIndex}-role`}
                    value={testimonial.role}
                    onChange={(e) =>
                      patchSectionAt(index, {
                        ...item,
                        items: item.items.map((t, i) =>
                          i === tIndex ? { ...t, role: e.target.value } : t,
                        ),
                      })
                    }
                  />
                  <ImageUploadField
                    workspaceId={workspaceId}
                    label="Photo"
                    value={testimonial.imageUrl}
                    onChange={(url) =>
                      patchSectionAt(index, {
                        ...item,
                        items: item.items.map((t, i) =>
                          i === tIndex ? { ...t, imageUrl: url } : t,
                        ),
                      })
                    }
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                patchSectionAt(index, {
                  ...item,
                  items: [
                    ...item.items,
                    {
                      quote: "Add a customer quote.",
                      name: "Customer",
                      role: "",
                      imageUrl: "",
                    },
                  ],
                })
              }
              className="font-sans text-xs font-semibold text-primary-blue underline decoration-primary-blue/30 underline-offset-2"
            >
              Add testimonial
            </button>
          </div>
        );
      case "instagramGallery":
        return (
          <div className="space-y-3">
            <Field
              label="Title"
              id={`sec-${item.id}-title`}
              value={item.title}
              onChange={(e) =>
                patchSectionAt(index, { ...item, title: e.target.value })
              }
            />
            <Field
              label="Handle"
              id={`sec-${item.id}-handle`}
              value={item.handle}
              onChange={(e) =>
                patchSectionAt(index, { ...item, handle: e.target.value })
              }
            />
            {item.images.map((image, imageIndex) => (
              <div
                key={`${item.id}-ig-${imageIndex}`}
                className="rounded border border-primary-blue/10 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-blue/45">
                    Image {imageIndex + 1}
                  </p>
                  <button
                    type="button"
                    disabled={item.images.length <= 1}
                    onClick={() =>
                      patchSectionAt(index, {
                        ...item,
                        images: item.images.filter((_, i) => i !== imageIndex),
                      })
                    }
                    className="font-sans text-xs font-semibold text-red-700/90 disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
                <ImageUploadField
                  workspaceId={workspaceId}
                  label="Image"
                  value={image.imageUrl}
                  onChange={(url) =>
                    patchSectionAt(index, {
                      ...item,
                      images: item.images.map((img, i) =>
                        i === imageIndex ? { ...img, imageUrl: url } : img,
                      ),
                    })
                  }
                />
                <div className="mt-2">
                  <Field
                    label="Link"
                    id={`sec-${item.id}-ig-${imageIndex}-href`}
                    value={image.href}
                    onChange={(e) =>
                      patchSectionAt(index, {
                        ...item,
                        images: item.images.map((img, i) =>
                          i === imageIndex
                            ? { ...img, href: e.target.value }
                            : img,
                        ),
                      })
                    }
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                patchSectionAt(index, {
                  ...item,
                  images: [...item.images, { imageUrl: "", href: "#" }],
                })
              }
              className="font-sans text-xs font-semibold text-primary-blue underline decoration-primary-blue/30 underline-offset-2"
            >
              Add image
            </button>
          </div>
        );
      case "newsletter":
        return (
          <div className="space-y-3">
            <Field
              label="Title"
              id={`sec-${item.id}-title`}
              value={item.title}
              onChange={(e) =>
                patchSectionAt(index, { ...item, title: e.target.value })
              }
            />
            <TextAreaField
              label="Body"
              id={`sec-${item.id}-body`}
              value={item.body}
              onChange={(e) =>
                patchSectionAt(index, { ...item, body: e.target.value })
              }
            />
            <Field
              label="Email placeholder"
              id={`sec-${item.id}-placeholder`}
              value={item.placeholder}
              onChange={(e) =>
                patchSectionAt(index, {
                  ...item,
                  placeholder: e.target.value,
                })
              }
            />
            <Field
              label="Button label"
              id={`sec-${item.id}-button`}
              value={item.buttonLabel}
              onChange={(e) =>
                patchSectionAt(index, {
                  ...item,
                  buttonLabel: e.target.value,
                })
              }
            />
            <Field
              label="Success message"
              id={`sec-${item.id}-success`}
              value={item.successMessage}
              onChange={(e) =>
                patchSectionAt(index, {
                  ...item,
                  successMessage: e.target.value,
                })
              }
            />
            <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
              UI only for now — emails are not sent to a backend yet.
            </p>
          </div>
        );
    }
  }

  let body: ReactNode;
  switch (section) {
    case "appearance":
      body = (
        <div className="space-y-6">
          <p className="font-sans text-xs leading-relaxed text-muted-foreground">
            Choose colours and typography for your storefront. Changes show in
            the preview immediately.
          </p>
          <div>
            <p className="mb-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60">
              Brand colour
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                aria-label="Brand accent colour"
                value={normalizeAccentColor(
                  config.accentColor,
                  STOREFRONT_THEME_DEFINITIONS[config.themeId].defaultAccent,
                )}
                onChange={(e) => patchAccentColor(e.target.value)}
                className="h-10 w-14 cursor-pointer border border-primary-blue/15 bg-white p-1"
              />
              <input
                id="sf-accent-color"
                value={config.accentColor}
                onChange={(e) => patchAccentColor(e.target.value)}
                placeholder="#0a2540"
                aria-label="Brand accent hex colour"
                className="max-w-[140px] border border-primary-blue/15 bg-white px-3 py-2 font-mono text-xs text-foreground outline-none focus-visible:border-primary-blue/35 focus-visible:ring-2 focus-visible:ring-primary-blue/15"
              />
            </div>
            <p className="mt-2 font-sans text-[11px] leading-relaxed text-muted-foreground">
              Used for buttons, links, and highlights across the storefront.
            </p>
          </div>
          <div>
            <p className="mb-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60">
              Surface presets
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.values(STOREFRONT_THEME_DEFINITIONS).map((t) => {
                const active = config.themeId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTheme(t.id)}
                    className={`flex flex-col gap-2 border px-3 py-3 text-left transition-colors ${
                      active
                        ? "border-primary-blue bg-primary-blue/[0.04] ring-1 ring-primary-blue/20"
                        : "border-primary-blue/12 bg-white hover:border-primary-blue/25"
                    }`}
                  >
                    <span
                      className="h-8 w-full border border-black/5"
                      style={{ background: t.defaultAccent }}
                      aria-hidden
                    />
                    <span className="font-sans text-sm font-semibold text-primary-blue">
                      {t.label}
                    </span>
                    <span className="font-sans text-[11px] leading-snug text-muted-foreground">
                      {t.vibe}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60">
              Typography
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.values(STOREFRONT_FONT_PAIRS).map((pair) => {
                const active = config.fontPairId === pair.id;
                return (
                  <button
                    key={pair.id}
                    type="button"
                    onClick={() => selectFontPair(pair.id)}
                    className={`border px-3 py-3 text-left transition-colors ${
                      active
                        ? "border-primary-blue bg-primary-blue/[0.04] ring-1 ring-primary-blue/20"
                        : "border-primary-blue/12 bg-white hover:border-primary-blue/25"
                    }`}
                  >
                    <span
                      className="block font-semibold text-primary-blue"
                      style={{ fontFamily: pair.headingFamily }}
                    >
                      {pair.label}
                    </span>
                    <span
                      className="mt-1 block font-sans text-[11px] leading-snug text-muted-foreground"
                      style={{ fontFamily: pair.bodyFamily }}
                    >
                      {pair.vibe}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
      break;
    case "pages":
      body = (
        <div className="space-y-6">
          {!isFocusedSectionEditing ? (
          <>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60">
                Pages
              </p>
              <button
                type="button"
                onClick={addPage}
                className="font-sans text-xs font-semibold text-primary-blue underline decoration-primary-blue/30 underline-offset-2"
              >
                Add page
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedPageId("home")}
                className={`rounded border px-3 py-2 font-sans text-xs font-semibold ${
                  selectedPageId === "home"
                    ? "border-primary-blue bg-primary-blue text-white"
                    : "border-primary-blue/15 bg-white text-primary-blue"
                }`}
              >
                Homepage
              </button>
              {STOREFRONT_COLLECTION_PAGE_META.map((page) => {
                const id = collectionPageSelectionId(page.id);
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setSelectedPageId(id)}
                    className={`rounded border px-3 py-2 font-sans text-xs font-semibold ${
                      selectedPageId === id
                        ? "border-primary-blue bg-primary-blue text-white"
                        : "border-primary-blue/15 bg-white text-primary-blue"
                    }`}
                  >
                    {page.label}
                  </button>
                );
              })}
              {config.pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setSelectedPageId(page.id)}
                  className={`rounded border px-3 py-2 font-sans text-xs font-semibold ${
                    selectedPageId === page.id
                      ? "border-primary-blue bg-primary-blue text-white"
                      : "border-primary-blue/15 bg-white text-primary-blue"
                  }`}
                >
                  {page.title}
                </button>
              ))}
            </div>
          </div>

          {selectedCollectionPage && selectedCollectionPageId ? (
            <div className="rounded border border-primary-blue/10 bg-blue-gray/15 p-3">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60">
                System page
              </p>
              <p className="mt-2 font-sans text-[11px] leading-relaxed text-muted-foreground">
                Banner for{" "}
                <span className="font-medium text-primary-blue/80">
                  {
                    STOREFRONT_COLLECTION_PAGE_META.find(
                      (p) => p.id === selectedCollectionPageId,
                    )?.pathHint
                  }
                </span>
                . Product grid comes from your catalog filters — edit copy and
                image here.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field
                  label="Eyebrow"
                  id={`collection-${selectedCollectionPageId}-eyebrow`}
                  value={selectedCollectionPage.eyebrow}
                  placeholder="Shop"
                  onChange={(e) =>
                    patchCollectionPage(selectedCollectionPageId, {
                      eyebrow: e.target.value,
                    })
                  }
                />
                <Field
                  label="Title"
                  id={`collection-${selectedCollectionPageId}-title`}
                  value={selectedCollectionPage.title}
                  placeholder="All products"
                  onChange={(e) =>
                    patchCollectionPage(selectedCollectionPageId, {
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div className="mt-3">
                <TextAreaField
                  label="Description"
                  id={`collection-${selectedCollectionPageId}-description`}
                  value={selectedCollectionPage.description}
                  placeholder="Browse the full collection…"
                  onChange={(e) =>
                    patchCollectionPage(selectedCollectionPageId, {
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="mt-3">
                <ImageUploadField
                  label="Banner image"
                  workspaceId={workspaceId}
                  value={selectedCollectionPage.imageUrl}
                  onChange={(url) =>
                    patchCollectionPage(selectedCollectionPageId, {
                      imageUrl: url,
                    })
                  }
                />
              </div>

              <div className="mt-4 border-t border-primary-blue/10 pt-3">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60">
                  Catalog filters
                </p>
                <p className="mt-1 font-sans text-[11px] leading-relaxed text-muted-foreground">
                  Only for this page — other shop pages keep their own settings.
                </p>
                <div className="mt-3 space-y-2">
                  {(
                    [
                      ["showSearch", "Search bar"],
                      ["showCollectionTabs", "Collection tabs"],
                      ["showCategoryFilters", "Category filters"],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-2 font-sans text-xs text-primary-blue"
                    >
                      <Checkbox
                        checked={selectedCollectionPage.chrome[key]}
                        onCheckedChange={(checked) =>
                          patchSelectedCollectionChrome({
                            [key]: checked === true,
                          })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {selectedCollectionPage.chrome.showCollectionTabs ? (
                  <div className="mt-3 space-y-2 border-t border-primary-blue/10 pt-3">
                    <p className="font-sans text-[11px] text-muted-foreground">
                      Visible tabs
                    </p>
                    {(
                      [
                        ["tabAll", "All"],
                        ["tabNew", "New arrivals"],
                        ["tabSale", "Sale"],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-2 font-sans text-xs text-primary-blue"
                      >
                        <Checkbox
                          checked={selectedCollectionPage.chrome[key]}
                          onCheckedChange={(checked) =>
                            patchSelectedCollectionChrome({
                              [key]: checked === true,
                            })
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>

              {previewHref ? (
                <Link
                  href={
                    selectedCollectionPageId === "shop"
                      ? `${previewHref}/shop`
                      : `${previewHref}/shop?collection=${selectedCollectionPageId}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex font-sans text-xs font-semibold text-primary-blue underline decoration-primary-blue/30 underline-offset-2"
                >
                  Preview page
                </Link>
              ) : null}
            </div>
          ) : null}

          {selectedPage ? (
            <div className="rounded border border-primary-blue/10 bg-blue-gray/15 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Page title"
                  id={`page-${selectedPage.id}-title`}
                  value={selectedPage.title}
                  placeholder="e.g. Contact us"
                  onChange={(e) => {
                    patchSelectedPage({ title: e.target.value });
                  }}
                />
                <Field
                  label="Page slug"
                  id={`page-${selectedPage.id}-slug`}
                  value={selectedPage.slug}
                  placeholder="contact-us"
                  onChange={(e) =>
                    patchSelectedPage({
                      slug: slugifyPageTitle(e.target.value, selectedPage.slug),
                    })
                  }
                />
              </div>
              <p className="mt-2 font-sans text-[11px] leading-relaxed text-muted-foreground">
                Live preview on the right shows this page. Public URL:{" "}
                <span className="font-medium text-primary-blue/80">
                  /{selectedPage.slug || "…"}
                </span>
              </p>
              {previewHref ? (
                <Link
                  href={`${previewHref}/${selectedPage.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex font-sans text-xs font-semibold text-primary-blue underline decoration-primary-blue/30 underline-offset-2"
                >
                  Preview page
                </Link>
              ) : null}
              <button
                type="button"
                onClick={removeSelectedPage}
                className="ml-4 font-sans text-xs font-semibold text-red-700/90 underline decoration-red-700/25 underline-offset-2"
              >
                Remove page
              </button>
            </div>
          ) : null}

          {!selectedCollectionPageId ? (
          <div className="rounded border border-primary-blue/10 bg-white p-3">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60">
              Section library
            </p>
            <div className="mt-3 grid gap-2">
              {SECTION_LIBRARY.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => addSection(item.type)}
                  className="rounded border border-primary-blue/10 bg-blue-gray/15 p-3 text-left transition-colors hover:bg-blue-gray/35"
                >
                  <span className="block font-sans text-sm font-semibold text-primary-blue">
                    {item.label}
                  </span>
                  <span className="mt-1 block font-sans text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
          ) : null}
          </>
          ) : (
          <div className="rounded border border-primary-blue/10 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60">
                  Editing section
                </p>
                <p className="mt-1 font-sans text-xs text-muted-foreground">
                  Only this selected section is shown here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFocusedSectionId(null)}
                className="rounded border border-primary-blue/15 px-3 py-1.5 font-sans text-xs font-semibold text-primary-blue"
              >
                All sections
              </button>
            </div>
          </div>
          )}

          {!selectedCollectionPageId ? (
          <div>
            <div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60">
                Sections
              </p>
              <p className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground">
                Reorder sections directly on the live storefront preview. Use
                this panel to edit section content.
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {visibleSectionEntries.length === 0 ? (
                <p className="rounded border border-dashed border-primary-blue/20 bg-white px-3 py-4 font-sans text-xs leading-relaxed text-muted-foreground">
                  No sections yet. Add one from the section library above, or use
                  the + buttons on the live preview.
                </p>
              ) : null}
              {visibleSectionEntries.map(({ item, index }) => (
                <div
                  id={`storefront-editor-section-${item.id}`}
                  key={item.id}
                  className={`scroll-mt-4 rounded border bg-blue-gray/15 p-3 transition-colors ${
                    focusedSectionId === item.id
                      ? "border-primary-blue bg-white shadow-sm"
                      : "border-primary-blue/10"
                  }`}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary-blue/10 bg-white/70 p-2">
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-semibold text-primary-blue">
                        {SECTION_LIBRARY.find((s) => s.type === item.type)
                          ?.label ?? item.type}
                      </p>
                      <p className="font-sans text-[10px] uppercase tracking-[0.14em] text-primary-blue/45">
                        Section {index + 1}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSection(index)}
                      className="rounded border border-primary-blue/15 bg-white px-2 py-1 font-sans text-[11px] font-medium text-red-700/90"
                    >
                      Remove
                    </button>
                  </div>
                  {renderSectionLayoutField(item, index)}
                  <div className="mt-3">
                  {renderSectionFields(item, index)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          ) : null}
        </div>
      );
      break;
    case "brand":
      body = (
        <div className="space-y-5">
          <p className="font-sans text-xs leading-relaxed text-muted-foreground">
            Logo, name, and tagline appear in the header. Upload square PNG or
            SVG-friendly images for best results.
          </p>
          <ImageUploadField
            workspaceId={workspaceId}
            label="Logo"
            value={config.logoUrl}
            onChange={(logoUrl) => patch({ logoUrl })}
          />
          <ImageUploadField
            workspaceId={workspaceId}
            label="Favicon (browser tab icon)"
            value={config.faviconUrl}
            onChange={(faviconUrl) => patch({ faviconUrl })}
          />
          <Field
            label="Brand name (header & footer)"
            id="sf-shop-name"
            value={config.shopName}
            onChange={(e) => patch({ shopName: e.target.value })}
          />
          <TextAreaField
            label="Tagline (under logo)"
            id="sf-tagline"
            value={config.tagline}
            onChange={(e) => patch({ tagline: e.target.value })}
          />
          <div className="rounded-md border border-primary-blue/12 bg-blue-gray/20 px-3 py-3">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60">
              Backup & restore
            </p>
            <p className="mt-2 font-sans text-[11px] leading-relaxed text-muted-foreground">
              Download your full storefront look (brand, colours, fonts, pages,
              and sections) as JSON, or import a saved kit into this workspace.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadStorefrontBrandKit(config)}
                className="border border-primary-blue/20 bg-white px-3 py-2 font-sans text-xs font-semibold text-primary-blue transition-colors hover:bg-blue-gray/30"
              >
                Download brand kit
              </button>
              <button
                type="button"
                onClick={() => brandKitImportRef.current?.click()}
                className="border border-primary-blue/20 bg-white px-3 py-2 font-sans text-xs font-semibold text-primary-blue transition-colors hover:bg-blue-gray/30"
              >
                Import brand kit
              </button>
              <input
                ref={brandKitImportRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  void handleBrandKitImport(file);
                }}
              />
            </div>
          </div>
        </div>
      );
      break;
    case "navbar":
      body = (
        <div className="space-y-5">
          <div>
            <p className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nav links
            </p>
            <p className="mb-3 font-sans text-xs text-muted-foreground">
              The active link is highlighted automatically based on the current
              page URL.
            </p>
            <ul className="space-y-3">
              {config.navLinks.map((link, i) => (
                <li key={i}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-sans text-xs font-semibold text-foreground">
                      Nav link {i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moveNavLink(i, -1)}
                        className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        title="Move up"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                          <path d="M8 3l5 6H3l5-6z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={i === config.navLinks.length - 1}
                        onClick={() => moveNavLink(i, 1)}
                        className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        title="Move down"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                          <path d="M8 13l-5-6h10l-5 6z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={config.navLinks.length <= 1}
                        onClick={() => removeNavLink(i)}
                        className="rounded p-1 text-red-500 hover:text-red-600 disabled:opacity-30"
                        title="Remove link"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                          <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <LinkPairEditor
                    label=""
                    link={link}
                    idPrefix={`nav-${i}`}
                    onChange={(next) => patchNav(i, next)}
                  />
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={addNavLink}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 font-sans text-sm text-muted-foreground transition-colors hover:border-primary-blue hover:text-primary-blue"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" d="M8 3v10M3 8h10" />
              </svg>
              Add link
            </button>
          </div>
          <Field
            label="Cart badge (e.g. 0)"
            id="sf-cart"
            value={config.cartCountLabel}
            onChange={(e) => patch({ cartCountLabel: e.target.value })}
          />
        </div>
      );
      break;
    case "hero":
      body = (
        <div className="space-y-4">
          <ImageUploadField
            workspaceId={workspaceId}
            label="Hero background image"
            value={config.heroBackgroundImageUrl}
            onChange={(url) => patch({ heroBackgroundImageUrl: url })}
          />
          <Field
            label="Hero heading"
            id="sf-hero-heading"
            value={config.heroHeading}
            onChange={(e) => patch({ heroHeading: e.target.value })}
          />
          <TextAreaField
            label="Hero subheading"
            id="sf-hero-sub"
            value={config.heroSubheading}
            onChange={(e) => patch({ heroSubheading: e.target.value })}
          />
          <LinkPairEditor
            label="Primary button"
            link={config.heroPrimaryCta}
            idPrefix="hero-pri"
            onChange={(next) => patch({ heroPrimaryCta: next })}
          />
          <LinkPairEditor
            label="Secondary button"
            link={config.heroSecondaryCta}
            idPrefix="hero-sec"
            onChange={(next) => patch({ heroSecondaryCta: next })}
          />
        </div>
      );
      break;
    case "products":
      body = (
        <div className="space-y-3">
          <p className="font-sans text-sm leading-relaxed text-muted-foreground">
            Featured product grids now load from your real catalogue. Manage
            products in the{" "}
            <Link
              href={`/dashboard/${workspaceId}?section=products`}
              className="font-semibold text-primary-blue underline decoration-primary-blue/30 underline-offset-2"
            >
              Products
            </Link>{" "}
            panel. Edit a Featured products section under Pages &amp; sections
            to change its title, limit, and View all link.
          </p>
        </div>
      );
      break;
    case "promos":
      body = (
        <div className="space-y-4">
          {([0, 1] as const).map((idx) => (
            <div
              key={idx}
              className="rounded border border-primary-blue/10 bg-white p-3"
            >
              <p className="mb-2 font-sans text-xs font-semibold text-primary-blue">
                Promo {idx + 1}
              </p>
              <div className="space-y-2">
                <Field
                  label="Title"
                  id={`promo-${idx}-t`}
                  value={config.promos[idx].title}
                  onChange={(e) => patchPromo(idx, { title: e.target.value })}
                />
                <TextAreaField
                  label="Description"
                  id={`promo-${idx}-d`}
                  value={config.promos[idx].description}
                  onChange={(e) =>
                    patchPromo(idx, { description: e.target.value })
                  }
                />
                <Field
                  label="Button label"
                  id={`promo-${idx}-b`}
                  value={config.promos[idx].buttonLabel}
                  onChange={(e) =>
                    patchPromo(idx, { buttonLabel: e.target.value })
                  }
                />
                <ImageUploadField
                  workspaceId={workspaceId}
                  label="Background image"
                  value={config.promos[idx].imageUrl}
                  onChange={(url) => patchPromo(idx, { imageUrl: url })}
                />
                <Field
                  label="Link"
                  id={`promo-${idx}-h`}
                  value={config.promos[idx].href}
                  onChange={(e) => patchPromo(idx, { href: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      );
      break;
    case "values":
      body = (
        <ul className="space-y-4">
          {config.features.map((f, i) => (
            <li
              key={i}
              className="rounded border border-primary-blue/10 bg-blue-gray/15 p-3"
            >
              <div className="mb-2 font-sans text-xs font-semibold text-primary-blue">
                Column {i + 1}
              </div>
              <Field
                label="Title"
                id={`feat-${i}-t`}
                value={f.title}
                onChange={(e) => patchFeature(i, { title: e.target.value })}
              />
              <div className="mt-2">
                <TextAreaField
                  label="Description"
                  id={`feat-${i}-d`}
                  value={f.description}
                  onChange={(e) =>
                    patchFeature(i, { description: e.target.value })
                  }
                />
              </div>
              <div className="mt-2">
                <label
                  htmlFor={`feat-${i}-icon`}
                  className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-blue/60"
                >
                  Icon
                </label>
                <select
                  id={`feat-${i}-icon`}
                  className="w-full border border-primary-blue/15 bg-white px-3 py-2 font-sans text-sm outline-none"
                  value={f.icon}
                  onChange={(e) =>
                    patchFeature(i, {
                      icon: e.target.value as StorefrontFeatureIconId,
                    })
                  }
                >
                  <option value="check">Check</option>
                  <option value="truck">Truck</option>
                  <option value="sparkle">Sparkle</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      );
      break;
    case "footer":
      body = (
        <div className="space-y-4">
          <TextAreaField
            label="Brand blurb (first column)"
            id="sf-foot-blurb"
            value={config.footerBlurb}
            onChange={(e) => patch({ footerBlurb: e.target.value })}
          />
          <Field
            label="Copyright line"
            id="sf-copy"
            value={config.copyrightLine}
            onChange={(e) => patch({ copyrightLine: e.target.value })}
          />
          <Field
            label="WhatsApp number (optional, for future CTAs)"
            id="sf-wa"
            placeholder="+27 …"
            value={config.whatsappNumber}
            onChange={(e) => patch({ whatsappNumber: e.target.value })}
          />
          <p className="pt-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-blue/50">
            Shop links
          </p>
          {config.footerShopLinks.map((l, i) => (
            <LinkPairEditor
              key={i}
              label={`Link ${i + 1}`}
              link={l}
              idPrefix={`fs-${i}`}
              onChange={(next) => patchFooterColumn("footerShopLinks", i, next)}
            />
          ))}
          <p className="pt-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-blue/50">
            Policy links
          </p>
          {config.footerPolicyLinks.map((l, i) => (
            <LinkPairEditor
              key={i}
              label={`Link ${i + 1}`}
              link={l}
              idPrefix={`fp-${i}`}
              onChange={(next) =>
                patchFooterColumn("footerPolicyLinks", i, next)
              }
            />
          ))}
          <p className="pt-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-blue/50">
            Connect links
          </p>
          {config.footerConnectLinks.map((l, i) => (
            <LinkPairEditor
              key={i}
              label={`Link ${i + 1}`}
              link={l}
              idPrefix={`fc-${i}`}
              onChange={(next) =>
                patchFooterColumn("footerConnectLinks", i, next)
              }
            />
          ))}
        </div>
      );
      break;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-10 shrink-0 border-b border-primary-blue/10 bg-white pb-3 pt-1">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-blue/50">
            Settings
          </p>
          {previewHref ? (
            <Link
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 font-sans text-xs font-semibold text-primary-blue underline decoration-primary-blue/30 underline-offset-2 hover:decoration-primary-blue lg:hidden"
            >
              Preview
            </Link>
          ) : null}
        </div>
        <nav aria-label="Storefront settings" className="-mx-1">
          <ul className="flex flex-wrap gap-1">
            {EDITOR_SECTIONS.map(({ id, label }) => {
              const selected = section === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-current={selected ? "page" : undefined}
                    onClick={() => selectSection(id)}
                    className={`rounded-md px-2.5 py-1.5 font-sans text-xs font-semibold transition-colors ${
                      selected
                        ? "bg-primary-blue text-white"
                        : "bg-blue-gray/35 text-primary-blue hover:bg-blue-gray/55"
                    }`}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <p className="mt-2 font-sans text-[11px] text-primary-blue/60">
          Editing {sectionLabel}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 pb-10">
        <h2 className="sr-only">{sectionLabel}</h2>
        {body}
      </div>
    </div>
  );
}
