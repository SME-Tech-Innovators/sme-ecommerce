import { renderToStaticMarkup } from "react-dom/server";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrderCancellationPanel } from "@/components/dashboard/order-cancellation-panel";

jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn(), useMutation: jest.fn(), useQueryClient: jest.fn() }));
beforeEach(() => {
  jest.mocked(useMutation).mockReturnValue({} as ReturnType<typeof useMutation>);
  jest.mocked(useQueryClient).mockReturnValue({} as ReturnType<typeof useQueryClient>);
});
function render(status: string) {
  jest.mocked(useQuery).mockReturnValue({ data: { status, reason: "Wrong size" } } as ReturnType<typeof useQuery>);
  return renderToStaticMarkup(<OrderCancellationPanel workspaceId="w" orderId="o" />);
}
it("hides the card when there is no cancellation request", () => {
  expect(render("none")).toBe("");
});
it("shows approval and rejection for a pending request", () => {
  const html = render("requested");
  expect(html).toContain("Wrong size");
  expect(html).toContain("Approve request</button>");
  expect(html).toContain("Reject request</button>");
});
it("does not offer another decision after approval", () => {
  const html = render("approved");
  expect(html).toContain("Review refunds separately");
  expect(html).not.toContain("Approve request</button>");
});
