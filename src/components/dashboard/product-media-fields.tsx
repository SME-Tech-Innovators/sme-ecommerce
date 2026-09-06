"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { ImagePlus } from "lucide-react";
import { useUploadMedia } from "@/hooks/use-media";

export type SelectedMedia = {
  id: string;
  url: string;
};

type ProductMediaFieldsProps = {
  workspaceId: string;
  mainImage: SelectedMedia | null;
  gallery: SelectedMedia[];
  onMainImageChange: (next: SelectedMedia | null) => void;
  onGalleryChange: (next: SelectedMedia[]) => void;
  disabled?: boolean;
  /** Large drop zone for the AI add-product path. */
  variant?: "default" | "hero";
  showGallery?: boolean;
};

const labelClass =
  "mb-1 block font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-blue/55";

export function ProductMediaFields({
  workspaceId,
  mainImage,
  gallery,
  onMainImageChange,
  onGalleryChange,
  disabled,
  variant = "default",
  showGallery = variant !== "hero",
}: ProductMediaFieldsProps) {
  const mainInputId = useId();
  const galleryInputId = useId();
  const mainInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadMedia(workspaceId);
  const [error, setError] = useState<string | null>(null);
  const [busySlot, setBusySlot] = useState<"main" | "gallery" | null>(null);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!zoomUrl) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomUrl(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomUrl]);

  async function handleFile(
    file: File | undefined,
    slot: "main" | "gallery",
  ) {
    if (!file) return;
    setError(null);
    setBusySlot(slot);
    try {
      const media = await upload.mutateAsync(file);
      const selected = { id: media.id, url: media.url };
      if (slot === "main") {
        onMainImageChange(selected);
      } else {
        onGalleryChange([...gallery, selected]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
    } finally {
      setBusySlot(null);
    }
  }

  const isBusy = busySlot != null || upload.isPending;
  const isHero = variant === "hero";

  function openMainPicker() {
    if (disabled || isBusy) return;
    mainInputRef.current?.click();
  }

  function handleDragOver(e: DragEvent<HTMLButtonElement>) {
    if (disabled || isBusy) return;
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isBusy) return;
    const file = e.dataTransfer.files?.[0];
    void handleFile(file, "main");
  }

  const mainFileInput = (
    <input
      ref={mainInputRef}
      id={mainInputId}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="sr-only"
      disabled={disabled || isBusy}
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        void handleFile(file, "main");
      }}
    />
  );

  return (
    <div className="space-y-4">
      {isHero ? (
        <div>
          {mainFileInput}
          <button
            type="button"
            disabled={disabled || isBusy}
            onClick={() => {
              if (mainImage?.url) {
                setZoomUrl(mainImage.url);
                return;
              }
              openMainPicker();
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex min-h-[240px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition ${
              isDragging
                ? "border-primary-blue bg-primary-blue/5"
                : "border-primary-blue/20 bg-blue-gray/30 hover:border-primary-blue/40 hover:bg-blue-gray/50"
            } disabled:cursor-not-allowed disabled:opacity-70`}
            aria-label={
              mainImage?.url ? "Zoom main image" : "Upload a product photo"
            }
          >
            {mainImage?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImage.url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="px-6 py-10 text-center">
                <ImagePlus
                  className="mx-auto size-8 text-primary-blue/50"
                  aria-hidden
                />
                <p className="mt-3 font-sans text-sm font-semibold text-primary-blue">
                  {busySlot === "main"
                    ? "Uploading photo…"
                    : "Drop a product photo here"}
                </p>
                <p className="mt-1.5 font-sans text-[12px] text-muted-foreground">
                  or click to browse · JPEG, PNG, or WebP · max 5 MB
                </p>
              </div>
            )}
          </button>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={disabled || isBusy}
              onClick={openMainPicker}
              className="border border-primary-blue/20 bg-white px-3 py-1.5 font-sans text-xs font-semibold text-primary-blue transition-colors hover:bg-blue-gray/30 disabled:opacity-50"
            >
              {busySlot === "main"
                ? "Uploading…"
                : mainImage
                  ? "Change photo"
                  : "Upload photo"}
            </button>
            {mainImage ? (
              <button
                type="button"
                disabled={disabled || isBusy}
                onClick={() => onMainImageChange(null)}
                className="font-sans text-xs font-semibold text-red-700 underline-offset-2 hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            ) : null}
            {mainImage?.url ? (
              <p className="font-sans text-[11px] text-muted-foreground">
                Click the photo to zoom
              </p>
            ) : null}
          </div>
        </div>
      ) : (
      <div>
        <span className={labelClass}>Main image</span>
        <div className="mt-1 flex items-start gap-3">
          <button
            type="button"
            disabled={!mainImage?.url}
            onClick={() => {
              if (mainImage?.url) setZoomUrl(mainImage.url);
            }}
            className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-primary-blue/15 bg-blue-gray/30 transition hover:border-primary-blue/35 disabled:cursor-default"
            title={mainImage?.url ? "Click to zoom" : undefined}
            aria-label={mainImage?.url ? "Zoom main image" : "No main image"}
          >
            {mainImage?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImage.url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </button>
          <div className="min-w-0 flex-1 space-y-2">
            {mainFileInput}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={disabled || isBusy}
                onClick={() => mainInputRef.current?.click()}
                className="border border-primary-blue/20 bg-white px-3 py-1.5 font-sans text-xs font-semibold text-primary-blue transition-colors hover:bg-blue-gray/30 disabled:opacity-50"
              >
                {busySlot === "main" ? "Uploading…" : "Upload image"}
              </button>
              {mainImage ? (
                <button
                  type="button"
                  disabled={disabled || isBusy}
                  onClick={() => onMainImageChange(null)}
                  className="font-sans text-xs font-semibold text-red-700 underline-offset-2 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <p className="font-sans text-[11px] text-muted-foreground">
              JPEG, PNG, or WebP · max 5 MB
              {mainImage?.url ? " · click image to zoom" : ""}
            </p>
          </div>
        </div>
      </div>
      )}

      {showGallery ? (
        <div>
          <span className={labelClass}>Gallery</span>
          {gallery.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {gallery.map((item) => (
                <li
                  key={item.id}
                  className="relative h-16 w-16 overflow-hidden rounded-md border border-primary-blue/15 bg-blue-gray/30"
                >
                  <button
                    type="button"
                    className="absolute inset-0"
                    aria-label="Zoom gallery image"
                    title="Click to zoom"
                    onClick={() => setZoomUrl(item.url)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    disabled={disabled || isBusy}
                    aria-label="Remove gallery image"
                    onClick={() =>
                      onGalleryChange(gallery.filter((g) => g.id !== item.id))
                    }
                    className="absolute inset-x-0 bottom-0 z-10 bg-black/55 py-0.5 font-sans text-[10px] font-semibold text-white"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <input
            ref={galleryInputRef}
            id={galleryInputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={disabled || isBusy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void handleFile(file, "gallery");
            }}
          />
          <button
            type="button"
            disabled={disabled || isBusy}
            onClick={() => galleryInputRef.current?.click()}
            className="mt-2 border border-primary-blue/20 bg-white px-3 py-1.5 font-sans text-xs font-semibold text-primary-blue transition-colors hover:bg-blue-gray/30 disabled:opacity-50"
          >
            {busySlot === "gallery" ? "Uploading…" : "Add gallery image"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="font-sans text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {zoomUrl ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image zoom"
          onClick={() => setZoomUrl(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 font-sans text-sm font-semibold text-white"
            onClick={() => setZoomUrl(null)}
          >
            Close
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomUrl}
            alt="Zoomed product"
            className="max-h-[min(90vh,900px)] max-w-[min(96vw,900px)] rounded-md object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
