import Link from "next/link";
import { BookOpen } from "lucide-react";
import { StorefrontHeaderCart } from "@/components/storefront/storefront-header-cart";
import { StorefrontSmartLink } from "@/components/storefront/storefront-smart-link";
import { withManageOrderLink } from "@/lib/preview-shop-href";
import type { StorefrontChromeProps } from "@/components/storefront/storefront-chrome";

export function ChapterBookshopSiteHeader({
  config,
  basePath,
  workspaceId,
}: StorefrontChromeProps) {
  const root = basePath ?? (workspaceId ? `/preview/${workspaceId}` : "/");
  return (
    <header className="border-b border-current/15 bg-[color:var(--sf-page-bg)] text-[color:var(--sf-accent)]">
      {config.tagline && (
        <p className="bg-[color:var(--sf-accent)] px-5 py-2 text-center text-xs tracking-wide text-[color:var(--sf-cart-badge-fg)]">
          {config.tagline}
        </p>
      )}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-6 @md/storefront:px-10">
        <Link
          href={root}
          className="flex min-w-0 items-center gap-3 font-serif text-3xl"
        >
          {config.logoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.logoUrl}
                alt={config.shopName}
                className="max-h-14 max-w-52 object-contain"
              />
            </>
          ) : (
            <>
              <BookOpen aria-hidden className="shrink-0" />
              <span className="break-words">{config.shopName}</span>
            </>
          )}
        </Link>
        <StorefrontHeaderCart config={config} />
      </div>
      <form
        action={`${root}/shop`}
        method="get"
        role="search"
        aria-label="Search books"
        className="mx-auto flex max-w-7xl gap-2 px-5 pb-5 @md/storefront:px-10"
      >
        <label className="sr-only" htmlFor="chapter-book-search">
          Search books
        </label>
        <input
          id="chapter-book-search"
          name="q"
          type="search"
          placeholder="Find your next read…"
          className="min-w-0 flex-1 rounded-sm border border-current/25 bg-transparent px-4 py-2 text-sm outline-offset-4"
        />
        <button
          className="rounded-sm bg-[color:var(--sf-accent)] px-5 py-2 text-sm text-[color:var(--sf-cart-badge-fg)]"
          type="submit"
        >
          Search
        </button>
      </form>
      <nav
        aria-label="Storefront"
        className="mx-auto flex max-w-7xl flex-wrap gap-x-7 gap-y-3 px-5 pb-5 text-sm @md/storefront:px-10"
      >
        {withManageOrderLink(config.navLinks, root).map((link, i) => (
          <StorefrontSmartLink
            key={i}
            link={link}
            basePath={root}
            className="underline-offset-4 hover:underline"
          />
        ))}
      </nav>
    </header>
  );
}

export function ChapterBookshopSiteFooter({
  config,
  workspaceId,
  basePath,
}: StorefrontChromeProps) {
  const root =
    basePath ?? (workspaceId ? `/preview/${workspaceId}` : undefined);
  return (
    <footer className="border-t-4 border-double border-[color:var(--sf-accent-border-15)] bg-[color:var(--sf-promo-section-bg)] px-5 py-12 text-[color:var(--sf-accent)] @md/storefront:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 @md/storefront:grid-cols-2">
        <div>
          <BookOpen aria-hidden className="mb-5 h-8 w-8" />
          <p className="font-serif text-4xl">{config.shopName}</p>
          <p className="mt-4 max-w-sm text-sm leading-7">
            {config.footerBlurb}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <ul className="space-y-4">
            {withManageOrderLink(config.footerShopLinks, root).map(
              (link, i) => (
                <li key={i}>
                  <StorefrontSmartLink
                    link={link}
                    basePath={root}
                    className="hover:underline"
                  />
                </li>
              ),
            )}
          </ul>
          <ul className="space-y-4">
            {[...config.footerPolicyLinks, ...config.footerConnectLinks].map(
              (link, i) => (
                <li key={i}>
                  <StorefrontSmartLink
                    link={link}
                    basePath={root}
                    className="hover:underline"
                  />
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-7xl border-t border-current/15 pt-5 text-xs">
        {config.copyrightLine}
      </p>
    </footer>
  );
}
