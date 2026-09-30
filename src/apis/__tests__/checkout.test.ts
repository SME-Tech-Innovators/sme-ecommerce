import { getOrderConfirmation, postCheckout } from "@/apis/checkout";
import type { CheckoutBody } from "@/types/cart";
import {
  CART_ID,
  ORDER_ID,
  STORE_SLUG,
  errorEnvelope,
  jsonResponse,
  mockOrder,
  successEnvelope,
} from "@/apis/__tests__/test-helpers";

const checkoutBody: CheckoutBody = {
  cartId: CART_ID,
  customer: {
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+27000000000",
  },
  shippingAddress: {
    line1: "123 Main Road",
    line2: "",
    city: "Cape Town",
    province: "Western Cape",
    postalCode: "8001",
    country: "ZA",
  },
};

describe("checkout API", () => {
  const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  describe("postCheckout", () => {
    it("POSTs checkout details and returns a pending_payment / unpaid order", async () => {
      const order = mockOrder();
      fetchMock.mockResolvedValueOnce(jsonResponse(successEnvelope(order)));

      const result = await postCheckout(STORE_SLUG, checkoutBody);

      expect(result).toEqual({ ok: true, data: {
        ...order,
        cancellationRequestStatus: null,
        shippingAddress: { ...order.shippingAddress, line2: undefined },
      } });
      if (result.ok) {
        expect(result.data.status).toBe("pending_payment");
        expect(result.data.paymentStatus).toBe("unpaid");
        expect(result.data.shippingAmount).toBe(0);
        expect(result.data.totalAmount).toBe(
          result.data.subtotalAmount + result.data.shippingAmount,
        );
      }

      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toContain(
        `/public/storefronts/${STORE_SLUG}/checkout`,
      );
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify(checkoutBody));
    });

    it("snapshots order item title, sku, and price from the response", async () => {
      const order = mockOrder();
      fetchMock.mockResolvedValueOnce(jsonResponse(successEnvelope(order)));

      const result = await postCheckout(STORE_SLUG, checkoutBody);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const line = result.data.items[0];
        expect(line.title).toBe("Linen Shirt");
        expect(line.sku).toBe("LS-001");
        expect(line.unitPriceAmount).toBe(15000);
        expect(line.totalAmount).toBe(line.unitPriceAmount * line.quantity);
      }
    });

    it("returns networkFailure when fetch throws", async () => {
      fetchMock.mockRejectedValueOnce(new Error("offline"));

      const result = await postCheckout(STORE_SLUG, checkoutBody);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(0);
        expect(result.errorMessage).toMatch(/could not complete checkout/i);
      }
    });

    it("surfaces CART_EMPTY from the API", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(errorEnvelope("CART_EMPTY", "Cart has no items"), 400),
      );

      const result = await postCheckout(STORE_SLUG, checkoutBody);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errorCode).toBe("CART_EMPTY");
      }
    });

    it("surfaces CHECKOUT_VALIDATION_ERROR from the API", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(
          errorEnvelope("CHECKOUT_VALIDATION_ERROR", "Phone is required"),
          400,
        ),
      );

      const result = await postCheckout(STORE_SLUG, {
        ...checkoutBody,
        customer: { name: "Ada", phone: "" },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errorCode).toBe("CHECKOUT_VALIDATION_ERROR");
      }
    });
  });

  describe("getOrderConfirmation", () => {
    it("GETs order confirmation by id", async () => {
      const order = mockOrder();
      fetchMock.mockResolvedValueOnce(jsonResponse(successEnvelope(order)));

      const result = await getOrderConfirmation(STORE_SLUG, ORDER_ID);

      expect(result).toEqual({ ok: true, data: {
        ...order,
        cancellationRequestStatus: null,
        shippingAddress: { ...order.shippingAddress, line2: undefined },
      } });
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toContain(
        `/public/storefronts/${STORE_SLUG}/orders/${ORDER_ID}`,
      );
      expect(init?.cache).toBe("no-store");
    });

    it("surfaces ORDER_NOT_FOUND", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(errorEnvelope("ORDER_NOT_FOUND", "Order missing"), 404),
      );

      const result = await getOrderConfirmation(STORE_SLUG, "missing");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errorCode).toBe("ORDER_NOT_FOUND");
      }
    });

    it("returns networkFailure when fetch throws", async () => {
      fetchMock.mockRejectedValueOnce(new Error("offline"));

      const result = await getOrderConfirmation(STORE_SLUG, ORDER_ID);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errorMessage).toMatch(/could not load order confirmation/i);
      }
    });
  });
});
