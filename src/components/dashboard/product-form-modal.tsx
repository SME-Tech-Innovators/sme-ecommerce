"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  AiProductDraftError,
  requestAiProductDraft,
} from "@/apis/ai-product-draft";
import {
  ProductMediaFields,
  type SelectedMedia,
} from "@/components/dashboard/product-media-fields";
import { Checkbox } from "@/components/ui/checkbox";
import {
  loadStoredProductCategories,
  storeProductCategory,
} from "@/lib/product-category-storage";
import { getStoredWorkspace } from "@/lib/workspace-id";
import { Modal } from "@modals";
import type {
  CreateProductBody,
  ProductApi,
  ProductCategory,
  UpdateProductBody,
} from "@/types/product";

export type ProductFormValues = {
  title: string;
  sku: string;
  priceAmount: number;
  quantityAvailable: number;
  /** Was-price in minor units; omit/null when not on sale. */
  compareAtPriceAmount?: number | null;
  clearCompareAtPrice?: boolean;
  currency: string;
  categoryName?: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  mainImageId?: string;
  clearMainImage?: boolean;
  galleryMediaIds?: string[];
  summary?: string;
};

type ProductFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  workspaceId: string;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  categories: ProductCategory[];
  isSubmitting: boolean;
  /** Prefill when editing. */
  product?: ProductApi | null;
};

const STANDARD_CATEGORY_NAMES = [
  "Hair",
  "Food",
  "Clothing",
  "Toy",
  "Beauty",
  "Home",
  "Electronics",
  "Health",
  "Furniture",
  "Books",
  "Sports",
  "Pets",
  "Jewelry",
  "Kids",
  "Accessories",
];
const OTHER_CATEGORY_VALUE = "__other__";

type FormState = {
  title: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  quantityAvailable: string;
  categoryName: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  summary: string;
};

function emptyForm(): FormState {
  return {
    title: "",
    sku: "",
    price: "",
    compareAtPrice: "",
    quantityAvailable: "1",
    categoryName: "",
    status: "DRAFT",
    summary: "",
  };
}

function formatMinorUnits(amount: number): string {
  return (amount / 100).toFixed(2);
}

function parsePriceToMinorUnits(input: string): number | null {
  const cleaned = input.trim().replace(/R\s*/i, "").replace(/,/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

function normalizeStatus(raw: unknown): "DRAFT" | "ACTIVE" | "ARCHIVED" {
  const value = String(raw ?? "DRAFT").toUpperCase();
  if (value === "ACTIVE" || value === "ARCHIVED") return value;
  return "DRAFT";
}

function initialMainImage(product?: ProductApi | null): SelectedMedia | null {
  if (!product) return null;
  if (product.mainImageId && product.imageUrl) {
    return { id: product.mainImageId, url: product.imageUrl };
  }
  if (product.imageUrl) {
    return { id: "", url: product.imageUrl };
  }
  return null;
}

function initialGallery(product?: ProductApi | null): SelectedMedia[] {
  if (!product) return [];
  const ids = product.galleryMediaIds ?? [];
  const urls = product.galleryUrls ?? [];
  if (ids.length === 0) return [];
  return ids.map((id, index) => ({
    id,
    url: urls[index] ?? "",
  }));
}

const fieldClass =
  "w-full border border-primary-blue/15 bg-white px-3 py-2 font-sans text-sm text-foreground outline-none focus-visible:border-primary-blue/35 focus-visible:ring-2 focus-visible:ring-primary-blue/15";

const labelClass =
  "mb-1 block font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-blue/55";

export function productFormToCreateBody(
  values: ProductFormValues,
): CreateProductBody {
  return {
    title: values.title,
    sku: values.sku,
    priceAmount: values.priceAmount,
    quantityAvailable: values.quantityAvailable,
    compareAtPriceAmount: values.compareAtPriceAmount ?? null,
    currency: values.currency,
    status: values.status,
    categoryName: values.categoryName,
    mainImageId: values.mainImageId,
    galleryMediaIds: values.galleryMediaIds,
    summary: values.summary,
  };
}

export function productFormToUpdateBody(
  values: ProductFormValues,
): UpdateProductBody {
  return {
    title: values.title,
    sku: values.sku,
    priceAmount: values.priceAmount,
    quantityAvailable: values.quantityAvailable,
    compareAtPriceAmount: values.clearCompareAtPrice
      ? null
      : values.compareAtPriceAmount,
    clearCompareAtPrice: values.clearCompareAtPrice,
    currency: values.currency,
    status: values.status,
    categoryName: values.categoryName,
    clearCategory: !values.categoryName,
    mainImageId: values.mainImageId,
    clearMainImage: values.clearMainImage,
    galleryMediaIds: values.galleryMediaIds ?? [],
    summary: values.summary ?? "",
  };
}

export function ProductFormModal({
  open,
  mode,
  workspaceId,
  onClose,
  onSubmit,
  categories,
  isSubmitting,
  product,
}: ProductFormModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [mainImage, setMainImage] = useState<SelectedMedia | null>(null);
  const [gallery, setGallery] = useState<SelectedMedia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [customCategorySelected, setCustomCategorySelected] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [storedCategories, setStoredCategories] = useState<ProductCategory[]>(
    [],
  );

  useEffect(() => {
    setStoredCategories(loadStoredProductCategories(workspaceId));
  }, [workspaceId]);

  const selectableCategories = [
    ...categories,
    ...storedCategories,
    ...STANDARD_CATEGORY_NAMES.map((name) => ({
      id: `standard-${name.toLowerCase()}`,
      name,
      slug: name.toLowerCase(),
    })),
  ].filter(
    (category, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.name.toLowerCase() === category.name.toLowerCase(),
      ) === index,
  );

  useEffect(() => {
    if (!open) return;
    setError(null);
    setAiGenerating(false);
    setCustomCategorySelected(false);
    setCategoryMenuOpen(false);
    if (mode === "edit" && product) {
      setForm({
        title: product.title ?? "",
        sku: product.sku ?? "",
        price: formatMinorUnits(Number(product.priceAmount ?? 0)),
        compareAtPrice:
          product.compareAtPriceAmount != null
            ? formatMinorUnits(Number(product.compareAtPriceAmount))
            : "",
        quantityAvailable: String(
          Math.max(0, Math.floor(Number(product.quantityAvailable ?? 0))),
        ),
        categoryName: product.category?.name ?? "",
        status: normalizeStatus(product.status),
        summary: product.summary ?? "",
      });
      setMainImage(initialMainImage(product));
      setGallery(initialGallery(product));
      return;
    }
    setForm({
      ...emptyForm(),
      sku: `SKU-${Date.now().toString().slice(-8)}`,
      categoryName: categories[0]?.name ?? "",
    });
    setMainImage(null);
    setGallery([]);
  }, [open, mode, product, categories]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerateWithAi() {
    const imageUrl = mainImage?.url?.trim() || undefined;
    const titleHint = form.title.trim() || undefined;
    if (!imageUrl && !titleHint && !form.summary.trim()) {
      setError("Add a main image or a title first, then generate with AI.");
      return;
    }

    setError(null);
    setAiGenerating(true);
    try {
      const priceAmount = parsePriceToMinorUnits(form.price) ?? undefined;
      const draft = await requestAiProductDraft({
        titleHint,
        notes: form.summary.trim() || undefined,
        imageUrl,
        priceAmount,
        currency: "ZAR",
        categoryHint: form.categoryName.trim() || undefined,
        categoryNames: selectableCategories.map((c) => c.name),
        businessName: getStoredWorkspace()?.businessName || undefined,
        tone: "adaptive",
      });

      setForm((prev) => {
        const autoSku = /^SKU-\d+$/i.test(prev.sku.trim());
        return {
          ...prev,
          title: draft.title || prev.title,
          summary: draft.summary || prev.summary,
          categoryName:
            draft.suggestedCategoryName?.trim() || prev.categoryName,
          sku:
            draft.skuSuggestion?.trim() &&
            (!prev.sku.trim() || autoSku)
              ? draft.skuSuggestion.trim()
              : prev.sku,
        };
      });
      toast.success("AI draft applied — review before saving.");
    } catch (err) {
      const message =
        err instanceof AiProductDraftError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not generate product copy.";
      setError(message);
      toast.error(message);
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const title = form.title.trim();
    const sku = form.sku.trim();
    if (!title) {
      setError("Title is required.");
      return;
    }
    if (!sku) {
      setError("SKU is required.");
      return;
    }

    const priceAmount = parsePriceToMinorUnits(form.price);
    if (priceAmount == null) {
      setError("Enter a valid price (e.g. 249.00).");
      return;
    }

    const quantityParsed = Number(form.quantityAvailable.trim());
    if (
      !Number.isFinite(quantityParsed) ||
      !Number.isInteger(quantityParsed) ||
      quantityParsed < 0
    ) {
      setError("Stock quantity must be a whole number of 0 or more.");
      return;
    }
    const quantityAvailable = quantityParsed;

    if (customCategorySelected && !form.categoryName.trim()) {
      setError("Enter your custom category name.");
      return;
    }

    const compareRaw = form.compareAtPrice.trim();
    let compareAtPriceAmount: number | null | undefined;
    let clearCompareAtPrice: boolean | undefined;
    if (!compareRaw) {
      compareAtPriceAmount = null;
      clearCompareAtPrice = mode === "edit" ? true : undefined;
    } else {
      const parsedCompare = parsePriceToMinorUnits(compareRaw);
      if (parsedCompare == null) {
        setError("Enter a valid compare-at price (e.g. 299.00).");
        return;
      }
      if (parsedCompare <= priceAmount) {
        setError("Compare-at price must be higher than the selling price.");
        return;
      }
      compareAtPriceAmount = parsedCompare;
    }

    const mainImageId = mainImage?.id?.trim() || undefined;

    const values: ProductFormValues = {
      title,
      sku,
      priceAmount,
      quantityAvailable,
      compareAtPriceAmount,
      clearCompareAtPrice,
      currency: "ZAR",
      status: form.status,
      categoryName: form.categoryName.trim() || undefined,
      mainImageId,
      clearMainImage:
        mode === "edit" && mainImage === null ? true : undefined,
      galleryMediaIds: gallery
        .map((g) => g.id)
        .filter((id) => Boolean(id.trim())),
      summary: form.summary.trim() || undefined,
    };

    if (values.categoryName) {
      const storedCategory = storeProductCategory(
        workspaceId,
        values.categoryName,
      );
      if (storedCategory) {
        setStoredCategories((previous) =>
          previous.some((category) => category.name === storedCategory.name)
            ? previous
            : [...previous, storedCategory],
        );
      }
    }

    try {
      await onSubmit(values);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode === "edit"
            ? "Could not update the product."
            : "Could not create the product.",
      );
    }
  }

  const isEdit = mode === "edit";

  return (
    <Modal
      open={open}
      onClose={isSubmitting || aiGenerating ? () => undefined : onClose}
      labelledBy={titleId}
      describedBy={descriptionId}
      closeOnBackdropClick={!isSubmitting && !aiGenerating}
      panelClassName="max-h-[min(90vh,780px)] max-w-lg overflow-y-auto"
    >
      <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-blue/55">
        Catalogue
      </p>
      <h2
        id={titleId}
        className="mt-3 font-serif text-2xl font-light tracking-tight text-primary-blue sm:text-3xl"
      >
        {isEdit ? "Edit product" : "Add product"}
      </h2>
      <p
        id={descriptionId}
        className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground"
      >
        {isEdit
          ? "Update the product details for your workspace catalogue."
          : "Fill in the basics. Upload images to your workspace media library."}
      </p>

      <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        <ProductMediaFields
          workspaceId={workspaceId}
          mainImage={mainImage}
          gallery={gallery}
          onMainImageChange={setMainImage}
          onGalleryChange={setGallery}
          disabled={isSubmitting || aiGenerating}
        />

        {/* Hidden for the current demo — restore this block to show AI draft again.
        <div className="rounded-md border border-primary-blue/15 bg-blue-gray/40 px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-sans text-sm font-medium text-primary-blue">
                Generate with AI
              </p>
              <p className="mt-0.5 font-sans text-[11px] leading-relaxed text-muted-foreground">
                Upload a main image (or type a title), then draft title, summary,
                and category. Review before saving.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleGenerateWithAi()}
              disabled={isSubmitting || aiGenerating}
              className="shrink-0 bg-primary-blue px-3 py-2 font-sans text-xs font-semibold text-white transition-colors hover:bg-primary-blue/90 disabled:opacity-60"
            >
              {aiGenerating ? "Generating…" : "Generate with AI"}
            </button>
          </div>
        </div>
        */}

        <div>
          <label htmlFor="product-form-title" className={labelClass}>
            Title
          </label>
          <input
            id="product-form-title"
            type="text"
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            disabled={isSubmitting || aiGenerating}
            placeholder="Titanium task light"
            className={fieldClass}
            autoFocus
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-form-sku" className={labelClass}>
              SKU
            </label>
            <input
              id="product-form-sku"
              type="text"
              required
              value={form.sku}
              onChange={(e) => update("sku", e.target.value)}
              disabled={isSubmitting}
              className={`${fieldClass} font-mono text-xs`}
            />
          </div>
          <div>
            <label htmlFor="product-form-price" className={labelClass}>
              Price (ZAR)
            </label>
            <input
              id="product-form-price"
              type="text"
              inputMode="decimal"
              required
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              disabled={isSubmitting}
              placeholder="249.00"
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="product-form-stock" className={labelClass}>
            Stock quantity
          </label>
          <input
            id="product-form-stock"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            required
            value={form.quantityAvailable}
            onChange={(e) => update("quantityAvailable", e.target.value)}
            disabled={isSubmitting}
            placeholder="1"
            className={fieldClass}
          />
          <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-muted-foreground">
            Required. Use 0 for sold out. Checkout refuses quantities above this
            number.
          </p>
        </div>

        <div>
          <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-foreground">
            <Checkbox
              checked={form.compareAtPrice.trim().length > 0}
              onCheckedChange={(checked) => {
                if (checked === true) {
                  const price = parsePriceToMinorUnits(form.price);
                  const suggested =
                    price != null
                      ? formatMinorUnits(Math.round(price * 1.2))
                      : "";
                  update("compareAtPrice", suggested || "");
                } else {
                  update("compareAtPrice", "");
                }
              }}
              disabled={isSubmitting}
            />
            Put on sale
          </label>
          {form.compareAtPrice.trim().length > 0 ? (
            <div className="mt-3">
              <label htmlFor="product-form-compare-at" className={labelClass}>
                Compare-at price (was)
              </label>
              <input
                id="product-form-compare-at"
                type="text"
                inputMode="decimal"
                value={form.compareAtPrice}
                onChange={(e) => update("compareAtPrice", e.target.value)}
                disabled={isSubmitting}
                placeholder="299.00"
                className={fieldClass}
              />
              <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-muted-foreground">
                Must be higher than Price. Shown with strikethrough on the
                storefront.
              </p>
            </div>
          ) : (
            <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-muted-foreground">
              Enable to set a was-price and show this product in Sale sections.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-form-category" className={labelClass}>
              Category
            </label>
            <div className="relative">
              <button
                type="button"
                id="product-form-category"
                aria-haspopup="listbox"
                aria-expanded={categoryMenuOpen}
                onClick={() => setCategoryMenuOpen((open) => !open)}
                disabled={isSubmitting}
                className={`${fieldClass} relative flex items-center justify-between bg-blue-gray/20 pr-10 text-left transition-colors hover:border-primary-blue/25 hover:bg-blue-gray/30 disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="truncate">
                  {customCategorySelected
                    ? form.categoryName || "Other"
                    : form.categoryName || "No category"}
                </span>
              </button>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-blue/55"
                strokeWidth={1.8}
              />
              {categoryMenuOpen ? (
                <div
                  role="listbox"
                  aria-label="Product category"
                  className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-primary-blue/15 bg-white p-1 shadow-lg"
                >
                  {[
                    { id: "none", name: "No category", value: "" },
                    { id: "other", name: "Other", value: OTHER_CATEGORY_VALUE },
                    ...(form.categoryName &&
                    !selectableCategories.some(
                      (category) => category.name === form.categoryName,
                    )
                      ? [
                          {
                            id: "current",
                            name: form.categoryName,
                            value: form.categoryName,
                          },
                        ]
                      : []),
                    ...selectableCategories.map((category) => ({
                      id: category.id,
                      name: category.name,
                      value: category.name,
                    })),
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      role="option"
                      aria-selected={
                        !customCategorySelected && form.categoryName === option.value
                      }
                      onClick={() => {
                        if (option.value === OTHER_CATEGORY_VALUE) {
                          setCustomCategorySelected(true);
                          update("categoryName", "");
                        } else {
                          setCustomCategorySelected(false);
                          update("categoryName", option.value);
                        }
                        setCategoryMenuOpen(false);
                      }}
                      className="block w-full rounded px-3 py-2 text-left font-sans text-sm text-primary-blue transition-colors hover:bg-blue-gray/30 aria-selected:bg-blue-gray/40"
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {customCategorySelected ? (
              <div className="mt-2 rounded-md border border-primary-blue/10 bg-blue-gray/15 p-2">
                <label
                  htmlFor="product-form-custom-category"
                  className="mb-1 block font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-blue/55"
                >
                  Your category name
                </label>
                <input
                  id="product-form-custom-category"
                  type="text"
                  value={form.categoryName}
                  onChange={(e) => update("categoryName", e.target.value)}
                  disabled={isSubmitting}
                  placeholder="e.g. Handmade gifts"
                  className={`${fieldClass} bg-white`}
                  autoFocus
                  required
                />
              </div>
            ) : null}
          </div>
          <div>
            <label htmlFor="product-form-status" className={labelClass}>
              Status
            </label>
            <select
              id="product-form-status"
              value={form.status}
              onChange={(e) =>
                update(
                  "status",
                  e.target.value as "DRAFT" | "ACTIVE" | "ARCHIVED",
                )
              }
              disabled={isSubmitting}
              className={fieldClass}
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="product-form-summary" className={labelClass}>
            Summary
          </label>
          <textarea
            id="product-form-summary"
            rows={3}
            value={form.summary}
            onChange={(e) => update("summary", e.target.value)}
            disabled={isSubmitting || aiGenerating}
            placeholder="Short product description for the storefront."
            className={`${fieldClass} resize-y`}
          />
        </div>

        {error ? (
          <p className="font-sans text-xs text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || aiGenerating}
            className="font-sans text-sm font-medium text-primary-blue underline decoration-primary-blue/30 underline-offset-4 hover:decoration-primary-blue disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || aiGenerating}
            className="bg-primary-blue px-5 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-primary-blue/90 disabled:opacity-60"
          >
            {isSubmitting
              ? isEdit
                ? "Saving…"
                : "Adding…"
              : isEdit
                ? "Save changes"
                : "Add product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
