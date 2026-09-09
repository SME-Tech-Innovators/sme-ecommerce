"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { StorefrontHeaderCart } from "@/components/storefront/storefront-header-cart";
import {
  isStorefrontNavLinkActive,
  resolveStorefrontHref,
} from "@/lib/preview-shop-href";
import type { StorefrontConfig, StorefrontLink } from "@/types/storefront";

type ArtisanAtelierSiteHeaderProps = {
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
      className={`shrink-0 whitespace-nowrap font-sans text-sm transition-colors ${
        active
          ? "font-medium text-[color:var(--sf-accent)]"
          : "text-[color:var(--sf-accent-text-65)] hover:text-[color:var(--sf-accent)]"
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
}: ArtisanAtelierSiteHeaderProps) {
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
    <header className="sticky top-0 z-20 border-b border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-page-bg)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[100%] items-center justify-between gap-4 px-4 py-4 @sm/storefront:px-8">
        <div className="min-w-0 flex-1 @lg/storefront:hidden">
          <p className="truncate font-serif text-lg font-light text-[color:var(--sf-accent)]">
            {config.shopName}
          </p>
        </div>
        {showDesktopNav ? (
          <nav
            className={
              forceViewport === "desktop"
                ? "flex min-w-0 flex-1 items-center justify-center gap-10"
                : "hidden min-w-0 flex-1 items-center justify-center gap-10 @lg/storefront:flex"
            }
            aria-label="Storefront"
          >
            <p className="font-serif text-xl font-light tracking-tight text-[color:var(--sf-accent)]">
              {config.shopName}
            </p>
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
        <StorefrontHeaderCart config={config} />
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
            className="flex gap-6 overflow-x-auto px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

export function ArtisanAtelierSiteHeader(props: ArtisanAtelierSiteHeaderProps) {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-20 border-b border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-page-bg)] px-4 py-4 @sm/storefront:px-8">
          <p className="text-center font-serif text-lg text-[color:var(--sf-accent)]">
            {props.config.shopName}
          </p>
        </header>
      }
    >
      <HeaderNav {...props} />
    </Suspense>
  );
}
