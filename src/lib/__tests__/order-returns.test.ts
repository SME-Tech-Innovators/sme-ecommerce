import { canReturnOrder, canRefundReturn, refundLabel, shipmentLabel, validateReturnQuote, scheduleRefundRefresh, REFUND_POLL_LIMIT, selectedReturnOption } from "@/lib/order-returns";
import { formatMinorAmount, formatMajorAmount } from "@/lib/format-money";
import type { Order } from "@/types/cart";
import type { OrderReturn } from "@/types/order-returns";
import type { OrderShippingStatus } from "@/types/shipping";
const quote = { reason: "Damaged", merchantContactName: "Actual merchant", merchantContactEmail: "a@example.com", merchantContactPhone: "+27820000000", parcels: [{ description: "Whole order", lengthCm: 1, widthCm: 1, heightCm: 1, weightKg: 0.01 }] };
const value: OrderReturn = { orderId: "o", shipmentStatus: "RECEIVED", receivedAt: "2026-09-22T10:00:00", refundStatus: "NOT_REQUESTED" };
it("formats quote cents separately from major-unit order totals", () => { expect(formatMinorAmount(5000, "ZAR")).toBe("R50.00"); expect(formatMajorAmount(5000, "ZAR")).toBe("R5,000.00"); });
it("requires paid fulfilled Bob Go orders, never a service label", () => {
  const order = { status: "fulfilled", paymentStatus: "paid" } as Order;
  expect(canReturnOrder(order, { provider: "bobgo" } as OrderShippingStatus)).toBe(true);
  expect(canReturnOrder(order, { shippingOptionLabel: "Bob Go" } as OrderShippingStatus)).toBe(false);
  expect(canReturnOrder({ ...order, paymentStatus: "refunded" }, { provider: "bobgo" } as OrderShippingStatus)).toBe(false);
});
it("validates required fields, boundaries and finite parcel measurements", () => {
  expect(validateReturnQuote(quote)).toEqual([]);
  for (const key of ["reason", "merchantContactName", "merchantContactEmail", "merchantContactPhone"] as const) expect(validateReturnQuote({ ...quote, [key]: " " }).length).toBeGreaterThan(0);
  expect(validateReturnQuote({ ...quote, reason: "x".repeat(1001) }).length).toBeGreaterThan(0);
  expect(validateReturnQuote({ ...quote, merchantContactEmail: "invalid" }).length).toBeGreaterThan(0);
  for (const weightKg of [0, -1, NaN, Infinity]) expect(validateReturnQuote({ ...quote, parcels: [{ ...quote.parcels[0], weightKg }] }).length).toBeGreaterThan(0);
  expect(validateReturnQuote({ ...quote, parcels: [] }).length).toBeGreaterThan(0);
  expect(validateReturnQuote({ ...quote, parcels: Array(51).fill(quote.parcels[0]) }).length).toBeGreaterThan(0);
});
it("requires confirmed receipt before any first refund", () => {
  expect(canRefundReturn(value)).toBe(true);
  expect(canRefundReturn({ ...value, receivedAt: null })).toBe(false);
  expect(canRefundReturn({ ...value, shipmentStatus: "CREATED" })).toBe(false);
  for (const status of ["UNKNOWN", "SUBMITTING", "FAILED", "NEEDS_ATTENTION", "PENDING", "PROCESSING", "PROCESSED", "NEW_STATUS"]) expect(canRefundReturn({ ...value, refundStatus: status })).toBe(false);
});
it("never presents pending or unknown as refunded", () => {
  expect(refundLabel("PROCESSED")).toBe("Refunded");
  for (const status of ["PENDING", "PROCESSING", "UNKNOWN", "NEW_STATUS"]) expect(refundLabel(status)).not.toBe("Refunded");
  expect(shipmentLabel("NEW_STATUS")).toContain("verification");
});
describe("bounded polling", () => {
  beforeEach(() => jest.useFakeTimers()); afterEach(() => jest.useRealTimers());
  it("checks after ten seconds and cancels on panel close", () => {
    const refresh = jest.fn(); const state = { ...value, refundStatus: "PENDING", refundId: "r" };
    scheduleRefundRefresh(state, Date.now(), refresh); jest.advanceTimersByTime(10000); expect(refresh).toHaveBeenCalledTimes(1);
    const stop = scheduleRefundRefresh(state, Date.now(), refresh); stop(); jest.advanceTimersByTime(10000); expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("stops at final states, missing IDs and the deadline", () => {
    const refresh = jest.fn();
    for (const refundStatus of ["PROCESSED", "FAILED", "NEEDS_ATTENTION", "UNKNOWN", "SUBMITTING"]) scheduleRefundRefresh({ ...value, refundStatus, refundId: "r" }, Date.now(), refresh);
    scheduleRefundRefresh({ ...value, refundStatus: "PROCESSING" }, Date.now(), refresh);
    scheduleRefundRefresh({ ...value, refundStatus: "PROCESSING", refundId: "r" }, Date.now() - REFUND_POLL_LIMIT + 1000, refresh);
    jest.advanceTimersByTime(10000); expect(refresh).not.toHaveBeenCalled();
  });
});

it("accepts only an option from the current unchanged unexpired quote", () => {
  const option = { id: "server-id", provider: "bobgo", label: "Standard", amount: 5000, currency: "ZAR" };
  const quoted = { ...value, shipmentStatus: "QUOTED", options: [option] };
  expect(selectedReturnOption(quoted, "server-id", true, 100, 99)).toEqual(option);
  expect(selectedReturnOption(quoted, "invented", true, 100, 99)).toBeUndefined();
  expect(selectedReturnOption(quoted, "server-id", false, 100, 99)).toBeUndefined();
  expect(selectedReturnOption(quoted, "server-id", true, 100, 100)).toBeUndefined();
  for (const shipmentStatus of ["UNKNOWN", "SUBMITTING", "CREATED", "RECEIVED"]) expect(selectedReturnOption({ ...quoted, shipmentStatus }, "server-id", true, 100, 99)).toBeUndefined();
});
