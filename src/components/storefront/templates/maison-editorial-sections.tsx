import { StorefrontSmartLink } from "@/components/storefront/storefront-smart-link";
import { StorefrontImagePlaceholder } from "@/components/storefront/storefront-image-placeholder";
import { normalizeEditorialSettings } from "@/lib/storefront-editorial";
import type { StorefrontConfig, StorefrontSection } from "@/types/storefront";

const action =
  "inline-block border-b border-current pb-2 text-xs uppercase tracking-[0.18em] transition-opacity hover:opacity-65";
const heading =
  "font-serif text-[clamp(2.5rem,6cqi,6rem)] font-normal leading-[0.98] tracking-[-0.045em] whitespace-pre-line break-words";

function EditorialImage({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`h-full w-full object-cover ${className}`}
    />
  ) : (
    <StorefrontImagePlaceholder />
  );
}

/** Distinct magazine layouts; all content still uses the shared section editor. */
export function MaisonEditorialSection({
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
  const settings = normalizeEditorialSettings(config.editorial);
  switch (section.type) {
    case "hero": {
      const cover = settings.heroLayout === "cover";
      return (
        <section
          aria-labelledby={`${section.id}-heading`}
          className={
            cover
              ? "relative isolate mx-5 my-5 min-h-[36rem] overflow-hidden bg-black text-white @md/storefront:mx-10"
              : "grid gap-8 px-5 py-[var(--sf-editorial-space)] text-[color:var(--sf-accent)] @md/storefront:grid-cols-[1.1fr_1fr] @md/storefront:gap-12 @md/storefront:px-10"
          }
        >
          <div
            className={
              cover
                ? "absolute inset-0 -z-10 opacity-65"
                : "order-2 aspect-[4/5] overflow-hidden @md/storefront:mt-12"
            }
          >
            <EditorialImage src={section.imageUrl} />
          </div>
          <div
            className={
              cover
                ? "flex min-h-[36rem] max-w-3xl flex-col justify-end gap-8 p-7 @md/storefront:p-14"
                : "flex flex-col items-start justify-center gap-8"
            }
          >
            <p className="text-[10px] uppercase tracking-[0.25em]">
              {settings.editionLabel}
            </p>
            <h1 id={`${section.id}-heading`} className={heading}>
              {section.heading}
            </h1>
            <p className="max-w-sm text-sm leading-7 whitespace-pre-line">
              {section.subheading}
            </p>
            <div className="flex flex-wrap gap-7">
              {section.primaryCta && (
                <StorefrontSmartLink
                  link={section.primaryCta}
                  {...links}
                  className={action}
                />
              )}
              {section.secondaryCta && (
                <StorefrontSmartLink
                  link={section.secondaryCta}
                  {...links}
                  className={action}
                />
              )}
            </div>
          </div>
        </section>
      );
    }
    case "textImage":
      return (
        <section className="grid gap-8 border-y border-[color:var(--sf-accent-border-10)] px-5 py-[var(--sf-editorial-space)] @md/storefront:grid-cols-2 @md/storefront:gap-16 @md/storefront:px-10">
          <div
            className={`aspect-[3/4] overflow-hidden ${section.imagePosition === "right" ? "@md/storefront:order-2" : ""}`}
          >
            <EditorialImage src={section.imageUrl} />
          </div>
          <div className="flex flex-col items-start justify-center gap-7 text-[color:var(--sf-accent)]">
            <p className="text-[10px] uppercase tracking-[0.25em]">
              {section.eyebrow}
            </p>
            <h2 className={heading}>{section.title}</h2>
            <p className="max-w-md text-sm leading-7 whitespace-pre-line">
              {section.body}
            </p>
            {section.cta.label && (
              <StorefrontSmartLink
                link={section.cta}
                {...links}
                className={action}
              />
            )}
          </div>
        </section>
      );
    case "promoBanner":
      return (
        <section className="relative isolate flex min-h-[30rem] items-end overflow-hidden bg-black px-7 py-[var(--sf-editorial-space)] text-white @md/storefront:px-14">
          <div className="absolute inset-0 -z-10 opacity-60">
            <EditorialImage src={section.imageUrl} />
          </div>
          <div className="max-w-2xl space-y-7">
            <h2 className={heading}>{section.title}</h2>
            <p className="max-w-md text-sm leading-7">{section.description}</p>
            {section.buttonLabel && (
              <StorefrontSmartLink
                link={{ label: section.buttonLabel, href: section.href }}
                {...links}
                className={action}
              />
            )}
          </div>
        </section>
      );
    case "features":
      return (
        <section className="px-5 py-[var(--sf-editorial-space)] text-[color:var(--sf-accent)] @md/storefront:px-10">
          <h2 className="mb-10 font-serif text-4xl">{section.title}</h2>
          <div className="grid gap-8 @md/storefront:grid-cols-3">
            {section.items.map((item, i) => (
              <div key={i} className="border-t border-current/25 pt-5">
                <p
                  aria-hidden
                  className="mb-6 font-serif text-4xl italic opacity-50"
                >
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="font-serif text-2xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-6">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case "contactCta":
      return (
        <section className="border-t border-[color:var(--sf-accent-border-10)] px-5 py-[var(--sf-editorial-space)] text-center text-[color:var(--sf-accent)]">
          <h2 className={heading}>{section.title}</h2>
          <p className="mx-auto my-7 max-w-lg text-sm leading-7">
            {section.body}
          </p>
          {section.buttonLabel && (
            <StorefrontSmartLink
              link={{ label: section.buttonLabel, href: section.href }}
              {...links}
              className={action}
            />
          )}
        </section>
      );
    default:
      return null;
  }
}
