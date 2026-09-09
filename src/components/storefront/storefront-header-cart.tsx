"use client";

import { usePreviewCartOptional } from "@/contexts/preview-cart-context";
import type { StorefrontConfig } from "@/types/storefront";

type StorefrontHeaderCartProps = {
  config: StorefrontConfig;
  /** Light icon on dark header backgrounds. */
  variant?: "default" | "inverse";
};

function cartBadgeLabel(
  cart: ReturnType<typeof usePreviewCartOptional>,
  fallbackLabel: string,
): string | null {
  if (cart) {
    if (cart.itemCount <= 0) return null;
    return cart.itemCount > 99 ? "99+" : String(cart.itemCount);
  }
  const t = fallbackLabel.trim();
  return t || null;
}

export function StorefrontHeaderCart({
  config,
  variant = "default",
}: StorefrontHeaderCartProps) {
  const cart = usePreviewCartOptional();
  const badge = cartBadgeLabel(cart, config.cartCountLabel);
  const inverse = variant === "inverse";

  return (
    <button
      type="button"
      onClick={() => cart?.toggleDrawer()}
      className={`relative rounded-full p-2 transition-colors ${
        inverse
          ? "text-white ring-1 ring-white/25 hover:bg-white/10"
          : "text-[color:var(--sf-accent)] ring-1 ring-[color:var(--sf-accent-border-15)] hover:bg-[color:var(--sf-nav-hover-wash)]"
      }`}
      aria-label={cart ? "Open shopping cart" : "Cart"}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9h12"
        />
      </svg>
      {badge ? (
        <span
          className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 font-sans text-[10px] font-bold ${
            inverse
              ? "bg-white text-[color:var(--sf-accent)]"
              : "bg-[color:var(--sf-accent)] text-[color:var(--sf-cart-badge-fg)]"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
