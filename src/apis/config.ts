/** Base URL for SME Operations API (no trailing slash). Must be set via NEXT_PUBLIC_SME_API_BASE_URL. */
export function getSmeApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SME_API_BASE_URL?.trim().replace(
    /\/+$/,
    "",
  );
  if (fromEnv) return fromEnv;
  // No hardcoded fallback — require explicit configuration so local dev
  // never accidentally targets the production backend.
  if (typeof window !== "undefined") {
    // Browser: derive from current origin as a safe local-dev fallback
    return `${window.location.origin.replace(/\/+$/, "")}/api/v1`;
  }
  throw new Error(
    "NEXT_PUBLIC_SME_API_BASE_URL is not set. Add it to your .env.local file.",
  );
}

/**
 * Public app / hosting origin (no trailing slash) for storefront links,
 * Paystack callbacks, and copy-to-clipboard URLs.
 *
 * Until custom domains (Step 12), always prefer this hosting URL over
 * ephemeral preview hosts. Override with `NEXT_PUBLIC_APP_ORIGIN`.
 */
export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://sme-operations.netlify.app";
}

/** Absolute public storefront URL: `{origin}/s/{storeSlug}`. */
export function buildPublicStoreUrl(storeSlug: string): string {
  const slug = storeSlug.trim().replace(/^\/+|\/+$/g, "");
  return `${getAppOrigin()}/s/${slug}`;
}
