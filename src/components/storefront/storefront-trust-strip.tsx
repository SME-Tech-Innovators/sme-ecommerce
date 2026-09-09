import { isCatalogueTemplate } from "@/lib/storefront-template-utils";

type TrustItem = {
  title: string;
  description: string;
};

const DEFAULT_TRUST: TrustItem[] = [
  {
    title: "Free shipping & returns",
    description: "Easy online returns on eligible orders.",
  },
  {
    title: "Secure checkout",
    description: "Card payments are encrypted and secure.",
  },
  {
    title: "Helpful support",
    description: "Message us anytime — we reply fast.",
  },
];

const CATALOGUE_TRUST: TrustItem[] = [
  {
    title: "Straightforward ordering",
    description: "Browse, add to cart, and pay online.",
  },
  {
    title: "Stock you can trust",
    description: "Live quantities before you check out.",
  },
  {
    title: "Secure payments",
    description: "Card checkout handled safely.",
  },
];

type StorefrontTrustStripProps = {
  items?: TrustItem[];
  /** When `minimal-catalogue`, use goods-friendly trust copy. */
  templateId?: string;
  className?: string;
};

/** Compact Darik-style trust row for shop / home — one job, no mega-footer. */
export function StorefrontTrustStrip({
  items,
  templateId,
  className = "",
}: StorefrontTrustStripProps) {
  const defaults =
    isCatalogueTemplate(templateId) ? CATALOGUE_TRUST : DEFAULT_TRUST;
  const row = (items ?? defaults).slice(0, 3);
  return (
    <section
      className={`border-y border-[color:var(--sf-accent-border-10)] bg-[color:var(--sf-values-section-bg)] ${className}`}
      aria-label="Shopping assurances"
    >
      <ul className="mx-auto grid max-w-[100%] gap-6 px-4 py-6 @md/storefront:grid-cols-3 @md/storefront:gap-8 @md/storefront:px-8 @md/storefront:py-7">
        {row.map((item) => (
          <li key={item.title} className="text-center @md/storefront:text-left">
            <p className="font-sans text-sm font-bold text-[color:var(--sf-accent)]">
              {item.title}
            </p>
            <p className="mt-1 font-sans text-xs leading-relaxed text-[color:var(--sf-accent-text-55)] @md/storefront:text-sm">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
