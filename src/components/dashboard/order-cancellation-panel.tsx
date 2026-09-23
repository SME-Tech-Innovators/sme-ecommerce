"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { merchantCancellation } from "@/apis/order-cancellation";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import { Button } from "@/components/ui/button";

export function OrderCancellationPanel({ workspaceId, orderId }: { workspaceId: string; orderId: string }) {
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const client = useQueryClient();
  const key = ["merchant-cancellation", workspaceId, orderId];
  function token() {
    const access = getStoredAuthSession()?.accessToken;
    if (!access) throw new Error("Sign in to review cancellation requests.");
    return access;
  }
  const query = useQuery({ queryKey: key, retry: false, refetchInterval: 15_000,
    queryFn: () => merchantCancellation(workspaceId, orderId, token()) });
  const mutation = useMutation({ retry: false,
    mutationFn: (value: "approve" | "reject") => merchantCancellation(workspaceId, orderId, token(), { decision: value, note }),
    onSuccess: async (data) => {
      client.setQueryData(key, data); setDecision(null);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["merchant-orders", workspaceId] }),
        client.invalidateQueries({ queryKey: ["merchant-order-shipping", workspaceId, orderId] }),
      ]);
    },
    onError: () => { void query.refetch(); },
  });
  const data = query.data;
  if (data?.status === "none" && !query.isError) return null;
  return <section className="space-y-3 rounded border border-primary-blue/10 bg-white p-3 text-sm">
    <h3 className="font-semibold">Customer cancellation request</h3>
    {query.isPending ? <p>Loading request…</p> : null}
    {query.isError || mutation.isError ? <p role="alert" className="text-red-700">{query.error?.message || mutation.error?.message}</p> : null}
    {data && data.status !== "none" ? <>
      <p>Status: {data.status}</p><p>Reason: {data.reason}</p>
      {data.reviewNote ? <p>Your response: {data.reviewNote}</p> : null}
      {data.status === "approved" ? <p>For carrier shipments, check Delivery for confirmation. Review refunds separately.</p> : null}
      {data.status === "requested" ? <>
        {data.unavailableReason ? <p>{data.unavailableReason}</p> : null}
        <label className="block">Message to customer (optional)
          <textarea maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 block w-full rounded border p-2" />
        </label>
        <div className="flex gap-2">
          <Button disabled={mutation.isPending || query.isError || !!data.unavailableReason} onClick={() => setDecision("approve")}>Approve request</Button>
          <Button variant="outline" disabled={mutation.isPending || query.isError} onClick={() => setDecision("reject")}>Reject request</Button>
        </div>
        {decision ? <div role="group" aria-label="Confirm decision" className="space-y-2 border-t pt-3">
          <p>{decision === "approve" ? "Accept and initiate cancellation? Bob Go must confirm shipment cancellation. This does not issue a refund." : "Decline this customer’s request?"}</p>
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate(decision)}>{mutation.isPending ? "Saving…" : "Confirm decision"}</Button>
          <Button variant="outline" disabled={mutation.isPending} onClick={() => setDecision(null)}>Go back</Button>
        </div> : null}
      </> : null}
    </> : null}
  </section>;
}
