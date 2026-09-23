import { StorefrontSmartLink } from "@/components/storefront/storefront-smart-link";
import { PREVIEW_ORDERS_TRACK_HREF } from "@/lib/preview-shop-href";
import type { StorefrontConfig } from "@/types/storefront";

export function StorefrontOrderTrackingLink({ config, workspaceId, basePath }: {
  config: StorefrontConfig; workspaceId?: string; basePath?: string;
}) {
  const links = [...config.footerShopLinks, ...config.footerPolicyLinks, ...config.footerConnectLinks];
  if (links.some((link) => link.href === PREVIEW_ORDERS_TRACK_HREF || link.href.endsWith("/orders/track"))) return null;
  return <li><StorefrontSmartLink link={{ label: "Track or manage your order", href: PREVIEW_ORDERS_TRACK_HREF }}
    workspaceId={workspaceId} basePath={basePath}
    className="text-[color:var(--sf-accent-text-70)] underline-offset-2 transition-colors hover:text-[color:var(--sf-accent)]" /></li>;
}
