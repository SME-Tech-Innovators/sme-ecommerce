import { StorefrontOrderTrackingLink } from "@/components/storefront/storefront-order-tracking-link";
import { StorefrontSmartLink } from "@/components/storefront/storefront-smart-link";
import type { StorefrontConfig } from "@/types/storefront";

type ClassicBoutiqueSiteFooterProps = {
  config: StorefrontConfig;
  workspaceId?: string;
  basePath?: string;
};

export function ClassicBoutiqueSiteFooter({
  config,
  workspaceId,
  basePath,
}: ClassicBoutiqueSiteFooterProps) {
  return (
    <footer className="border-t border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-footer-bg)] py-14 text-[color:var(--sf-accent)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:gap-12 @sm/storefront:grid-cols-2 @sm/storefront:px-8 @lg/storefront:grid-cols-4 @lg/storefront:gap-12">
        <div>
          <p className="font-sans text-lg font-bold">{config.shopName}</p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-65)]">
            {config.footerBlurb}
          </p>
        </div>
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--sf-accent-text-45)]">
            Shop
          </p>
          <ul className="mt-4 space-y-2 font-sans text-sm">
            <StorefrontOrderTrackingLink config={config} workspaceId={workspaceId} basePath={basePath} />
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
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--sf-accent-text-45)]">
            Policies
          </p>
          <ul className="mt-4 space-y-2 font-sans text-sm">
            {config.footerPolicyLinks.map((l) => (
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
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--sf-accent-text-45)]">
            Connect
          </p>
          <ul className="mt-4 space-y-2 font-sans text-sm">
            {config.footerConnectLinks.map((l) => (
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
      </div>
      <p className="mx-auto mt-12 max-w-7xl border-t border-[color:var(--sf-accent-border-10)] px-4 pt-8 text-center font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[color:var(--sf-accent-text-45)] sm:px-8">
        {config.copyrightLine}
      </p>
    </footer>
  );
}
