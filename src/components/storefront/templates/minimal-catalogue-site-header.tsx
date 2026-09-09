"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { usePreviewCartOptional } from "@/contexts/preview-cart-context";
import {
  isStorefrontNavLinkActive,
  resolveStorefrontHref,
} from "@/lib/preview-shop-href";
import { StorefrontBrandMark } from "@/components/storefront/storefront-brand-mark";
import type { StorefrontConfig, StorefrontLink } from "@/types/storefront";

type MinimalCatalogueSiteHeaderProps = {
  config: StorefrontConfig;
  basePath?: string;
  workspaceId?: string;
  forceViewport?: "mobile" | "desktop";
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

function NavLink({
  link,
  resolvedHref,
  pathname,
  search,
}: {
  link: StorefrontLink;
  resolvedHref: string;
  pathname: string;
  search: string;
}) {
  const active = isStorefrontNavLinkActive(resolvedHref, pathname, search);
  return (
    <a
      href={resolvedHref}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 whitespace-nowrap font-sans text-[13px] tracking-wide transition-colors ${
        active
          ? "font-semibold text-[color:var(--sf-accent)]"
          : "font-medium text-[color:var(--sf-accent-text-65)] hover:text-[color:var(--sf-accent)]"
      }`}
    >
      {link.label}
    </a>
  );
}

function HeaderNav({
  config,
  basePath,
  workspaceId,
  forceViewport,
}: MinimalCatalogueSiteHeaderProps) {
  const cart = usePreviewCartOptional();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const resolvedBase =
    basePath ?? (workspaceId ? `/preview/${workspaceId}` : undefined);
  const badge = cartBadgeLabel(cart, config.cartCountLabel);
  const resolvedLinks = config.navLinks.map((link) => ({
    link,
    href: resolveStorefrontHref(link, resolvedBase),
  }));
  const showDesktopNav =
    forceViewport === "desktop" || forceViewport == null;
  const showMobileNav =
    forceViewport === "mobile" || forceViewport == null;

  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--sf-accent)]/15 bg-[color:var(--sf-page-bg)]">
      <div className="mx-auto flex max-w-[100%] items-center justify-between gap-4 px-4 py-3.5 @sm/storefront:px-8">
        <StorefrontBrandMark config={config} variant="catalogue" />
        {showDesktopNav ? (
          <nav
            className={
              forceViewport === "desktop"
                ? "flex min-w-0 flex-1 items-center justify-end gap-6 pr-2"
                : "hidden min-w-0 flex-1 items-center justify-end gap-6 pr-2 @lg/storefront:flex"
            }
            aria-label="Storefront"
          >
            {resolvedLinks.map(({ link, href }, i) => (
              <NavLink
                key={`${link.label}-${i}`}
                link={link}
                resolvedHref={href}
                pathname={pathname}
                search={search}
              />
            ))}
          </nav>
        ) : null}
        <button
          type="button"
          onClick={() => cart?.toggleDrawer()}
          className="relative shrink-0 border border-[color:var(--sf-accent)]/20 px-2.5 py-2 text-[color:var(--sf-accent)] transition-colors hover:bg-[color:var(--sf-nav-hover-wash)]"
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
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center bg-[color:var(--sf-accent)] px-1 font-sans text-[10px] font-bold text-[color:var(--sf-cart-badge-fg)]">
              {badge}
            </span>
          ) : null}
        </button>
      </div>
      {showMobileNav ? (
        <div
          className={
            forceViewport === "mobile"
              ? "border-t border-[color:var(--sf-accent)]/10"
              : "border-t border-[color:var(--sf-accent)]/10 @lg/storefront:hidden"
          }
        >
          <nav
            className="flex gap-5 overflow-x-auto px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Storefront mobile"
          >
            {resolvedLinks.map(({ link, href }, i) => (
              <NavLink
                key={`m-${link.label}-${i}`}
                link={link}
                resolvedHref={href}
                pathname={pathname}
                search={search}
              />
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function MinimalCatalogueSiteHeader(
  props: MinimalCatalogueSiteHeaderProps,
) {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-20 border-b border-[color:var(--sf-accent)]/15 bg-[color:var(--sf-page-bg)] px-4 py-3.5 @sm/storefront:px-8">
          <p className="font-sans text-base font-semibold text-[color:var(--sf-accent)]">
            {props.config.shopName}
          </p>
        </header>
      }
    >
      <HeaderNav {...props} />
    </Suspense>
  );
}
