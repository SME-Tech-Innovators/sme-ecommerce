# Merchant returns

The order detail panel uses authenticated backend APIs for full Bob Go returns and Paystack refunds. No provider credentials or direct provider calls are used in the browser.

Contract checked against `SME-Tech-Backend/sme/docs/order-returns.md`, `OrderReturnController`, `ReturnQuoteRequest`, `OrderReturnDto`, `OrderReturnService`, `OrderConfirmationDto`, `OrderShippingService` and `GlobalExceptionHandler`.

- The order DTO has no shipping provider. The authenticated order `/shipping` endpoint supplies it.
- Only GET `/return` with HTTP 400, code `VALIDATION_ERROR` and the exact message `Return not found; request a return quote first` means no return. A dedicated backend absence code would remove this message dependency.
- Return rates are minor units; order totals and original payments are major units.
- The return DTO omits the quote creation/expiry time and submitted contact/parcel fields. Reopening a quoted return requires re-entering details and recalculating rates. A locally obtained quote expires conservatively 15 minutes after its request starts; changing fields invalidates it immediately.
- Workspace/shipping settings do not expose a merchant return contact. Contact fields remain blank for the merchant to supply real details.
- The return DTO has no tracking URL or provider environment. Only the supplied tracking reference is displayed and can be copied; no tracking or label URL is invented.
- Recorded returns remain accessible after payment becomes refunded. `PROCESSED` alone is displayed as refunded and invalidates the merchant order cache prefix (both lists and details).
- Refresh polling is serial, every 10 seconds, bounded to five minutes from the first pending refund observed while open. Closing the dialog cancels future checks; a request already in flight may finish and update only its order's cache. Manual refresh remains available.
- Every failed mutation is followed by a recorded-state read before another attempt can be enabled. In-flight commands are locked per workspace/order even across panel remounts. Unknown/submitting statuses and failed refunds require operator intervention.
- Receipt and refund require separate explicit confirmations. No inventory is automatically restored.

Validation uses Jest API mocks, state/validation/polling tests, hook command tests and server-rendered entry-point tests. No live shipment booking or refund is part of validation. Interactive browser and provider sandbox validation remain deployment checks.

## Bob Go owns outbound delivery progress and cancellation

The dashboard no longer offers **Mark preparing**, **Mark fulfilled**, or a local **Cancel order** action. Its Delivery panel reads `/shipping`, refreshes through `POST /shipping/refresh`, and requests cancellation through `POST /shipping/cancel`. All are authenticated workspace/order routes. The backend returns `canCancel`; no cancellation button is shown against older backends that omit this capability.

Changes in the sibling `SME-Tech-Backend` repository:

- Signed Bob Go webhooks and explicit tracking refreshes use one transactionally locked status synchronizer. Created/in-transit shipments move paid orders to `PROCESSING`; only `delivered` moves them to `FULFILLED`. Exact status matching prevents `out-for-delivery` or `delivery-failed` from being treated as delivered. Unknown and stale events cannot regress known terminal shipment states.
- Cancellation uses Bob Go `POST /shipments/cancel` with the actual tracking reference. Existing integration books standalone shipments, so a Bob Go order ID is neither required nor fabricated. Source: [official Bob Go API collection](https://api-docs.bob.co.za/postman-collections/bobgo.postman_collection.json).
- Cancellation is offered before collection. A durable `CANCEL_REQUESTED` claim is committed before the provider call. Ambiguous errors become `CANCELLATION_UNKNOWN`; repeated requests never blindly repeat the provider operation. Only a provider `cancelled` status changes the local order to `CANCELLED`.
- Confirmed cancellation does not refund a payment or restore inventory. Those require separate review. The existing return/refund flow remains for delivered orders; this change does not add a pre-delivery Paystack refund flow.
- The legacy order PATCH endpoint rejects manual fulfilment changes for Bob Go orders. Non-Bob-Go orders have no delivery actions in this dashboard.
- Delivery refresh runs sequentially every 15 seconds, for five minutes while the selected order is open, with manual refresh afterwards. Webhooks continue updating the backend independently of the dashboard.

Deployment: apply `SME-Tech-Backend/sme/docs/sql/V16__bobgo_cancellation_statuses.sql` before deploying/restarting the updated backend, and ensure the existing signed Bob Go webhook reaches `/api/v1/webhooks/bobgo`. This development task does not apply database migrations, restart a deployed backend, or make live provider requests. Old backends do not expose the new refresh/cancellation routes.
