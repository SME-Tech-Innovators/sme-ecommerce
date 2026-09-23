"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useOrderReturn, useReturnShipping } from "@/hooks/use-order-returns";
import { useShippingSettings } from "@/hooks/use-shipping-settings";
import { canRefundReturn, canReturnOrder, QUOTE_LIFETIME, refundLabel, shipmentLabel, shouldPollRefund, scheduleRefundRefresh, selectedReturnOption, validateReturnQuote } from "@/lib/order-returns";
import { formatMajorAmount, formatMinorAmount } from "@/lib/format-money";
import { formatShipTo } from "@/lib/order-status";
import type { Order } from "@/types/cart";
import type { ReturnAction, ReturnQuoteRequest } from "@/types/order-returns";

const blankParcel = () => ({ description: "", lengthCm: 0, widthCm: 0, heightCm: 0, weightKg: 0 });
const fieldClass = "mt-1 w-full rounded border border-primary-blue/20 bg-white p-2 text-sm";

export function OrderReturnPanel({ workspaceId, order }: { workspaceId: string; order: Order }) {
  const [open, setOpen] = useState(false);
  const flow = useOrderReturn(workspaceId, order.id);
  const shipping = useReturnShipping(workspaceId, order.id);
  const eligible = canReturnOrder(order, shipping.data);
  const existing = flow.query.data;
  return <div className="space-y-2 text-sm">
    {flow.query.isPending || shipping.isPending ? <p role="status">Checking return availability…</p> : null}
    {flow.query.isError || shipping.isError ? <div role="alert"><p>{flow.query.error?.message || shipping.error?.message}</p><Button variant="outline" onClick={() => { void flow.verify(); void shipping.refetch(); }}>Retry status check</Button></div> : null}
    {(existing || eligible) && !flow.query.isPending ? <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild><Button variant="outline">{existing ? "View return" : "Return order"}</Button></Dialog.Trigger>
      <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-x-3 top-[5vh] z-50 mx-auto max-h-[90vh] max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
          <Dialog.Title className="font-serif text-2xl text-primary-blue">Return · {order.orderNumber}</Dialog.Title>
          <Dialog.Description className="my-2 text-sm text-muted-foreground">Full order return. You pay the return delivery cost. Original delivery is included in the full refund.</Dialog.Description>
          <Dialog.Close asChild><Button variant="outline" className="mb-4">Close</Button></Dialog.Close>
          <ReturnContents workspaceId={workspaceId} order={order} eligible={eligible} flow={flow} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root> : null}
  </div>;
}

function ReturnContents({ workspaceId, order, eligible, flow }: {
  workspaceId: string; order: Order; eligible: boolean; flow: ReturnType<typeof useOrderReturn>;
}) {
  const settings = useShippingSettings(workspaceId);
  const [form, setForm] = useState<ReturnQuoteRequest>({ reason: "", merchantContactName: "", merchantContactEmail: "", merchantContactPhone: "", parcels: [blankParcel()] });
  const [errors, setErrors] = useState<string[]>([]);
  const [selection, setSelection] = useState("");
  const [quotedForm, setQuotedForm] = useState("");
  const [expires, setExpires] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [confirmation, setConfirmation] = useState<"shipment" | "receive" | "refund" | null>(null);
  const pollStart = useRef<number | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const data = flow.query.data;
  const fresh = quotedForm === JSON.stringify(form) && now < expires;
  const option = selectedReturnOption(data, selection, quotedForm === JSON.stringify(form), expires, now);
  const canQuote = eligible && (!data || (data.shipmentStatus === "QUOTED" && data.refundStatus === "NOT_REQUESTED"));
  const canReceive = data?.shipmentStatus === "CREATED";
  const canRefund = Boolean(data && canRefundReturn(data) && order.paymentStatus === "paid");
  const mutation = flow.mutation;
  const refreshRefund = mutation.mutate;
  useEffect(() => {
    if (flow.blocked || !shouldPollRefund(data, 0)) return;
    pollStart.current ??= Date.now();
    return scheduleRefundRefresh(data, pollStart.current, () => refreshRefund({ action: "refund/refresh" }));
  }, [data, flow.blocked, refreshRefund, pollStart]);

  async function run(action: ReturnAction) {
    if (flow.blocked) return;
    if (action === "quote") {
      const issues = validateReturnQuote(form); setErrors(issues);
      if (issues.length || !canQuote) return;
      setSelection(""); setExpires(0);
    }
    if (action === "shipment" && (!option || !canQuote || confirmation !== "shipment")) return;
    if (action === "receive" && (!canReceive || confirmation !== "receive")) return;
    if (action === "refund" && (!canRefund || confirmation !== "refund")) return;
    const snapshot = JSON.stringify(form);
    const started = Date.now();
    try {
      const result = await mutation.mutateAsync({ action, body: action === "quote" ? form : action === "shipment" ? { optionId: option!.id } : undefined });
      if (!mounted.current) return;
      if (action === "quote" && result?.shipmentStatus === "QUOTED") { setQuotedForm(snapshot); setExpires(started + QUOTE_LIFETIME); }
      setConfirmation(null);
    } catch { if (mounted.current) { setConfirmation(null); if (action === "shipment") { setSelection(""); setExpires(0); } } }
  }
  const address = settings.data?.collectionAddress;
  return <div className="space-y-4 text-sm text-primary-blue">
    <p><strong>Collection:</strong> {formatShipTo(order) || "Address unavailable"}</p>
    <p><strong>Return destination:</strong> {address ? [address.line1, address.line2, address.city, address.province, address.postalCode, address.country].filter(Boolean).join(", ") : settings.isPending ? "Loading…" : "Address unavailable. Check shipping settings."}</p>
    {settings.isError ? <p role="alert">{settings.error.message}</p> : null}
    {data ? <div aria-live="polite"><p>{shipmentLabel(data.shipmentStatus)}</p><p>{refundLabel(data.refundStatus)}</p></div> : null}
    {data?.trackingReference ? <div><p className="break-all">Tracking reference: {data.trackingReference}</p><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(data.trackingReference!); toast.success("Tracking reference copied"); } catch { toast.error("Could not copy. Select and copy the reference manually."); } }}>Copy reference</Button></div> : null}
    {flow.query.isError || mutation.isError ? <p role="alert" className="text-red-700">{flow.query.error?.message || mutation.error?.message}</p> : null}
    <Button variant="outline" disabled={mutation.isPending || flow.query.isFetching} onClick={() => void flow.verify()}>Refresh recorded status</Button>
    {canQuote ? <form onSubmit={event => { event.preventDefault(); void run("quote"); }} onChange={() => { setSelection(""); setQuotedForm(""); setConfirmation(null); }}>
      <fieldset disabled={flow.blocked} className="space-y-3">
        <legend className="mb-2 font-semibold">Return details</legend>
        <p>Enter the merchant’s actual contact details and parcel measurements.</p>
        {([ ["reason", "Reason", 1000], ["merchantContactName", "Merchant contact name", 255], ["merchantContactEmail", "Merchant contact email", 255], ["merchantContactPhone", "Merchant contact phone", 50] ] as const).map(([key, label, max]) => <label key={key} className="block">{label}<input className={fieldClass} required maxLength={max} type={key === "merchantContactEmail" ? "email" : key === "merchantContactPhone" ? "tel" : "text"} value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} /></label>)}
        {form.parcels.map((parcel, index) => <fieldset key={index} className="space-y-2 rounded border p-3"><legend>Parcel {index + 1}</legend>
          <label className="block">Description<input className={fieldClass} required maxLength={255} value={parcel.description} onChange={event => setForm({ ...form, parcels: form.parcels.map((p, i) => i === index ? { ...p, description: event.target.value } : p) })} /></label>
          <div className="grid grid-cols-2 gap-2">{([["lengthCm", "Length (cm)"], ["widthCm", "Width (cm)"], ["heightCm", "Height (cm)"], ["weightKg", "Weight (kg)"]] as const).map(([key, label]) => <label key={key}>{label}<input className={fieldClass} required type="number" min="0.01" step="any" value={parcel[key] || ""} onChange={event => setForm({ ...form, parcels: form.parcels.map((p, i) => i === index ? { ...p, [key]: Number(event.target.value) } : p) })} /></label>)}</div>
          <Button type="button" variant="outline" disabled={form.parcels.length === 1} onClick={() => { setForm({ ...form, parcels: form.parcels.filter((_, i) => i !== index) }); setSelection(""); setQuotedForm(""); }}>Remove parcel</Button>
        </fieldset>)}
        <Button type="button" variant="outline" disabled={form.parcels.length >= 50} onClick={() => { setForm({ ...form, parcels: [...form.parcels, blankParcel()] }); setSelection(""); setQuotedForm(""); }}>Add parcel</Button>
        {errors.length ? <ul role="alert" className="text-red-700">{errors.map(error => <li key={error}>{error}</li>)}</ul> : null}
        <Button type="submit" className="block">{data ? "Recalculate rates" : "Get return rates"}</Button>
      </fieldset>
    </form> : null}
    {canQuote && data?.shipmentStatus === "QUOTED" ? <fieldset disabled={flow.blocked || !fresh} className="space-y-2"><legend>Return delivery · paid by you</legend>
      {!fresh ? <p>Request new rates: the previous quote has expired or its details need confirming.</p> : null}
      {data.options?.map(item => <label key={item.id} className="flex gap-2 rounded border p-3"><input type="radio" name="return-rate" value={item.id} checked={selection === item.id} onChange={() => setSelection(item.id)} /><span>{item.label} · {formatMinorAmount(item.amount, item.currency)} {item.currency}{item.estimatedDays != null ? ` · Estimated ${item.estimatedDays} days` : ""}</span></label>)}
      <Button disabled={!option || flow.blocked} onClick={() => setConfirmation("shipment")}>Book return collection</Button>
    </fieldset> : null}
    {canReceive ? <Button disabled={flow.blocked} onClick={() => setConfirmation("receive")}>Confirm receipt</Button> : null}
    {canRefund ? <div><p>Full refund: {formatMajorAmount(order.totalAmount, order.currency)} {order.currency}, including original delivery.</p><Button disabled={flow.blocked} onClick={() => setConfirmation("refund")}>Refund</Button></div> : null}
    {data?.refundId && data.refundStatus !== "PROCESSED" ? <div><Button disabled={flow.blocked} variant="outline" onClick={() => void run("refund/refresh")}>Refresh refund with Paystack</Button><p>Automatic checks run every 10 seconds for up to 5 minutes while this panel is open. You can refresh manually afterwards.</p></div> : null}
    {mutation.isPending ? <p role="status">Updating return…</p> : null}
    <Dialog.Root open={confirmation !== null} onOpenChange={value => { if (!value) setConfirmation(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50" /><Dialog.Content className="fixed inset-x-4 top-[25vh] z-[60] mx-auto max-w-md rounded-xl bg-white p-5 shadow-xl">
      <Dialog.Title className="font-semibold">{confirmation === "shipment" ? "Confirm paid return collection" : confirmation === "receive" ? "Confirm physical receipt" : "Confirm full refund"}</Dialog.Title>
      <Dialog.Description className="my-4 text-sm">{confirmation === "shipment" ? `You will pay ${option ? formatMinorAmount(option.amount, option.currency) + " " + option.currency : "the selected return delivery cost"} for this collection.` : confirmation === "receive" ? "Confirm that you have received and inspected all parcels. Stock will not be restored automatically; adjust it manually after inspection." : `Refund ${formatMajorAmount(order.totalAmount, order.currency)} ${order.currency}, including original delivery, to the customer's original payment method?`}</Dialog.Description>
      <div className="flex flex-wrap gap-2"><Dialog.Close asChild><Button variant="outline">Cancel</Button></Dialog.Close><Button disabled={flow.blocked || (confirmation === "shipment" && !option)} onClick={() => confirmation && void run(confirmation)}>Confirm</Button></div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
