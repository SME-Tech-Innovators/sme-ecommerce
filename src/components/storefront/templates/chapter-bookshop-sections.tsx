import { BookOpen, Bookmark, Library } from "lucide-react";
import { StorefrontSmartLink } from "@/components/storefront/storefront-smart-link";
import { StorefrontImagePlaceholder } from "@/components/storefront/storefront-image-placeholder";
import type { StorefrontConfig, StorefrontSection } from "@/types/storefront";

const button =
  "inline-block rounded-sm border border-current px-5 py-3 text-sm transition-opacity hover:opacity-70";
function BookImage({ src }: { src: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-full w-full object-cover" />
  ) : (
    <StorefrontImagePlaceholder />
  );
}
export function ChapterBookshopSection({
  section,
  config,
  workspaceId,
  basePath,
}: {
  section: StorefrontSection;
  config: StorefrontConfig;
  workspaceId?: string;
  basePath?: string;
}) {
  const links = { workspaceId, basePath };
  switch (section.type) {
    case "hero":
      return (
        <section
          aria-labelledby={`${section.id}-heading`}
          className="bg-[color:var(--sf-promo-section-bg)] px-5 py-12 text-[color:var(--sf-accent)] @md/storefront:px-10 @md/storefront:py-16"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 @md/storefront:grid-cols-2">
            <div>
              <p className="mb-5 flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
                <Bookmark aria-hidden size={16} />
                {config.tagline}
              </p>
              <h1
                id={`${section.id}-heading`}
                className="font-serif text-[clamp(2.8rem,6cqi,5.5rem)] leading-[1.05] tracking-tight whitespace-pre-line"
              >
                {section.heading}
              </h1>
              <p className="mt-6 max-w-lg text-base leading-8">
                {section.subheading}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                {section.primaryCta && (
                  <StorefrontSmartLink
                    link={section.primaryCta}
                    {...links}
                    className={`${button} bg-[color:var(--sf-accent)] text-[color:var(--sf-cart-badge-fg)]`}
                  />
                )}
                {section.secondaryCta && (
                  <StorefrontSmartLink
                    link={section.secondaryCta}
                    {...links}
                    className={button}
                  />
                )}
              </div>
            </div>
            <div className="aspect-[5/4] overflow-hidden rounded-t-[45%] border-8 border-[color:var(--sf-page-bg)] shadow-lg">
              <BookImage src={section.imageUrl} />
            </div>
          </div>
        </section>
      );
    case "textImage":
      return (
        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 text-[color:var(--sf-accent)] @md/storefront:grid-cols-2 @md/storefront:items-center @md/storefront:px-10">
          <div
            className={`aspect-[4/3] overflow-hidden ${section.imagePosition === "right" ? "@md/storefront:order-2" : ""}`}
          >
            <BookImage src={section.imageUrl} />
          </div>
          <div>
            <p className="mb-4 text-xs uppercase tracking-widest">
              {section.eyebrow}
            </p>
            <h2 className="font-serif text-4xl leading-tight @md/storefront:text-5xl">
              {section.title}
            </h2>
            <p className="my-6 text-sm leading-8 whitespace-pre-line">
              {section.body}
            </p>
            {section.cta.label && (
              <StorefrontSmartLink
                link={section.cta}
                {...links}
                className={button}
              />
            )}
          </div>
        </section>
      );
    case "promoBanner":
      return (
        <section className="bg-[color:var(--sf-accent)] px-5 py-12 text-[color:var(--sf-cart-badge-fg)] @md/storefront:px-10">
          <div className="mx-auto grid max-w-7xl items-center gap-8 @md/storefront:grid-cols-[1fr_2fr]">
            <div className="aspect-[4/3] max-h-64 overflow-hidden">
              <BookImage src={section.imageUrl} />
            </div>
            <div>
              <h2 className="font-serif text-4xl">{section.title}</h2>
              <p className="my-5 max-w-xl text-sm leading-7">
                {section.description}
              </p>
              {section.buttonLabel && (
                <StorefrontSmartLink
                  link={{ label: section.buttonLabel, href: section.href }}
                  {...links}
                  className={button}
                />
              )}
            </div>
          </div>
        </section>
      );
    case "features":
      return (
        <section className="border-y border-[color:var(--sf-accent-border-15)] px-5 py-12 text-[color:var(--sf-accent)] @md/storefront:px-10">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-8 font-serif text-3xl">{section.title}</h2>
            <div className="grid gap-8 @md/storefront:grid-cols-3">
              {section.items.map((item, i) => {
                const Icon = [BookOpen, Bookmark, Library][i % 3];
                return (
                  <div key={i}>
                    <Icon aria-hidden className="mb-4" />
                    <h3 className="font-serif text-2xl">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    case "contactCta":
      return (
        <section className="px-5 py-16 text-center text-[color:var(--sf-accent)]">
          <BookOpen aria-hidden className="mx-auto mb-5" />
          <h2 className="font-serif text-4xl">{section.title}</h2>
          <p className="mx-auto my-6 max-w-lg text-sm leading-7">
            {section.body}
          </p>
          {section.buttonLabel && (
            <StorefrontSmartLink
              link={{ label: section.buttonLabel, href: section.href }}
              {...links}
              className={button}
            />
          )}
        </section>
      );
    default:
      return null;
  }
}
