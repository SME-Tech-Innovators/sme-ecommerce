import { StorefrontSmartLink } from "@/components/storefront/storefront-smart-link";
import type { StorefrontConfig } from "@/types/storefront";

type FreshMarketSiteFooterProps = {
  config: StorefrontConfig;
  workspaceId?: string;
  basePath?: string;
};

export function FreshMarketSiteFooter({
  config,
  workspaceId,
  basePath,
}: FreshMarketSiteFooterProps) {
  return (
    <footer className="border-t border-[color:var(--sf-accent)]/15 bg-[color:var(--sf-footer-bg)] py-12 text-[color:var(--sf-accent)]">
      <div className="mx-auto grid max-w-[100%] gap-10 px-4 @sm/storefront:grid-cols-2 @sm/storefront:px-8 @lg/storefront:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-md">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--sf-accent-text-45)]">
            Fresh market
          </p>
          <p className="mt-2 font-serif text-xl font-semibold tracking-tight">
            {config.shopName}
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-65)]">
            {config.footerBlurb}
          </p>
        </div>
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--sf-accent-text-45)]">
            Shop
          </p>
          <ul className="mt-4 space-y-2 font-sans text-sm">
            {config.footerShopLinks.map((l) => (
              <li key={l.label}>
                <StorefrontSmartLink
                  link={l}
                  workspaceId={workspaceId}
                  basePath={basePath}
                  className="text-[color:var(--sf-accent-text-70)] underline-offset-2 transition-colors hover:text-[color:var(--sf-accent)]"
                />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--sf-accent-text-45)]">
            Help
          </p>
          <ul className="mt-4 space-y-2 font-sans text-sm">
            {[...config.footerPolicyLinks, ...config.footerConnectLinks].map(
              (l) => (
                <li key={l.label}>
                  <StorefrontSmartLink
                    link={l}
                    workspaceId={workspaceId}
                    basePath={basePath}
                    className="text-[color:var(--sf-accent-text-70)] underline-offset-2 transition-colors hover:text-[color:var(--sf-accent)]"
                  />
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-[100%] border-t border-[color:var(--sf-accent)]/10 px-4 pt-6 font-sans text-[11px] text-[color:var(--sf-accent-text-45)] @sm/storefront:px-8">
        {config.copyrightLine}
      </p>
    </footer>
  );
}
