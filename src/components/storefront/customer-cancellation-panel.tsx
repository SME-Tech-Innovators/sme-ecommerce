"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerCancellation } from "@/apis/order-cancellation";
import { StorefrontButton } from "@/components/storefront/storefront-button";

export function CustomerCancellationPanel({ storeSlug, orderId, token }: {
  storeSlug: string; orderId: string; token: string;
}) {
  const [reason, setReason] = useState("");
  const client = useQueryClient();
  const key = ["customer-cancellation", storeSlug, orderId, token];
  const query = useQuery({ queryKey: key, retry: false, gcTime: 0,
    queryFn: () => customerCancellation(storeSlug, orderId, token), refetchInterval: 30_000 });
  const mutation = useMutation({ retry: false,
    mutationFn: () => customerCancellation(storeSlug, orderId, token, reason.trim()),
    onSuccess: (data) => { client.setQueryData(key, data); },
  });
  const data = query.data;
  return <section className="space-y-3 border border-[color:var(--sf-accent-border-10)] bg-white p-5 text-sm">
    <h3 className="font-semibold">Cancellation request</h3>
    {query.isPending ? <p role="status">Checking cancellation options…</p> : null}
    {query.isError || mutation.isError ? <p role="alert" className="text-red-700">{query.error?.message || mutation.error?.message}</p> : null}
    {data?.status === "requested" ? <p role="status">Your cancellation request is awaiting the store’s review. Your order has not been cancelled yet.</p> : null}
    {data?.status === "approved" ? <p role="status">The store accepted your request. Check the delivery status for confirmation of cancellation. Any refund is handled separately by the store.</p> : null}
    {data?.status === "rejected" ? <p role="status">The store declined your cancellation request. Contact the store for help.</p> : null}
    {data?.reviewNote ? <p>Store response: {data.reviewNote}</p> : null}
    {data?.reason ? <p>Your reason: {data.reason}</p> : null}
    {data?.status === "none" && !data.canRequest ? <p>{data.unavailableReason}</p> : null}
    {data?.canRequest && !query.isError ? <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
      <p>The store will review your request before cancelling. Submitting this form does not cancel the order or issue a refund.</p>
      <label className="block">Reason for cancellation
        <textarea required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)}
          className="mt-2 block w-full border border-gray-300 p-3" rows={3} />
      </label>
      <StorefrontButton type="submit" disabled={!reason.trim() || mutation.isPending || query.isFetching}>
        {mutation.isPending ? "Submitting…" : "Request cancellation"}
      </StorefrontButton>
    </form> : null}
    <StorefrontButton variant="outline" disabled={query.isFetching || mutation.isPending} onClick={() => void query.refetch()}>Refresh request status</StorefrontButton>
  </section>;
}
