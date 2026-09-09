import { StorefrontSmartLink } from "@/components/storefront/storefront-smart-link";
import type { StorefrontConfig } from "@/types/storefront";

type UrbanEdgeSiteFooterProps = {
  config: StorefrontConfig;
  workspaceId?: string;
  basePath?: string;
};

export function UrbanEdgeSiteFooter({
  config,
  workspaceId,
  basePath,
}: UrbanEdgeSiteFooterProps) {
  return (
    <footer className="border-t-4 border-[color:var(--sf-accent)] bg-[color:var(--sf-footer-bg)] py-14 text-[color:var(--sf-accent)]">
      <div className="mx-auto grid max-w-[100%] gap-10 px-4 @sm/storefront:grid-cols-2 @sm/storefront:px-8 @lg/storefront:grid-cols-4">
        <div className="max-w-sm @lg/storefront:col-span-2">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.22em]">
            {config.shopName}
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-65)]">
            {config.footerBlurb}
          </p>
        </div>
        <div>
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--sf-accent-text-45)]">
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
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--sf-accent-text-45)]">
            Info
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
      <p className="mx-auto mt-12 max-w-[100%] border-t border-[color:var(--sf-accent-border-10)] px-4 pt-8 text-center font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--sf-accent-text-45)] @sm/storefront:px-8">
        {config.copyrightLine}
      </p>
    </footer>
  );
}
