"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { bobGoPublicTrackingUrl } from "@/lib/bob-go-tracking-url";
import { publicStorefrontBasePath } from "@/lib/preview-shop-href";

type PublicParcelTrackClientProps = {
  storeSlug: string;
};

/** Legacy URL — redirects straight to Bob Go tracking. */
export function PublicParcelTrackClient({ storeSlug }: PublicParcelTrackClientProps) {
  const basePath = publicStorefrontBasePath(storeSlug);
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref")?.trim() ?? "";
  const trackingUrl = bobGoPublicTrackingUrl(ref, searchParams.get("url"));

  useEffect(() => {
    if (trackingUrl) {
      window.location.replace(trackingUrl);
    }
  }, [trackingUrl]);

  if (trackingUrl) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center font-sans text-sm text-muted-foreground">
        <p>Redirecting to Bob Go tracking…</p>
        <a href={trackingUrl} className="font-semibold text-primary-blue underline">
          Continue if you are not redirected
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-sans text-sm text-muted-foreground">
        Missing tracking reference.
      </p>
      <Link
        href={`${basePath}/orders/track`}
        className="font-sans text-sm font-semibold underline"
      >
        Track your order
      </Link>
    </div>
  );
}
