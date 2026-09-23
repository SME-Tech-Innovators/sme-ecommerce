import { renderToStaticMarkup } from "react-dom/server";
import { OrderReturnPanel } from "@/components/dashboard/order-return-panel";
import { useOrderReturn, useReturnShipping } from "@/hooks/use-order-returns";
import type { Order } from "@/types/cart";
jest.mock("@/hooks/use-order-returns", () => ({ useOrderReturn: jest.fn(), useReturnShipping: jest.fn() }));
const order = { id: "o", workspaceId: "w", status: "fulfilled", paymentStatus: "refunded" } as Order;
beforeEach(() => {
  jest.mocked(useReturnShipping).mockReturnValue({ data: { provider: "bobgo" } } as ReturnType<typeof useReturnShipping>);
});
it("keeps an existing return accessible after full refund", () => {
  jest.mocked(useOrderReturn).mockReturnValue({ query: { data: { orderId: "o", shipmentStatus: "RECEIVED", refundStatus: "PROCESSED" } }, mutation: {} } as ReturnType<typeof useOrderReturn>);
  expect(renderToStaticMarkup(<OrderReturnPanel workspaceId="w" order={order} />)).toContain("View return");
});
it("offers a new return only for eligible paid orders", () => {
  jest.mocked(useOrderReturn).mockReturnValue({ query: { data: null }, mutation: {} } as ReturnType<typeof useOrderReturn>);
  expect(renderToStaticMarkup(<OrderReturnPanel workspaceId="w" order={order} />)).not.toContain("Return order");
  expect(renderToStaticMarkup(<OrderReturnPanel workspaceId="w" order={{ ...order, paymentStatus: "paid" }} />)).toContain("Return order");
});
