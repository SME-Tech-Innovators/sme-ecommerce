import { requestOrderReturn } from "@/apis/order-returns";
import { getMerchantOrderShipping } from "@/apis/shipping";
import type { ReturnAction } from "@/types/order-returns";

const fetchMock = jest.fn();
const response = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });
const failure = (status: number, code: string, message: string) => new Response(JSON.stringify({ success: false, error: { code, message } }), { status });
beforeEach(() => { global.fetch = fetchMock; fetchMock.mockReset(); process.env.NEXT_PUBLIC_SME_API_BASE_URL = "https://api.example/api/v1"; });
it.each([undefined, "quote", "shipment", "receive", "refund", "refund/refresh"] as (ReturnAction | undefined)[])("uses authenticated backend route for %s", async action => {
  fetchMock.mockResolvedValue(response({ orderId: "o", shipmentStatus: "QUOTED", refundStatus: "NOT_REQUESTED" }));
  const body = action === "shipment" ? { optionId: "server-rate" } : undefined;
  await requestOrderReturn("w/a", "o/b", "token", action, body);
  expect(fetchMock).toHaveBeenCalledWith(`https://api.example/api/v1/workspaces/w%2Fa/orders/o%2Fb/return${action ? `/${action}` : ""}`, expect.objectContaining({ method: action ? "POST" : "GET", headers: expect.objectContaining({ Authorization: "Bearer token" }), cache: "no-store" }));
  expect(fetchMock.mock.calls[0][1].body).toBe(body ? JSON.stringify(body) : undefined);
});
it("sends all quote fields unchanged", async () => {
  const body = { reason: "Damaged", merchantContactName: "Merchant", merchantContactEmail: "a@example.com", merchantContactPhone: "+27820000000", parcels: [{ description: "Full order", lengthCm: 3, widthCm: 2, heightCm: 1, weightKg: 0.01 }] };
  fetchMock.mockResolvedValue(response({ orderId: "o" }));
  await requestOrderReturn("w", "o", "token", "quote", body);
  expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify(body));
});
it("recognizes only the exact backend absence on GET", async () => {
  fetchMock.mockImplementation(() => Promise.resolve(failure(400, "VALIDATION_ERROR", "Return not found; request a return quote first")));
  expect(await requestOrderReturn("w", "o", "t")).toEqual({ ok: true, data: null });
  expect((await requestOrderReturn("w", "o", "t", "refund")).ok).toBe(false);
});
it.each([[400, "VALIDATION_ERROR", "Order is no longer eligible for return"], [403, "FORBIDDEN", "Access denied"], [404, "ORDER_NOT_FOUND", "Missing order"], [500, "INTERNAL_ERROR", "Error"]])("preserves real errors (%s)", async (status, code, message) => {
  fetchMock.mockResolvedValue(failure(Number(status), String(code), String(message)));
  expect(await requestOrderReturn("w", "o", "t")).toMatchObject({ ok: false, status });
});
it("reports transport errors without retrying", async () => {
  fetchMock.mockRejectedValue(new Error("offline"));
  expect(await requestOrderReturn("w", "o", "t", "shipment", { optionId: "rate" })).toMatchObject({ ok: false, status: 0 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("reads the provider from authenticated merchant shipping", async () => {
  fetchMock.mockResolvedValue(response({ provider: "bobgo" }));
  expect(await getMerchantOrderShipping("w", "o", "token")).toMatchObject({ ok: true, data: { provider: "bobgo" } });
  expect(fetchMock.mock.calls[0][0]).toBe("https://api.example/api/v1/workspaces/w/orders/o/shipping");
});
