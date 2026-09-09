"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { StorefrontHeaderCart } from "@/components/storefront/storefront-header-cart";
import {
  isStorefrontNavLinkActive,
  resolveStorefrontHref,
} from "@/lib/preview-shop-href";
import type { StorefrontConfig, StorefrontLink } from "@/types/storefront";

type UrbanEdgeSiteHeaderProps = {
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
      className={`shrink-0 whitespace-nowrap font-sans text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors ${
        active
          ? "text-white"
          : "text-white/70 hover:text-white"
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
}: UrbanEdgeSiteHeaderProps) {
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

  return (
    <header className="sticky top-0 z-20 bg-[color:var(--sf-accent)] text-white shadow-md">
      <div className="mx-auto flex max-w-[100%] items-center justify-between gap-4 px-4 py-3.5 @sm/storefront:px-8">
        <div className="min-w-0 shrink">
          <p className="truncate font-sans text-sm font-bold uppercase tracking-[0.24em] @sm/storefront:text-base">
            {config.shopName}
          </p>
          {config.tagline?.trim() ? (
            <p className="mt-0.5 hidden truncate font-sans text-[11px] text-white/65 @sm/storefront:block">
              {config.tagline}
            </p>
          ) : null}
        </div>
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
        <StorefrontHeaderCart config={config} variant="inverse" />
      </div>
      {showMobileNav ? (
        <div
          className={
            forceViewport === "mobile"
              ? "border-t border-white/15"
              : "border-t border-white/15 @lg/storefront:hidden"
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

export function UrbanEdgeSiteHeader(props: UrbanEdgeSiteHeaderProps) {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-20 bg-[color:var(--sf-accent)] px-4 py-3.5 text-white @sm/storefront:px-8">
          <p className="font-sans text-sm font-bold uppercase tracking-[0.24em]">
            {props.config.shopName}
          </p>
        </header>
      }
    >
      <HeaderNav {...props} />
    </Suspense>
  );
}
