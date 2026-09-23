"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { shouldPollMerchantShipping, useMerchantShipping } from "@/hooks/use-merchant-shipping";

export function OrderShippingPanel({ workspaceId, orderId }: { workspaceId: string; orderId: string }) {
  const { query, mutation, uncertain } = useMerchantShipping(workspaceId, orderId);
  const [startedAt] = useState(() => Date.now());
  const [initialChecked, setInitialChecked] = useState(false);
  const data = query.data;
  const mutate = mutation.mutate;
  // Reconcile once on opening, then poll sequentially while the detail is visible.
  useEffect(() => {
    if (mutation.isPending || query.isFetching || data?.provider?.toLowerCase() !== "bobgo") return;
    if (Date.now() - startedAt >= 5 * 60_000) return;
    if (initialChecked && (!shouldPollMerchantShipping(data) || mutation.isError)) return;
    const timer = setTimeout(() => {
      setInitialChecked(true);
      mutate("refresh");
    }, initialChecked ? 15_000 : 0);
    return () => clearTimeout(timer);
  }, [data, initialChecked, startedAt, mutate, mutation.isPending, mutation.isError, query.isFetching]);

  return <section className="space-y-3 rounded border border-primary-blue/10 bg-white p-3 text-sm">
    <h3 className="font-semibold">Delivery</h3>
    {query.isPending ? <p role="status">Loading delivery status…</p> : null}
    {data ? <>
      <p aria-live="polite">{data.statusLabel || "Awaiting carrier update"}</p>
      <p className="text-xs text-muted-foreground">{data.provider?.toLowerCase() === "bobgo"
        ? "Bob Go updates delivery progress automatically. No manual fulfilment steps are needed."
        : "This order has no Bob Go shipment to manage. Carrier actions are unavailable."}</p>
      {data.trackingReference ? <p className="break-all">Tracking: {data.trackingReference}</p> : null}
      {data.status === "cancelled" ? <p>Bob Go confirmed cancellation. Payment has not been refunded automatically. Review the payment and stock separately.</p> : null}
      {data.lastError ? <p role="alert">{data.lastError}</p> : null}
    </> : null}
    {query.isError || mutation.isError ? <p role="alert" className="text-red-700">{query.error?.message || mutation.error?.message}</p> : null}
    {uncertain ? <p role="alert">The cancellation result is uncertain. Refresh tracking or contact Bob Go; do not submit another cancellation.</p> : null}
    <Button variant="outline" disabled={query.isFetching || mutation.isPending} onClick={() => data?.provider?.toLowerCase() === "bobgo" ? mutate("refresh") : void query.refetch()}>
      {mutation.isPending ? "Updating…" : "Refresh delivery status"}
    </Button>
  </section>;
}
