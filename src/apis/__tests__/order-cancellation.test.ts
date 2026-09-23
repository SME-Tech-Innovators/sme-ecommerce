import { customerCancellation, merchantCancellation, requestOrderAccessLink } from "@/apis/order-cancellation";
jest.mock("@/apis/config", () => ({ getSmeApiBaseUrl: () => "http://localhost:8080/api/v1" }));
const fetchMock = jest.fn();
beforeEach(() => {
  global.fetch = fetchMock;
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { status: "requested" } }) });
});
it("sends customer proof in a header, never in the URL or merchant authorization", async () => {
  await customerCancellation("shop", "order", "private-token", "Wrong size");
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe("http://localhost:8080/api/v1/public/storefronts/shop/orders/order/cancellation-request");
  expect(url).not.toContain("private-token");
  expect(options.headers["X-Order-Access-Token"]).toBe("private-token");
  expect(options.headers.Authorization).toBeUndefined();
  expect(JSON.parse(options.body)).toEqual({ reason: "Wrong size" });
});
it("sends merchant decisions with authenticated authorization", async () => {
  await merchantCancellation("w", "o", "merchant-token", { decision: "reject", note: "Collected" });
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain("/workspaces/w/orders/o/cancellation-request/review");
  expect(options.headers.Authorization).toBe("Bearer merchant-token");
  expect(JSON.parse(options.body).decision).toBe("reject");
});
it("requests a link using both order number and email", async () => {
  await requestOrderAccessLink("shop", "ORD-1", "buyer@example.com");
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ orderNumber: "ORD-1", email: "buyer@example.com" });
});
it("surfaces expired access without reporting success", async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({ success: false, data: null, error: { message: "Link expired" } }) });
  await expect(customerCancellation("shop", "o", "expired")).rejects.toThrow("Link expired");
});
