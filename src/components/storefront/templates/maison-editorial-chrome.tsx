import Link from "next/link";
import { StorefrontHeaderCart } from "@/components/storefront/storefront-header-cart";
import { StorefrontSmartLink } from "@/components/storefront/storefront-smart-link";
import { withManageOrderLink } from "@/lib/preview-shop-href";
import { normalizeEditorialSettings } from "@/lib/storefront-editorial";
import type { StorefrontChromeProps } from "@/components/storefront/storefront-chrome";

export function MaisonEditorialSiteHeader({
  config,
  basePath,
  workspaceId,
}: StorefrontChromeProps) {
  const root = basePath ?? (workspaceId ? `/preview/${workspaceId}` : "/");
  return (
    <header className="bg-[color:var(--sf-page-bg)] px-5 text-[color:var(--sf-accent)] @md/storefront:px-10">
      <div className="flex items-center justify-between gap-4 border-b border-current/20 py-3">
        <p className="text-[10px] uppercase tracking-[0.22em]">
          {normalizeEditorialSettings(config.editorial).editionLabel}
        </p>
        <StorefrontHeaderCart config={config} />
      </div>
      <Link
        href={root}
        className="block py-7 text-center font-serif text-[clamp(2.5rem,10cqi,8rem)] leading-none tracking-[-0.06em] break-words"
      >
        {config.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={config.logoUrl}
            alt={config.shopName}
            className="mx-auto max-h-28 max-w-full object-contain"
          />
        ) : (
          config.shopName
        )}
      </Link>
      <nav
        aria-label="Storefront"
        className="flex flex-wrap justify-center gap-x-7 gap-y-3 border-y border-current/20 py-4 text-[11px] uppercase tracking-[0.16em]"
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

export function MaisonEditorialSiteFooter({
  config,
  workspaceId,
  basePath,
}: StorefrontChromeProps) {
  const links = { workspaceId, basePath };
  return (
    <footer className="bg-[color:var(--sf-accent)] px-5 py-12 text-[color:var(--sf-cart-badge-fg)] @md/storefront:px-10">
      <div className="grid gap-10 border-b border-current/25 pb-10 @md/storefront:grid-cols-2">
        <p className="max-w-md font-serif text-3xl leading-snug">
          {config.footerBlurb}
        </p>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <ul className="space-y-3">
            {withManageOrderLink(
              config.footerShopLinks,
              basePath ?? (workspaceId ? `/preview/${workspaceId}` : undefined),
            ).map((link, i) => (
              <li key={i}>
                <StorefrontSmartLink
                  link={link}
                  {...links}
                  className="hover:underline"
                />
              </li>
            ))}
          </ul>
          <ul className="space-y-3">
            {[...config.footerPolicyLinks, ...config.footerConnectLinks].map(
              (link, i) => (
                <li key={i}>
                  <StorefrontSmartLink
                    link={link}
                    {...links}
                    className="hover:underline"
                  />
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
      <p className="py-10 font-serif text-[clamp(3rem,12cqi,10rem)] leading-none tracking-[-0.06em] break-words">
        {config.shopName}
      </p>
      <p className="text-[10px] uppercase tracking-widest">
        {config.copyrightLine}
      </p>
    </footer>
  );
}
