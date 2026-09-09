import {
  buildShopHref,
  type ShopCollectionFilter,
} from "@/lib/preview-shop-href";
import { resolveShopChrome } from "@/lib/storefront-collection-pages";
import { isCatalogueTemplate } from "@/lib/storefront-template-utils";
import {
  shopCollectionCopyForTemplate,
  shopToolbarTitle,
  type ShopCollectionCopy,
} from "@/lib/shop-collection-copy";
import type { StorefrontShopChromeConfig } from "@/types/storefront";

type ShopCollectionToolbarProps = {
  basePath: string;
  collection: ShopCollectionFilter;
  category: string;
  q: string;
  categories: Array<{ name: string; slug: string }>;
  resultCount: number;
  chrome?: StorefrontShopChromeConfig;
  /** Drives All / Just in / Specials vs fashion collection wording. */
  templateId?: string;
  /** Optional override; defaults from `templateId`. */
  copy?: ShopCollectionCopy;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  /** When set, tabs/categories use buttons instead of links (editor preview). */
  onNavigate?: (next: {
    collection: ShopCollectionFilter;
    category?: string;
    q?: string;
  }) => void;
};

export function ShopCollectionToolbar({
  basePath,
  collection,
  category,
  q,
  categories,
  resultCount,
  chrome: chromeRaw,
  templateId,
  copy: copyProp,
  onSearchChange,
  onSearchSubmit,
  onNavigate,
}: ShopCollectionToolbarProps) {
  const chrome = resolveShopChrome(chromeRaw);
  const copy = copyProp ?? shopCollectionCopyForTemplate(templateId);
  const tabs: Array<{
    id: ShopCollectionFilter;
    label: string;
    chromeKey: "tabAll" | "tabNew" | "tabSale";
  }> = [
    { id: "all", label: copy.tabAll, chromeKey: "tabAll" },
    { id: "new", label: copy.tabNew, chromeKey: "tabNew" },
    { id: "sale", label: copy.tabSale, chromeKey: "tabSale" },
  ];
  const visibleTabs = chrome.showCollectionTabs
    ? tabs.filter((tab) => chrome[tab.chromeKey])
    : [];
  const showCategories =
    chrome.showCategoryFilters && categories.length > 0;

  const title = shopToolbarTitle(
    copy,
    collection,
    category,
    categories.find((c) => c.slug === category)?.name,
  );

  const isCatalogue = isCatalogueTemplate(templateId);

  function go(next: {
    collection: ShopCollectionFilter;
    category?: string;
    q?: string;
  }) {
    if (onNavigate) {
      onNavigate(next);
      return;
    }
    window.location.href = buildShopHref(basePath, next);
  }

  return (
    <div className="border-b border-[color:var(--sf-accent-border-10)] pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            className={
              isCatalogue
                ? "font-sans text-2xl font-semibold tracking-tight text-[color:var(--sf-accent)] @sm/storefront:text-3xl"
                : "font-serif text-2xl font-light text-[color:var(--sf-accent)] @sm/storefront:text-3xl"
            }
          >
            {title}
          </h2>
          <p className="mt-1 font-sans text-sm text-[color:var(--sf-accent-text-55)]">
            {resultCount === 0
              ? "No products match"
              : `Showing ${resultCount} ${resultCount === 1 ? "result" : "results"}`}
          </p>
        </div>
        {chrome.showSearch ? (
          <form
            className="flex w-full max-w-sm items-center gap-2 @sm/storefront:w-auto"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit();
            }}
          >
            <label className="sr-only" htmlFor="shop-search">
              Search products
            </label>
            <input
              id="shop-search"
              type="search"
              value={q}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or category…"
              className="w-full border-0 bg-[color:var(--sf-nav-hover-wash)] px-4 py-2.5 font-sans text-sm text-[color:var(--sf-accent)] outline-none placeholder:text-[color:var(--sf-accent-text-45)] focus:ring-2 focus:ring-[color:var(--sf-accent)]/15"
            />
            <button
              type="submit"
              className="shrink-0 bg-[color:var(--sf-accent)] px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.12em] text-white"
            >
              Search
            </button>
          </form>
        ) : null}
      </div>

      {visibleTabs.length > 0 ? (
        <nav
          className="mt-6 flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={copy.filtersAriaLabel}
        >
          {visibleTabs.map((tab) => {
            const active = collection === tab.id && !category;
            const className = `shrink-0 px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
              active
                ? "bg-[color:var(--sf-accent)] text-white"
                : "bg-[color:var(--sf-nav-hover-wash)] text-[color:var(--sf-accent)] hover:bg-[color:var(--sf-accent-border-15)]"
            }`;
            if (onNavigate) {
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  className={className}
                  onClick={() =>
                    go({ collection: tab.id, q: q || undefined })
                  }
                >
                  {tab.label}
                </button>
              );
            }
            return (
              <a
                key={tab.id}
                href={buildShopHref(basePath, {
                  collection: tab.id,
                  q: q || undefined,
                })}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                {tab.label}
              </a>
            );
          })}
        </nav>
      ) : null}

      {showCategories ? (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Categories">
          {onNavigate ? (
            <button
              type="button"
              onClick={() => go({ collection, q: q || undefined })}
              className={`px-3 py-1.5 font-sans text-xs font-semibold transition-colors ${
                !category
                  ? "text-[color:var(--sf-accent)] underline underline-offset-4"
                  : "text-[color:var(--sf-accent-text-55)] hover:text-[color:var(--sf-accent)]"
              }`}
            >
              {copy.allCategories}
            </button>
          ) : (
            <a
              href={buildShopHref(basePath, {
                collection,
                q: q || undefined,
              })}
              className={`px-3 py-1.5 font-sans text-xs font-semibold transition-colors ${
                !category
                  ? "text-[color:var(--sf-accent)] underline underline-offset-4"
                  : "text-[color:var(--sf-accent-text-55)] hover:text-[color:var(--sf-accent)]"
              }`}
            >
              {copy.allCategories}
            </a>
          )}
          {categories.map((cat) => {
            const active = category === cat.slug;
            const className = `px-3 py-1.5 font-sans text-xs font-semibold transition-colors ${
              active
                ? "bg-[color:var(--sf-accent)] text-white"
                : "ring-1 ring-[color:var(--sf-accent-border-15)] text-[color:var(--sf-accent)] hover:bg-[color:var(--sf-nav-hover-wash)]"
            }`;
            if (onNavigate) {
              return (
                <button
                  key={cat.slug}
                  type="button"
                  className={className}
                  onClick={() =>
                    go({
                      collection,
                      category: cat.slug,
                      q: q || undefined,
                    })
                  }
                >
                  {cat.name}
                </button>
              );
            }
            return (
              <a
                key={cat.slug}
                href={buildShopHref(basePath, {
                  collection,
                  category: cat.slug,
                  q: q || undefined,
                })}
                className={className}
              >
                {cat.name}
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
