import {
  getPublicOrderShipping,
  postShippingQuote,
} from "@/apis/shipping";
import {
  CART_ID,
  ORDER_ID,
  STORE_SLUG,
  errorEnvelope,
  jsonResponse,
  successEnvelope,
} from "@/apis/__tests__/test-helpers";

describe("shipping API", () => {
  const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  describe("postShippingQuote", () => {
    const body = {
      cartId: CART_ID,
      shippingAddress: {
        line1: "1 Long St",
        city: "Cape Town",
        province: "WC",
        postalCode: "8001",
        country: "ZA",
      },
    };

    it("POSTs quote request and maps options", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(
          successEnvelope({
            options: [
              {
                id: "opt_1",
                provider: "bobgo",
                label: "Standard",
                amount: 8900,
                currency: "ZAR",
                bobgoRateToken: "token_abc",
              },
            ],
          }),
        ),
      );

      const result = await postShippingQuote(STORE_SLUG, body);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.options).toHaveLength(1);
        expect(result.data.options[0].amount).toBe(8900);
        expect(result.data.options[0].bobgoRateToken).toBe("token_abc");
      }

      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toContain(
        `/public/storefronts/${STORE_SLUG}/shipping/quote`,
      );
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify(body));
    });

    it("surfaces SHIPPING_NOT_CONFIGURED", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(
          errorEnvelope("SHIPPING_NOT_CONFIGURED", "Shipping disabled"),
          400,
        ),
      );

      const result = await postShippingQuote(STORE_SLUG, body);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errorCode).toBe("SHIPPING_NOT_CONFIGURED");
      }
    });
  });

  describe("getPublicOrderShipping", () => {
    it("GETs delivery status for an order", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(
          successEnvelope({
            provider: "bobgo",
            status: "in_transit",
            statusLabel: "In transit",
            trackingReference: "BG123",
            trackingUrl: "https://track.sandbox.bobgo.co.za/BG123",
            carrierName: "Courier",
            shippingOptionLabel: "Standard",
            lastError: null,
          }),
        ),
      );

      const result = await getPublicOrderShipping(STORE_SLUG, ORDER_ID);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.trackingReference).toBe("BG123");
        expect(result.data.trackingUrl).toBe(
          "https://track.sandbox.bobgo.co.za/BG123",
        );
        expect(result.data.statusLabel).toBe("In transit");
      }

      const [url] = fetchMock.mock.calls[0];
      expect(String(url)).toContain(
        `/public/storefronts/${STORE_SLUG}/orders/${ORDER_ID}/shipping`,
      );
    });
  });
});
