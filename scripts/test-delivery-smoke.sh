#!/usr/bin/env bash
# End-to-end delivery smoke test against local backend (Step 14).
# Usage:
#   export SME_EMAIL='you@example.com'
#   export SME_PASSWORD='your-password'
#   ./scripts/test-delivery-smoke.sh
#
# Optional: SME_API=http://localhost:8080/api/v1  STORE_SLUG=bridge-labs

set -euo pipefail

SME_API="${SME_API:-http://localhost:8080/api/v1}"
STORE_SLUG="${STORE_SLUG:-bridge-labs}"
PUBLIC="${SME_API}/public/storefronts/${STORE_SLUG}"

if [[ -z "${SME_EMAIL:-}" || -z "${SME_PASSWORD:-}" ]]; then
  echo "Set SME_EMAIL and SME_PASSWORD (merchant owner of ${STORE_SLUG})." >&2
  exit 1
fi

echo "== Login =="
LOGIN=$(curl -s -X POST "${SME_API}/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${SME_EMAIL}\",\"password\":\"${SME_PASSWORD}\"}")
TOKEN=$(echo "$LOGIN" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("success"), d; print(d["data"]["accessToken"])')
WORKSPACE=$(curl -s "${PUBLIC}" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["workspaceId"])')
echo "workspaceId=${WORKSPACE}"

echo "== Enable Bob Go shipping (collection address) =="
curl -s -X PUT "${SME_API}/workspaces/${WORKSPACE}/shipping/settings" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "bobgo",
    "enabled": true,
    "allowPickup": true,
    "pickupLabel": "Collect in store",
    "collectionAddress": {
      "line1": "1 Warehouse Road",
      "city": "Cape Town",
      "province": "Western Cape",
      "postalCode": "7441",
      "country": "ZA"
    }
  }' | python3 -m json.tool | head -20

echo "== Cart + item =="
CART=$(curl -s -X POST "${PUBLIC}/carts")
CART_ID=$(echo "$CART" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["id"])')
PRODUCT=$(curl -s "${PUBLIC}/products?limit=1" | python3 -c '
import sys,json
items=json.load(sys.stdin)["data"]
print(items[0]["id"])
')
curl -s -X POST "${PUBLIC}/carts/${CART_ID}/items" \
  -H 'Content-Type: application/json' \
  -d "{\"productId\":\"${PRODUCT}\",\"quantity\":1}" >/dev/null
echo "cartId=${CART_ID} productId=${PRODUCT}"

echo "== Shipping quote =="
QUOTE=$(curl -s -X POST "${PUBLIC}/shipping/quote" \
  -H 'Content-Type: application/json' \
  -d "{
    \"cartId\": \"${CART_ID}\",
    \"shippingAddress\": {
      \"line1\": \"45 Bree Street\",
      \"city\": \"Cape Town\",
      \"province\": \"Western Cape\",
      \"postalCode\": \"8001\",
      \"country\": \"ZA\"
    }
  }")
echo "$QUOTE" | python3 -m json.tool

OPTION_ID=$(echo "$QUOTE" | python3 -c '
import sys,json
d=json.load(sys.stdin)
if not d.get("success"):
  raise SystemExit(0)
opts=d["data"].get("options") or []
print(opts[0]["id"] if opts else "")
' || true)
AMOUNT=$(echo "$QUOTE" | python3 -c '
import sys,json
d=json.load(sys.stdin)
if not d.get("success"):
  raise SystemExit(0)
opts=d["data"].get("options") or []
print(opts[0]["amount"] if opts else "")
' || true)
TOKEN_BG=$(echo "$QUOTE" | python3 -c '
import sys,json
d=json.load(sys.stdin)
if not d.get("success"):
  raise SystemExit(0)
opts=d["data"].get("options") or []
t=opts[0].get("bobgoRateToken") if opts else None
print(t or "")
' || true)

if [[ -z "${OPTION_ID}" ]]; then
  echo "No shipping options — check BOBGO_* in backend .env and collection address." >&2
  exit 1
fi

echo "== Checkout with shippingSelection =="
CHECKOUT_BODY=$(python3 <<PY
import json
sel = {
  "optionId": "${OPTION_ID}",
  "provider": "bobgo",
  "amount": int("${AMOUNT}"),
  "currency": "ZAR",
}
if "${TOKEN_BG}":
  sel["bobgoRateToken"] = "${TOKEN_BG}"
body = {
  "cartId": "${CART_ID}",
  "customer": {"name": "Delivery Test", "email": "delivery-test@example.com", "phone": "+27821234567"},
  "shippingAddress": {
    "line1": "45 Bree Street", "city": "Cape Town", "province": "Western Cape",
    "postalCode": "8001", "country": "ZA"
  },
  "shippingSelection": sel,
}
print(json.dumps(body))
PY
)
ORDER=$(curl -s -X POST "${PUBLIC}/checkout" -H 'Content-Type: application/json' -d "$CHECKOUT_BODY")
echo "$ORDER" | python3 -m json.tool | head -35

ORDER_ID=$(echo "$ORDER" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["data"]["id"] if d.get("success") else "")')
if [[ -n "${ORDER_ID}" ]]; then
  echo "== Public shipping status (pre-pay) =="
  curl -s "${PUBLIC}/orders/${ORDER_ID}/shipping" | python3 -m json.tool
  echo ""
  echo "Next: pay order in storefront, then check shipment or POST .../shipping/create-shipment"
  echo "Storefront: http://localhost:3000/s/${STORE_SLUG}/order/${ORDER_ID}"
fi
