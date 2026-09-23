const SANDBOX_TRACK_BASE = "https://track.sandbox.bobgo.co.za";
const PRODUCTION_TRACK_BASE = "https://track.bobgo.co.za";

export function trackingRefFromBobGoUrl(trackingUrl: string): string | null {
  try {
    const path = new URL(trackingUrl.trim()).pathname.replace(/^\/+/, "");
    return path || null;
  } catch {
    return null;
  }
}

/**
 * Bob Go public tracking page, e.g. https://track.sandbox.bobgo.co.za/UASSV9JN
 * Prefer {@link trackingUrl} from the API when present.
 */
export function bobGoPublicTrackingUrl(
  trackingReference: string | null | undefined,
  trackingUrl?: string | null,
): string | null {
  const fromApi = trackingUrl?.trim();
  if (fromApi) {
    return fromApi;
  }
  const ref = trackingReference?.trim();
  if (!ref) {
    return null;
  }
  const useSandbox =
    process.env.NEXT_PUBLIC_BOBGO_TRACKING_SANDBOX !== "false";
  const base = useSandbox ? SANDBOX_TRACK_BASE : PRODUCTION_TRACK_BASE;
  return `${base}/${ref}`;
}
