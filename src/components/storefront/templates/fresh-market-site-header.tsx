"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { StorefrontHeaderCart } from "@/components/storefront/storefront-header-cart";
import {
  isStorefrontNavLinkActive,
  resolveStorefrontHref,
} from "@/lib/preview-shop-href";
import type { StorefrontConfig, StorefrontLink } from "@/types/storefront";

type FreshMarketSiteHeaderProps = {
  config: StorefrontConfig;
  basePath?: string;
  workspaceId?: string;
  forceViewport?: "mobile" | "desktop";
};

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
}: FreshMarketSiteHeaderProps) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const resolvedBase =
    basePath ?? (workspaceId ? `/preview/${workspaceId}` : undefined);
  const resolvedLinks = config.navLinks.map((link) => ({
    link,
    href: resolveStorefrontHref(link, resolvedBase),
  }));
  const showDesktopNav =
    forceViewport === "desktop" || forceViewport == null;
  const showMobileNav =
    forceViewport === "mobile" || forceViewport == null;
  const tagline = config.tagline?.trim();

  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--sf-accent)]/15 bg-[color:var(--sf-page-bg)]">
      {tagline ? (
        <div className="bg-[color:var(--sf-accent)] px-4 py-1.5 text-center font-sans text-[11px] font-medium tracking-wide text-[color:var(--sf-cart-badge-fg)]">
          {tagline}
        </div>
      ) : null}
      <div className="mx-auto flex max-w-[100%] items-center justify-between gap-3 px-4 py-3 @sm/storefront:px-8">
        <div className="w-10 shrink-0 @sm/storefront:w-12" aria-hidden />
        <div className="min-w-0 flex-1 text-center">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--sf-accent-text-45)]">
            Fresh market
          </p>
          <p className="truncate font-serif text-xl font-semibold tracking-tight text-[color:var(--sf-accent)] @sm/storefront:text-2xl">
            {config.shopName}
          </p>
        </div>
        <div className="flex w-10 shrink-0 justify-end @sm/storefront:w-12">
          <StorefrontHeaderCart config={config} />
        </div>
      </div>
      {showDesktopNav ? (
        <nav
          className={
            forceViewport === "desktop"
              ? "flex justify-center gap-8 border-t border-[color:var(--sf-accent)]/10 px-4 py-2.5"
              : "hidden justify-center gap-8 border-t border-[color:var(--sf-accent)]/10 px-4 py-2.5 @lg/storefront:flex"
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

export function FreshMarketSiteHeader(props: FreshMarketSiteHeaderProps) {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-20 border-b border-[color:var(--sf-accent)]/15 bg-[color:var(--sf-page-bg)] px-4 py-3">
          <p className="text-center font-serif text-xl font-semibold text-[color:var(--sf-accent)]">
            {props.config.shopName}
          </p>
        </header>
      }
    >
      <HeaderNav {...props} />
    </Suspense>
  );
}
