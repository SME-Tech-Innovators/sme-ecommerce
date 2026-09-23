import { useOrderReturn as registerReturnQueries } from "@/hooks/use-order-returns";
import { requestOrderReturn } from "@/apis/order-returns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

jest.mock("react", () => ({ ...jest.requireActual("react"), useRef: (value: unknown) => ({ current: value }), useState: (value: unknown) => [value, jest.fn()] }));
jest.mock("@tanstack/react-query", () => ({ useMutation: jest.fn(), useQuery: jest.fn(), useQueryClient: jest.fn() }));
jest.mock("@/apis/order-returns", () => ({ requestOrderReturn: jest.fn() }));
jest.mock("@/lib/auth-login-storage", () => ({ getStoredAuthSession: () => ({ accessToken: "token" }) }));
const api = jest.mocked(requestOrderReturn);
const client = { setQueryData: jest.fn(), invalidateQueries: jest.fn(), cancelQueries: jest.fn() };
const state = { orderId: "o", shipmentStatus: "RECEIVED", receivedAt: "today", refundStatus: "PENDING", refundId: "r" };
function options() {
  registerReturnQueries("w", "o");
  // Inspect the real hook's registered command/query functions without a DOM renderer.
  return {
    mutation: jest.mocked(useMutation).mock.calls.at(-1)![0] as unknown as { retry: boolean; mutationFn: (value: { action: string }) => Promise<unknown> },
    query: jest.mocked(useQuery).mock.calls.at(-1)![0] as unknown as { queryKey: string[]; queryFn: () => Promise<unknown> },
  };
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useQueryClient).mockReturnValue(client as unknown as ReturnType<typeof useQueryClient>);
  jest.mocked(useQuery).mockReturnValue({} as ReturnType<typeof useQuery>);
  jest.mocked(useMutation).mockReturnValue({} as ReturnType<typeof useMutation>);
});
it("scopes state to the workspace and order, and disables mutation retries", () => {
  const { query, mutation } = options(); expect(query.queryKey).toEqual(["order-return", "w", "o"]); expect(mutation.retry).toBe(false);
});
it("invalidates the order list and its detail prefix only after PROCESSED", async () => {
  const { mutation } = options(); api.mockResolvedValueOnce({ ok: true, data: state });
  await mutation.mutationFn({ action: "refund/refresh" }); expect(client.invalidateQueries).not.toHaveBeenCalled();
  api.mockResolvedValueOnce({ ok: true, data: { ...state, refundStatus: "PROCESSED" } });
  await mutation.mutationFn({ action: "refund/refresh" });
  expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["merchant-orders", "w"] });
});
it("reads recorded state after an ambiguous mutation before returning the error", async () => {
  const { mutation } = options();
  api.mockResolvedValueOnce({ ok: false, status: 0, errorMessage: "offline" }).mockResolvedValueOnce({ ok: true, data: { ...state, refundStatus: "UNKNOWN" } });
  await expect(mutation.mutationFn({ action: "refund" })).rejects.toThrow("offline");
  expect(api.mock.calls.map(call => call[3])).toEqual(["refund", undefined]);
  expect(client.setQueryData).toHaveBeenCalledWith(["order-return", "w", "o"], expect.objectContaining({ refundStatus: "UNKNOWN" }));
});
it("blocks a second click and a reopened panel during an in-flight command", async () => {
  let resolve!: (value: Awaited<ReturnType<typeof requestOrderReturn>>) => void;
  api.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const first = options().mutation; const pending = first.mutationFn({ action: "refund" });
  await Promise.resolve();
  await expect(first.mutationFn({ action: "refund" })).rejects.toThrow("already in progress");
  await expect(options().mutation.mutationFn({ action: "refund" })).rejects.toThrow("already in progress");
  expect(api).toHaveBeenCalledTimes(1);
  resolve({ ok: true, data: state }); await pending;
});
it("can still load a completed return after the order payment is refunded", async () => {
  const { query } = options(); api.mockResolvedValueOnce({ ok: true, data: { ...state, refundStatus: "PROCESSED" } });
  expect(await query.queryFn()).toMatchObject({ refundStatus: "PROCESSED" });
  expect(client.invalidateQueries).toHaveBeenCalled();
});
