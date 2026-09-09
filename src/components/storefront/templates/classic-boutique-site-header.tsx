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

function NavLink({
  link,
  resolvedHref,
  pathname,
  search,
  className,
}: {
  link: StorefrontLink;
  resolvedHref: string;
  pathname: string;
  search: string;
  className?: string;
}) {
  const active = isStorefrontNavLinkActive(resolvedHref, pathname, search);
  const cls =
    className ??
    `shrink-0 text-sm font-medium transition-colors ${
      active
        ? "border-b-2 border-[color:var(--sf-accent)] pb-0.5 text-[color:var(--sf-accent)]"
        : "text-[color:var(--sf-accent-text-65)] hover:text-[color:var(--sf-accent)]"
    }`;
  return (
    <a href={resolvedHref} className={cls} aria-current={active ? "page" : undefined}>
      {link.label}
    </a>
  );
}

type ClassicBoutiqueSiteHeaderProps = {
  config: StorefrontConfig;
  /** Storefront root, e.g. `/s/my-store` or `/preview/{id}`. Used to resolve magic hrefs. */
  basePath?: string;
  workspaceId?: string;
  /**
   * Force header layout for template previews in a fixed-width frame
   * (media queries still follow the real browser width otherwise).
   */
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

function HeaderNav({
  config,
  basePath,
  workspaceId,
  forceViewport,
}: ClassicBoutiqueSiteHeaderProps) {
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
    <header className="sticky top-0 z-20 border-b border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-header-surface)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[100%] items-center justify-between gap-3 px-4 py-3 @sm/storefront:gap-4 @sm/storefront:px-8 @sm/storefront:py-4">
        <StorefrontBrandMark config={config} variant="classic" />
        {showDesktopNav ? (
          <nav
            className={
              forceViewport === "desktop"
                ? "flex min-w-0 flex-1 items-center justify-center gap-8"
                : "hidden min-w-0 flex-1 items-center justify-center gap-8 @lg/storefront:flex"
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
        <div className="flex shrink-0 items-center text-[color:var(--sf-accent)]">
          <button
            type="button"
            onClick={() => cart?.toggleDrawer()}
            className="relative rounded-full p-2 ring-1 ring-[color:var(--sf-accent-border-15)] transition-colors hover:bg-[color:var(--sf-nav-hover-wash)]"
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
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[color:var(--sf-accent)] px-1 font-sans text-[10px] font-bold text-[color:var(--sf-cart-badge-fg)]">
                {badge}
              </span>
            ) : null}
          </button>
        </div>
      </div>
      {showMobileNav ? (
        <div
          className={
            forceViewport === "mobile"
              ? "border-t border-[color:var(--sf-accent-border-5)]"
              : "border-t border-[color:var(--sf-accent-border-5)] @lg/storefront:hidden"
          }
        >
          <nav
            className="flex gap-5 overflow-x-auto px-4 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Storefront mobile"
          >
            {resolvedLinks.map(({ link, href }, i) => (
              <NavLink
                key={`m-${link.label}-${i}`}
                link={link}
                resolvedHref={href}
                pathname={pathname}
                search={search}
                className={`shrink-0 whitespace-nowrap text-sm font-medium transition-colors ${
                  isStorefrontNavLinkActive(href, pathname, search)
                    ? "border-b-2 border-[color:var(--sf-accent)] pb-0.5 text-[color:var(--sf-accent)]"
                    : "text-[color:var(--sf-accent-text-65)] hover:text-[color:var(--sf-accent)]"
                }`}
              />
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

/** Same top bar as the classic boutique home preview (logo row, desktop nav, mobile nav strip). */
export function ClassicBoutiqueSiteHeader(props: ClassicBoutiqueSiteHeaderProps) {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-20 border-b border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-header-surface)] px-4 py-3 @sm/storefront:px-8 @sm/storefront:py-4">
          <p className="font-sans text-lg font-bold text-[color:var(--sf-accent)]">
            {props.config.shopName}
          </p>
        </header>
      }
    >
      <HeaderNav {...props} />
    </Suspense>
  );
}
