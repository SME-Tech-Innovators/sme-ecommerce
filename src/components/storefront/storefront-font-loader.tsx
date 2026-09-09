"use client";

import { useEffect } from "react";

type StorefrontFontLoaderProps = {
  href: string;
};

export function StorefrontFontLoader({ href }: StorefrontFontLoaderProps) {
  useEffect(() => {
    const id = "storefront-google-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }, [href]);

  return null;
}
