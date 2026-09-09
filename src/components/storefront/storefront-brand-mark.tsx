import type { StorefrontConfig } from "@/types/storefront";

type StorefrontBrandMarkProps = {
  config: StorefrontConfig;
  /** Minimal catalogue shows a smaller text block when no logo is set. */
  variant?: "classic" | "catalogue";
};

export function StorefrontBrandMark({
  config,
  variant = "classic",
}: StorefrontBrandMarkProps) {
  const logoUrl = config.logoUrl?.trim();
  const shopName = config.shopName?.trim() || "Your shop";
  const tagline = config.tagline?.trim();

  if (logoUrl) {
    return (
      <div className="min-w-0 shrink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={shopName}
          className={
            variant === "catalogue"
              ? "h-9 max-w-[160px] object-contain object-left @sm/storefront:h-10 @sm/storefront:max-w-[200px]"
              : "h-10 max-w-[180px] object-contain object-left @sm/storefront:h-11 @sm/storefront:max-w-[220px]"
          }
        />
        {tagline ? (
          <p
            className={
              variant === "catalogue"
                ? "mt-1 hidden truncate font-sans text-[11px] text-[color:var(--sf-accent-text-45)] @sm/storefront:block"
                : "mt-1 hidden truncate font-sans text-[11px] text-[color:var(--sf-accent-text-45)] @sm/storefront:block @sm/storefront:text-xs"
            }
            style={{ fontFamily: "var(--sf-font-body)" }}
          >
            {tagline}
          </p>
        ) : null}
      </div>
    );
  }

  if (variant === "catalogue") {
    return (
      <div className="min-w-0">
        <p
          className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--sf-accent-text-45)]"
          style={{ fontFamily: "var(--sf-font-body)" }}
        >
          Store
        </p>
        <p
          className="truncate font-sans text-base font-semibold tracking-tight text-[color:var(--sf-accent)] @sm/storefront:text-lg"
          style={{ fontFamily: "var(--sf-font-heading)" }}
        >
          {shopName}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 shrink">
      <p
        className="truncate font-sans text-lg font-bold tracking-tight text-[color:var(--sf-accent)] @sm/storefront:text-xl"
        style={{ fontFamily: "var(--sf-font-heading)" }}
      >
        {shopName}
      </p>
      {tagline ? (
        <p
          className="hidden truncate font-sans text-[11px] text-[color:var(--sf-accent-text-45)] @sm/storefront:block @sm/storefront:text-xs"
          style={{ fontFamily: "var(--sf-font-body)" }}
        >
          {tagline}
        </p>
      ) : null}
    </div>
  );
}
