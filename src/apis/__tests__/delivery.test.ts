import {
  bookUberDirectDelivery,
  getCustomerDeliveryOptions,
  getDeliverySettings,
  refreshUberDirectDeliveryStatus,
  updateDeliverySettings,
} from "@/apis/delivery";
import { normalizeOrder } from "@/apis/orders";
import type {
  CustomerDeliveryOptionsInput,
  DeliverySettings,
  UpdateDeliverySettingsBody,
} from "@/types/delivery";
import {
  errorEnvelope,
  jsonResponse,
  mockOrder,
  successEnvelope,
} from "@/apis/__tests__/test-helpers";

const WORKSPACE_ID = "ws/1";
const ORDER_ID = "order/2";
const TOKEN = "merchant-token";

const settings: DeliverySettings = {
  workspaceId: "ws/1",
  uberDirectEnabled: true,
  uberDirectAvailable: true,
  pickupAddressLine1: "12 Main Street",
  pickupAddressLine2: "Unit 4",
  pickupCity: "Cape Town",
  pickupProvince: "Western Cape",
  pickupPostalCode: "8001",
  pickupCountry: "ZA",
  pickupLatitude: -33.9249,
  pickupLongitude: 18.4241,
  pickupContactName: "Store Manager",
  pickupContactPhone: "+27821234567",
  updatedAt: "2026-09-29T12:00:00Z",
};

const settingsBody: UpdateDeliverySettingsBody = {
  uberDirectEnabled: true,
  pickupAddressLine1: "12 Main Street",
  pickupAddressLine2: "Unit 4",
  pickupCity: "Cape Town",
  pickupProvince: "Western Cape",
  pickupPostalCode: "8001",
  pickupCountry: "ZA",
  pickupLatitude: -33.9249,
  pickupLongitude: 18.4241,
  pickupContactName: "Store Manager",
  pickupContactPhone: "+27821234567",
};

const optionsInput: CustomerDeliveryOptionsInput = {
  dropoffAddressLine1: "1 Long Street",
  dropoffAddressLine2: "Floor 2",
  dropoffCity: "Cape Town",
  dropoffProvince: "Western Cape",
  dropoffPostalCode: "8001",
  dropoffCountry: "ZA",
  dropoffLatitude: -33.9249,
  dropoffLongitude: 18.4241,
  cartTotal: 450,
};

describe("delivery API", () => {
  const fetchMock = jest.fn<
    Promise<Response>,
    [RequestInfo | URL, RequestInit?]
  >();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("GETs authenticated delivery settings", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(successEnvelope(settings)));

    const result = await getDeliverySettings(WORKSPACE_ID, TOKEN);

    expect(result).toEqual({ ok: true, data: settings });
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/api/v1/workspaces/ws%2F1/delivery-settings",
    );
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    });
  });

  it("PUTs authenticated delivery settings", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(successEnvelope(settings)));

    const result = await updateDeliverySettings(
      WORKSPACE_ID,
      TOKEN,
      settingsBody,
    );

    expect(result.ok).toBe(true);
    expect(fetchMock.mock.calls[0][1]?.method).toBe("PUT");
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify(settingsBody));
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  });

  it("POSTs public delivery options without auth and preserves manifest cents", async () => {
    const response = {
      storeSlug: "shop one",
      options: [
        {
          quoteId: "quote_1",
          providerName: "Uber Direct",
          estimatedDeliveryTime: "12–35 min",
          fee: 49.99,
          currency: "ZAR",
          expiresAt: "2026-09-24T10:30:00Z",
          available: true,
          unavailableReason: null,
        },
      ],
    };
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: response }));

    const result = await getCustomerDeliveryOptions("shop one", optionsInput);

    expect(result).toEqual({ ok: true, data: response });
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/api/v1/public/storefronts/shop%20one/checkout/delivery-options",
    );
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      dropoffAddressLine1: "1 Long Street",
      dropoffAddressLine2: "Floor 2",
      dropoffCity: "Cape Town",
      dropoffProvince: "Western Cape",
      dropoffPostalCode: "8001",
      dropoffCountry: "ZA",
      dropoffLatitude: -33.9249,
      dropoffLongitude: 18.4241,
      manifestTotalValueCents: 45000,
    });
  });

  it("unwraps the documented data-wrapped delivery options response", async () => {
    const response = {
      storeSlug: "shop one",
      options: [],
    };
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: response }));

    const result = await getCustomerDeliveryOptions("shop one", optionsInput);

    expect(result).toEqual({ ok: true, data: response });
  });

  it("books a delivery with an encoded quote id and JWT", async () => {
    const response = {
      id: "delivery_1",
      status: "pending",
      tracking_url: "https://www.uber.com/track/delivery_1",
      courier: { name: "John D.", phone: "+27000000000" },
      pickup_eta: 12,
      dropoff_eta: 35,
    };
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: response }));

    const result = await bookUberDirectDelivery(
      WORKSPACE_ID,
      ORDER_ID,
      "quote 3",
      TOKEN,
    );

    expect(result).toEqual({
      ok: true,
      data: {
        id: "delivery_1",
        status: "pending",
        trackingUrl: "https://www.uber.com/track/delivery_1",
        courier: { name: "John D.", phone: "+27000000000" },
        pickupEta: 12,
        dropoffEta: 35,
      },
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/uber-direct/orders/order%2F2/book?quoteId=quote%203",
    );
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    });
  });

  it("POSTs an authenticated delivery status refresh", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          id: "delivery_1",
          status: "pickup_complete",
          tracking_url: "https://www.uber.com/track/delivery_1",
          courier: { name: "John D.", phone: "+27000000000" },
          pickup_eta: 0,
          dropoff_eta: 20,
        },
      }),
    );

    const result = await refreshUberDirectDeliveryStatus(
      WORKSPACE_ID,
      ORDER_ID,
      TOKEN,
    );

    expect(result).toEqual({
      ok: true,
      data: {
        id: "delivery_1",
        status: "pickup_complete",
        trackingUrl: "https://www.uber.com/track/delivery_1",
        courier: { name: "John D.", phone: "+27000000000" },
        pickupEta: 0,
        dropoffEta: 20,
      },
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/uber-direct/orders/order%2F2/refresh-status",
    );
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    });
  });

  it("preserves the backend message for HTTP 400", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        errorEnvelope("INVALID_PICKUP_ADDRESS", "Pickup address is invalid"),
        400,
      ),
    );

    const result = await getDeliverySettings(WORKSPACE_ID, TOKEN);

    expect(result).toMatchObject({
      ok: false,
      errorCode: "INVALID_PICKUP_ADDRESS",
      errorMessage: "Pickup address is invalid",
      status: 400,
    });
  });

  it.each([
    [502, "Delivery service is temporarily unavailable. Please try again."],
    [503, "Uber Direct is currently unavailable."],
  ])("maps HTTP %i to the delivery-specific message", async (status, message) => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(errorEnvelope("DELIVERY_ERROR", "Backend detail"), status),
    );

    const result = await getDeliverySettings(WORKSPACE_ID, TOKEN);

    expect(result).toMatchObject({
      ok: false,
      errorCode: "DELIVERY_ERROR",
      errorMessage: message,
      status,
    });
  });

  it("returns a network failure when the backend request throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));

    const result = await getDeliverySettings(WORKSPACE_ID, TOKEN);

    expect(result).toMatchObject({
      ok: false,
      errorMessage:
        "Unable to connect to the delivery service. Please try again.",
      status: 0,
    });
  });

  it("preserves delivery selection and created delivery in normalized orders", () => {
    const order = normalizeOrder(
      mockOrder({
        deliveryMethod: "UBER_DIRECT",
        deliveryQuoteId: "quote_xyz789",
        deliveryEstimatedDeliveryTime: "12–35 min",
        delivery: {
          id: "del_abc123",
          status: "pending",
          trackingUrl: "https://www.uber.com/track/del_abc123",
          courier: { name: "John D.", phone: "+27..." },
          pickupEta: 12,
          dropoffEta: 35,
        },
      }),
    );

    expect(order.deliveryMethod).toBe("UBER_DIRECT");
    expect(order.deliveryQuoteId).toBe("quote_xyz789");
    expect(order.delivery?.id).toBe("del_abc123");
    expect(order.delivery?.trackingUrl).toBe(
      "https://www.uber.com/track/del_abc123",
    );
  });
});