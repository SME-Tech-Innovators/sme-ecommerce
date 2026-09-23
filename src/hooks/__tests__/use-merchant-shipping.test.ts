import { useMerchantShipping as registerShipping, shouldPollMerchantShipping } from "@/hooks/use-merchant-shipping";
import { getMerchantOrderShipping, postMerchantShippingAction } from "@/apis/shipping";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrderShippingStatus } from "@/types/shipping";
jest.mock("@tanstack/react-query", () => ({ useMutation: jest.fn(), useQuery: jest.fn(), useQueryClient: jest.fn() }));
jest.mock("@/apis/shipping", () => ({ getMerchantOrderShipping: jest.fn(), postMerchantShippingAction: jest.fn() }));
jest.mock("@/lib/auth-login-storage", () => ({ getStoredAuthSession: () => ({ accessToken: "token" }) }));
const client = { setQueryData: jest.fn(), invalidateQueries: jest.fn(), cancelQueries: jest.fn() };
const state = { provider: "bobgo", status: "created", canCancel: true } as OrderShippingStatus;
let order = 0;
function setup(id = String(order)) {
  const hook = registerShipping("w", id);
  const options = jest.mocked(useMutation).mock.calls.at(-1)![0] as unknown as { retry: boolean; mutationFn: (action: "refresh" | "cancel") => Promise<unknown> };
  return { hook, options };
}
beforeEach(() => {
  order++; jest.clearAllMocks();
  jest.mocked(useQueryClient).mockReturnValue(client as unknown as ReturnType<typeof useQueryClient>);
  jest.mocked(useQuery).mockReturnValue({ data: state } as ReturnType<typeof useQuery>);
  jest.mocked(useMutation).mockReturnValue({} as ReturnType<typeof useMutation>);
});
it("requires backend cancellation eligibility", () => {
  expect(setup().hook.canCancel).toBe(true);
  jest.mocked(useQuery).mockReturnValue({ data: { ...state, canCancel: false } } as ReturnType<typeof useQuery>);
  expect(setup().hook.canCancel).toBe(false);
});
it("invalidates order list/detail caches after provider synchronization", async () => {
  jest.mocked(postMerchantShippingAction).mockResolvedValue({ ok: true, data: { ...state, status: "delivered", canCancel: false } });
  const { options } = setup(); expect(options.retry).toBe(false);
  await options.mutationFn("refresh");
  expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["merchant-orders", "w"] });
});
it("reconciles ambiguous cancellations and blocks repeat requests across remounts", async () => {
  jest.mocked(postMerchantShippingAction).mockResolvedValue({ ok: false, status: 0, errorMessage: "offline" });
  jest.mocked(getMerchantOrderShipping).mockResolvedValue({ ok: true, data: state });
  await expect(setup().options.mutationFn("cancel")).rejects.toThrow("offline");
  expect(getMerchantOrderShipping).toHaveBeenCalledTimes(1);
  const reopened = setup(); expect(reopened.hook.canCancel).toBe(false);
  await expect(reopened.options.mutationFn("cancel")).rejects.toThrow("Verify");
  expect(postMerchantShippingAction).toHaveBeenCalledTimes(1);
});
it("stops polling at terminal delivery states", () => {
  expect(shouldPollMerchantShipping(state)).toBe(true);
  expect(shouldPollMerchantShipping({ ...state, status: "cancel_requested" })).toBe(true);
  for (const status of ["delivered", "cancelled", "failed"]) expect(shouldPollMerchantShipping({ ...state, status })).toBe(false);
  expect(shouldPollMerchantShipping({ ...state, provider: "manual" })).toBe(false);
});
