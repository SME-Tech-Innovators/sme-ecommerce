"use client";

import { useEffect } from "react";

type StorefrontFaviconProps = {
  url?: string;
};

export function StorefrontFavicon({ url }: StorefrontFaviconProps) {
  useEffect(() => {
    const trimmed = url?.trim();
    const selector = 'link[data-storefront-favicon="true"]';
    let link = document.querySelector(selector) as HTMLLinkElement | null;

    if (!trimmed) {
      link?.remove();
      return;
    }

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.setAttribute("data-storefront-favicon", "true");
      document.head.appendChild(link);
    }

    link.href = trimmed;
  }, [url]);

  return null;
}
