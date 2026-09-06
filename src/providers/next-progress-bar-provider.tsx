"use client";

import { ProgressProvider } from "@bprogress/next/app";
import type { ReactNode } from "react";

type NextProgressBarProviderProps = {
  children: ReactNode;
};

/**
 * App-wide navigation progress bar.
 * Color follows `--bprogress-color` (store accent on storefront, app blue elsewhere).
 */
export function NextProgressBarProvider({
  children,
}: NextProgressBarProviderProps) {
  return (
    <ProgressProvider
      height="2px"
      color="var(--bprogress-color)"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
}
