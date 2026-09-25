import Link from "next/link";
import { StorefrontImagePlaceholder } from "@/components/storefront/storefront-image-placeholder";

export type StorefrontProductBadge = "Sale" | "New" | "Sold out";

type StorefrontProductCardProps = {
  title: string;
  priceLabel: string;
  imageUrl: string;
  href?: string;
  category?: string;
  compareAtPriceLabel?: string;
  /** Prefer `badges` when a card can show Sale and/or New. */
  badge?: StorefrontProductBadge | string;
  badges?: StorefrontProductBadge[];
  /** Aspect ratio of the media frame. */
  aspect?: "square" | "portrait";
  /** `catalogue` = denser Minimal Catalogue look. */
  variant?: "default" | "catalogue" | "bookshop";
  showUploadHint?: boolean;
  ctaLabel?: string;
};

function badgeClassName(kind: string, catalogue: boolean): string {
  const key = kind.toLowerCase();
  if (key === "sale") {
    return catalogue
      ? "bg-[color:var(--sf-accent)] text-[color:var(--sf-cart-badge-fg)]"
      : "bg-[color:var(--sf-accent)] text-white";
  }
  if (key === "new") {
    return "bg-white text-[color:var(--sf-accent)] ring-1 ring-[color:var(--sf-accent)]/25";
  }
  if (key === "sold out") {
    return "bg-[color:var(--sf-accent-text-55)] text-white";
  }
  return "bg-[color:var(--sf-accent)] text-white";
}

/**
 * Shared catalogue card — calm retail layout with a hover “View” cue
 * (Darik-inspired, without clutter).
 */
export function StorefrontProductCard({
  title,
  priceLabel,
  imageUrl,
  href,
  category,
  compareAtPriceLabel,
  badge,
  badges,
  aspect = "square",
  variant = "default",
  showUploadHint,
  ctaLabel = "View",
}: StorefrontProductCardProps) {
  const aspectClass =
    aspect === "portrait" ? "aspect-[3/4]" : "aspect-square";
  const isBookshop = variant === "bookshop";
  const isCatalogue = variant === "catalogue";

  const resolvedBadges: string[] = [];
  if (badges?.length) {
    for (const b of badges) {
      if (!resolvedBadges.includes(b)) resolvedBadges.push(b);
    }
  } else if (badge?.trim()) {
    resolvedBadges.push(badge.trim());
  }

  const soldOut = resolvedBadges.some(
    (label) => label.toLowerCase() === "sold out",
  );

  const card = (
    <article className="group flex flex-col">
      <div
        className={`relative ${aspectClass} overflow-hidden bg-[color:var(--sf-card-frame-bg)] ${
          isCatalogue ? "border border-[color:var(--sf-accent)]/10" : ""
        }`}
      >
        {imageUrl.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className={`h-full w-full ${isBookshop ? "object-contain p-3 drop-shadow-lg @md/storefront:p-6" : "object-cover"} ${
              isCatalogue
                ? soldOut
                  ? "opacity-55"
                  : ""
                : `transition-transform duration-500 group-hover:scale-[1.04] ${
                    soldOut ? "opacity-55" : ""
                  }`
            }`}
          />
        ) : (
          <StorefrontImagePlaceholder
            label={title}
            hint={showUploadHint ? "Needs image" : undefined}
          />
        )}
        {resolvedBadges.length > 0 ? (
          <div className="absolute left-2 top-2 z-[1] flex flex-col gap-1">
            {resolvedBadges.map((label) => (
              <span
                key={label}
                className={`px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.12em] ${badgeClassName(label, isCatalogue)}`}
              >
                {isCatalogue
                  ? label === "Sale"
                    ? "Special"
                    : label === "New"
                      ? "Just in"
                      : label === "Sold out"
                        ? "Out of stock"
                        : label
                  : label}
              </span>
            ))}
          </div>
        ) : null}
        {href && !isCatalogue ? (
          <span
            className="pointer-events-none absolute inset-x-3 bottom-3 z-[1] translate-y-2 bg-[color:var(--sf-accent)] px-3 py-2 text-center font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
            aria-hidden
          >
            {soldOut ? "View" : ctaLabel}
          </span>
        ) : null}
      </div>
      <div className={`flex flex-1 flex-col ${isCatalogue ? "mt-2.5" : "mt-3"}`}>
        {category ? (
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--sf-accent-text-45)]">
            {category}
          </p>
        ) : null}
        <h3
          className={`line-clamp-2 font-sans text-[color:var(--sf-accent)] ${
            isCatalogue
              ? `text-sm font-medium ${category ? "mt-0.5" : ""}`
              : `text-[15px] font-semibold ${category ? "mt-1" : ""}`
          }`}
        >
          {title}
        </h3>
        <p
          className={`flex flex-wrap items-baseline gap-2 font-sans ${
            isCatalogue ? "mt-1 text-[15px]" : "mt-1 text-sm"
          }`}
        >
          <span className="font-semibold tabular-nums text-[color:var(--sf-accent)]">
            {priceLabel}
          </span>
          {compareAtPriceLabel?.trim() ? (
            <span className="tabular-nums text-[color:var(--sf-accent-text-45)] line-through">
              {compareAtPriceLabel}
            </span>
          ) : null}
        </p>
      </div>
    </article>
  );

  if (!href) return card;
  return (
    <Link
      href={href}
      className="outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-accent)]/30"
    >
      {card}
    </Link>
  );
}

/** Resolve Sale / New / Sold out badges for shop grids. */
export function shopProductBadges(options: {
  collection: "all" | "sale" | "new";
  onSale?: boolean;
  compareAtPriceLabel?: string | null;
  inStock?: boolean;
}): StorefrontProductBadge[] {
  const badges: StorefrontProductBadge[] = [];
  if (options.inStock === false) {
    badges.push("Sold out");
  }
  const isSale =
    options.onSale === true || Boolean(options.compareAtPriceLabel?.trim());
  if (options.collection === "sale" || isSale) {
    badges.push("Sale");
  }
  if (options.collection === "new") {
    badges.push("New");
  }
  return badges;
}
