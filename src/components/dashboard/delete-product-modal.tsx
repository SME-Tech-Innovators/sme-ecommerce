"use client";

import { useId } from "react";
import { Modal } from "@modals";

type DeleteProductModalProps = {
  open: boolean;
  productTitle: string;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
};

export function DeleteProductModal({
  open,
  productTitle,
  onClose,
  onConfirm,
  isSubmitting,
}: DeleteProductModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Modal
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      labelledBy={titleId}
      describedBy={descriptionId}
      closeOnBackdropClick={!isSubmitting}
    >
      <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-blue/55">
        Catalogue
      </p>
      <h2
        id={titleId}
        className="mt-3 font-serif text-2xl font-light tracking-tight text-primary-blue sm:text-3xl"
      >
        Delete product?
      </h2>
      <p
        id={descriptionId}
        className="mt-4 font-sans text-sm leading-relaxed text-muted-foreground"
      >
        “{productTitle}” will be archived and hidden from the storefront. You
        can still find it under the Archived filter.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="font-sans text-sm font-medium text-primary-blue underline decoration-primary-blue/30 underline-offset-4 hover:decoration-primary-blue disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="bg-red-700 px-5 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
        >
          {isSubmitting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
