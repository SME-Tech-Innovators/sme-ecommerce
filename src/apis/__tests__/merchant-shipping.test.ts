import { postMerchantShippingAction } from "@/apis/shipping";
const fetchMock = jest.fn();
beforeEach(() => { global.fetch = fetchMock; fetchMock.mockReset(); process.env.NEXT_PUBLIC_SME_API_BASE_URL = "https://api.example/api/v1"; });
it.each(["refresh", "cancel"] as const)("uses the authenticated backend for %s without a manual order PATCH", async action => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true, data: { provider: "bobgo", status: "cancel_requested", canCancel: false } })));
  expect(await postMerchantShippingAction("w/a", "o/b", "token", action)).toMatchObject({ ok: true, data: { status: "cancel_requested", canCancel: false } });
  expect(fetchMock).toHaveBeenCalledWith(`https://api.example/api/v1/workspaces/w%2Fa/orders/o%2Fb/shipping/${action}`, expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer token" }) }));
  expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
});
it("does not retry cancellation after a network error", async () => {
  fetchMock.mockRejectedValue(new Error("offline"));
  expect(await postMerchantShippingAction("w", "o", "token", "cancel")).toMatchObject({ ok: false, status: 0 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
