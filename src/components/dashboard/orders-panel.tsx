"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useMerchantOrders,
  useUpdateMerchantOrderStatus,
} from "@/hooks/use-orders";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import { formatMajorAmount } from "@/lib/format-money";
import { orderStatusLabel } from "@/lib/order-status";
import type { Order, OrderStatus } from "@/types/cart";

type OrdersPanelProps = {
  workspaceId: string;
};

function formatWhen(value: string): string {
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return value || "—";
  return new Date(ms).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function paymentBadgeClass(status: string): string {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-800 ring-emerald-700/15";
    case "initialized":
      return "bg-amber-50 text-amber-900 ring-amber-700/15";
    case "failed":
      return "bg-red-50 text-red-800 ring-red-700/15";
    default:
      return "bg-blue-gray/40 text-primary-blue/70 ring-primary-blue/10";
  }
}

function orderBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "fulfilled":
      return "bg-emerald-50 text-emerald-800 ring-emerald-700/15";
    case "processing":
      return "bg-sky-50 text-sky-900 ring-sky-700/15";
    case "cancelled":
      return "bg-red-50 text-red-800 ring-red-700/15";
    case "paid":
      return "bg-amber-50 text-amber-900 ring-amber-700/15";
    default:
      return "bg-blue-gray/40 text-primary-blue/70 ring-primary-blue/10";
  }
}

function nextStatusActions(
  status: OrderStatus,
): Array<{ status: "processing" | "fulfilled" | "cancelled"; label: string }> {
  switch (status) {
    case "paid":
      return [
        { status: "processing", label: "Mark preparing" },
        { status: "cancelled", label: "Cancel order" },
      ];
    case "processing":
      return [
        { status: "fulfilled", label: "Mark fulfilled" },
        { status: "cancelled", label: "Cancel order" },
      ];
    default:
      return [];
  }
}

export function OrdersPanel({ workspaceId }: OrdersPanelProps) {
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSignedIn(Boolean(getStoredAuthSession()?.accessToken));
    setAuthReady(true);
  }, []);

  const ordersQuery = useMerchantOrders(workspaceId, signedIn);
  const updateStatus = useUpdateMerchantOrderStatus(workspaceId);

  const orders = useMemo(() => {
    const list = ordersQuery.data ?? [];
    return [...list].sort((a, b) => {
      const am = Date.parse(a.createdAt) || 0;
      const bm = Date.parse(b.createdAt) || 0;
      return bm - am;
    });
  }, [ordersQuery.data]);

  const selected: Order | null =
    orders.find((order) => order.id === selectedId) ?? null;

  async function onUpdateStatus(
    orderId: string,
    status: "processing" | "fulfilled" | "cancelled",
  ) {
    try {
      const next = await updateStatus.mutateAsync({ orderId, status });
      setSelectedId(next.id);
      toast.success(`Order ${orderStatusLabel(next.status).toLowerCase()}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update order.",
      );
    }
  }

  if (!authReady || (signedIn && ordersQuery.isLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 font-sans text-sm text-muted-foreground">
        Loading orders…
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <h2 className="font-serif text-2xl font-light text-primary-blue">
          Sign in required
        </h2>
      </div>
    );
  }

  if (ordersQuery.isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <h2 className="font-serif text-2xl font-light text-primary-blue">
          Could not load orders
        </h2>
        <p className="max-w-md font-sans text-sm text-muted-foreground">
          {ordersQuery.error instanceof Error
            ? ordersQuery.error.message
            : "Please try again."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <div className="border-b border-primary-blue/10 px-5 py-4">
          <h1 className="font-serif text-2xl font-light text-primary-blue">
            Orders
          </h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            {orders.length === 0
              ? "No orders yet. When customers check out on your live store, orders show up here with contact details and payment status."
              : `${orders.length} order${orders.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-primary-blue/10 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-blue/55">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const active = order.id === selectedId;
                return (
                  <tr
                    key={order.id}
                    className={`cursor-pointer border-b border-primary-blue/5 font-sans text-sm transition-colors ${
                      active
                        ? "bg-primary-blue/[0.06]"
                        : "hover:bg-blue-gray/30"
                    }`}
                    onClick={() => setSelectedId(order.id)}
                  >
                    <td className="px-5 py-3 font-semibold text-primary-blue">
                      {order.orderNumber}
                      <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                        {formatWhen(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-primary-blue">
                      {order.customerName}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${orderBadgeClass(order.status)}`}
                      >
                        {orderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${paymentBadgeClass(order.paymentStatus)}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-primary-blue">
                      {formatMajorAmount(order.totalAmount, order.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="w-full shrink-0 overflow-y-auto bg-blue-gray/15 lg:w-[22rem]">
        {selected ? (
          <div className="space-y-4 px-5 py-5">
            <div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-blue/55">
                Order detail
              </p>
              <h2 className="mt-1 font-serif text-2xl font-light text-primary-blue">
                {selected.orderNumber}
              </h2>
              <p className="mt-1 font-sans text-xs text-muted-foreground">
                {formatWhen(selected.createdAt)} ·{" "}
                {orderStatusLabel(selected.status)}
              </p>
            </div>
            <div className="space-y-1 font-sans text-sm text-primary-blue">
              <p>
                <span className="text-muted-foreground">Customer · </span>
                {selected.customerName}
              </p>
              <p>
                <span className="text-muted-foreground">Email · </span>
                {selected.customerEmail || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Phone · </span>
                {selected.customerPhone || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Ship to · </span>
                {[
                  selected.shippingAddress.line1,
                  selected.shippingAddress.city,
                  selected.shippingAddress.province,
                  selected.shippingAddress.postalCode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>

            {nextStatusActions(selected.status).length > 0 ? (
              <div className="space-y-2 border border-primary-blue/10 bg-white p-3">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-blue/55">
                  Fulfilment
                </p>
                <p className="font-sans text-[11px] leading-relaxed text-muted-foreground">
                  Update status for the customer track page. No shipping
                  carrier yet.
                </p>
                <div className="flex flex-wrap gap-2">
                  {nextStatusActions(selected.status).map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      disabled={updateStatus.isPending}
                      onClick={() =>
                        void onUpdateStatus(selected.id, action.status)
                      }
                      className={`px-3 py-1.5 font-sans text-xs font-semibold ${
                        action.status === "cancelled"
                          ? "border border-red-700/20 text-red-800 hover:bg-red-50"
                          : "bg-primary-blue text-white hover:opacity-95"
                      } disabled:opacity-50`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <ul className="divide-y divide-primary-blue/10 border border-primary-blue/10 bg-white">
              {selected.items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between gap-3 px-3 py-2.5 font-sans text-xs"
                >
                  <span>
                    {item.title} × {item.quantity}
                    <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                      {item.sku}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {formatMajorAmount(item.totalAmount, item.currency)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-right font-sans text-sm font-bold text-primary-blue">
              Total{" "}
              {formatMajorAmount(selected.totalAmount, selected.currency)}
            </p>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-6 py-10 text-center font-sans text-sm text-muted-foreground">
            Select an order to see customer email, phone, and line items.
          </div>
        )}
      </aside>
    </div>
  );
}
