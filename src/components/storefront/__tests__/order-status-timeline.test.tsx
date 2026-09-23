import { renderToStaticMarkup } from "react-dom/server";
import { OrderStatusTimeline } from "@/components/storefront/order-status-timeline";
import type { OrderShippingStatus } from "@/types/shipping";

function render(status: string, statusLabel: string) {
  return renderToStaticMarkup(<OrderStatusTimeline shipping={{ provider: "bobgo", status, statusLabel } as OrderShippingStatus} />);
}
it("shows carrier stages without payment or preparation stages", () => {
  const html = render("created", "Label created");
  expect(html).toContain("Label created");
  expect(html).toContain("In transit");
  expect(html).toContain("Awaiting carrier confirmation.");
  expect(html).not.toContain("The carrier confirmed delivery.");
  expect(html).not.toContain("Paid");
  expect(html).not.toContain("Preparing");
});
it("only describes delivery as confirmed when the carrier reports delivered", () => {
  expect(render("in_transit", "In transit")).not.toContain("The carrier confirmed delivery.");
  expect(render("delivered", "Delivered")).toContain("The carrier confirmed delivery.");
});
it("does not display normal progress as completed for cancelled shipments", () => {
  const html = render("cancelled", "Cancelled by Bob Go");
  expect(html).toContain("Bob Go confirmed the shipment cancellation.");
  expect(html).not.toContain("Delivered");
});
it("distinguishes a cancellation request from confirmed cancellation", () => {
  const html = render("cancel_requested", "Cancellation requested");
  expect(html).toContain("awaiting confirmation from Bob Go");
  expect(html).not.toContain("Bob Go confirmed the shipment cancellation.");
});
