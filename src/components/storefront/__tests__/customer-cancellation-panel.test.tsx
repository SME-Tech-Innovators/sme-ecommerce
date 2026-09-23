import { renderToStaticMarkup } from "react-dom/server";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CustomerCancellationPanel } from "@/components/storefront/customer-cancellation-panel";
jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn(), useMutation: jest.fn(), useQueryClient: jest.fn() }));
beforeEach(() => {
  jest.mocked(useMutation).mockReturnValue({} as ReturnType<typeof useMutation>);
  jest.mocked(useQueryClient).mockReturnValue({} as ReturnType<typeof useQueryClient>);
});
function render(data: object) {
  jest.mocked(useQuery).mockReturnValue({ data } as ReturnType<typeof useQuery>);
  return renderToStaticMarkup(<CustomerCancellationPanel storeSlug="shop" orderId="o" token="t" />);
}
it("offers a request only when the backend declares eligibility", () => {
  expect(render({ status: "none", canRequest: true })).toContain("Request cancellation");
  const ineligible = render({ status: "none", canRequest: false, unavailableReason: "Already collected" });
  expect(ineligible).not.toContain("Request cancellation");
  expect(ineligible).toContain("Already collected");
});
it("explains that a pending request is not a cancelled order", () => {
  const html = render({ status: "requested", canRequest: false });
  expect(html).toContain("has not been cancelled yet");
  expect(html).not.toContain("<form");
});
it("does not promise a refund after merchant approval", () => {
  expect(render({ status: "approved", canRequest: false })).toContain("Any refund is handled separately");
});
