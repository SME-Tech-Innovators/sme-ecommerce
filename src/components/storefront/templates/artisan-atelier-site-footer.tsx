import { StorefrontSmartLink } from "@/components/storefront/storefront-smart-link";
import type { StorefrontConfig } from "@/types/storefront";

type ArtisanAtelierSiteFooterProps = {
  config: StorefrontConfig;
  workspaceId?: string;
  basePath?: string;
};

export function ArtisanAtelierSiteFooter({
  config,
  workspaceId,
  basePath,
}: ArtisanAtelierSiteFooterProps) {
  return (
    <footer className="border-t border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-footer-bg)] py-16 text-[color:var(--sf-accent)]">
      <div className="mx-auto max-w-5xl px-4 text-center @sm/storefront:px-8">
        <p className="font-serif text-2xl font-light tracking-tight">
          {config.shopName}
        </p>
        <p className="mx-auto mt-4 max-w-lg font-sans text-sm leading-relaxed text-[color:var(--sf-accent-text-65)]">
          {config.footerBlurb}
        </p>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-sans text-sm">
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
        <p className="mt-10 font-sans text-[11px] text-[color:var(--sf-accent-text-45)]">
          {config.copyrightLine}
        </p>
      </div>
    </footer>
  );
}
