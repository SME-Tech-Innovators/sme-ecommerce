# Step 13: Meta WhatsApp Catalog (official)

Sync merchant **active products** from SME Operations to a **Meta Commerce
catalog** linked to **WhatsApp Business**, so customers browse and order from
the in-app WhatsApp catalog.

## Goal

After this step:

1. Merchant connects Meta (catalog + token) in **Settings → WhatsApp**.
2. Merchant clicks **Sync catalog** — active products appear in WhatsApp Business.
3. Product create/update/archive triggers re-sync (or nightly job).
4. Storefront `wa.me` links remain; catalog is the official Meta surface.

## Scope

### Included

- Workspace-scoped Meta connection (catalog ID + encrypted token).
- Manual + scheduled sync of `status = active` products.
- Field mapping: title, description, price, currency, image, product URL, stock.
- Sync status + error log per product / per run.
- Merchant APIs + dashboard UI in this repo.

### Not included (v1)

- WhatsApp Cloud API order messages / cart webhooks.
- Meta OAuth embedded signup (manual token + catalog ID first).
- Product variants / item groups.
- Multi-catalog per workspace.

## Merchant setup (Meta side)

1. [Meta Business Suite](https://business.facebook.com/) — Business verified.
2. **Commerce Manager** → Create **Catalog** (or use existing).
3. **WhatsApp Business Account (WABA)** → Link catalog:
   Settings → Commerce → Catalog → select catalog.
4. **System User** (Business Settings → Users → System users):
   - Create system user, assign assets (Catalog + WhatsApp account).
   - Generate token with:
     - `catalog_management`
     - `business_management`
     - `whatsapp_business_management` (if needed for health checks)
5. Note:
   - **Catalog ID** (numeric)
   - **Access token** (long-lived system user token)
   - Optional: **WABA ID** for status display

Official refs:

- [Catalog batch API](https://developers.facebook.com/docs/marketing-api/catalog-batch)
- [WhatsApp Commerce](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/sell-products-and-services)

## Product mapping (SME → Meta)

| Meta field | SME source | Notes |
| --- | --- | --- |
| `retailer_id` | `product.sku` or `product.id` | Stable; never change after first sync |
| `name` | `product.title` | Max 200 chars |
| `description` | `product.summary` | Plain text; strip HTML |
| `price` | `product.priceAmount / 100` | String decimal, e.g. `"249.00"` |
| `currency` | `product.currency` | e.g. `ZAR` |
| `image_url` | `product.imageUrl` | **HTTPS**, publicly reachable |
| `additional_image_link` | `product.galleryUrls[]` | Optional |
| `url` | `{APP_ORIGIN}/s/{storeSlug}/shop/{slug}` | Product deep link |
| `availability` | `inStock ? "in stock" : "out of stock"` | |
| `condition` | `"new"` | Default |
| `brand` | published `storeName` | Optional |

**Sync rules**

- `active` + valid image + price → **CREATE** or **UPDATE** in catalog.
- `archived` / `draft` → **DELETE** from catalog (or hide).
- Missing HTTPS image → skip + log error (Meta rejects).

Reference mapper in frontend: `src/lib/meta-whatsapp-catalog-mapper.ts`.

## Meta Graph API calls (backend)

Base: `https://graph.facebook.com/v21.0`

### Upsert products (batch)

```http
POST /{catalog-id}/items_batch
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "item_type": "PRODUCT_ITEM",
  "requests": [
    {
      "method": "CREATE",
      "retailer_id": "SKU-001",
      "data": {
        "name": "Stoneware mug",
        "description": "Handmade mug set",
        "price": "320.00 ZAR",
        "image_url": "https://cdn.example.com/mug.jpg",
        "url": "https://sme-operations.netlify.app/s/my-store/shop/stoneware-mug",
        "availability": "in stock",
        "condition": "new"
      }
    },
    {
      "method": "UPDATE",
      "retailer_id": "SKU-002",
      "data": { "availability": "out of stock" }
    },
    {
      "method": "DELETE",
      "retailer_id": "SKU-OLD"
    }
  ]
}
```

Batch in chunks of **≤ 5000** requests; v1 can use **≤ 50** per sync tick.

### Health check

```http
GET /{catalog-id}?fields=id,name,product_count
GET /{waba-id}?fields=id,name,message_template_namespace
```

## Database

### `workspace_whatsapp_integrations`

| Column | Type | Notes |
| --- | --- | --- |
| `workspace_id` | FK | PK |
| `meta_catalog_id` | string | Commerce catalog ID |
| `meta_waba_id` | string nullable | Display / health |
| `access_token_enc` | text | Encrypted at rest |
| `status` | enum | `not_connected`, `connected`, `error` |
| `last_sync_at` | timestamp nullable | |
| `last_sync_status` | enum | `idle`, `running`, `success`, `partial`, `failed` |
| `last_sync_summary` | JSON nullable | `{ synced, skipped, failed }` |
| `created_at` / `updated_at` | timestamp | |

### `whatsapp_catalog_sync_items`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | PK | |
| `workspace_id` | FK | |
| `product_id` | FK | |
| `retailer_id` | string | Meta key |
| `last_sync_at` | timestamp | |
| `last_error` | string nullable | |

## Merchant APIs

Auth: workspace owner JWT.

### Get integration

```http
GET /workspaces/{workspaceId}/integrations/whatsapp
```

```json
{
  "success": true,
  "data": {
    "status": "connected",
    "metaCatalogId": "123456789",
    "metaWabaId": "987654321",
    "hasAccessToken": true,
    "lastSyncAt": "2026-05-22T10:00:00Z",
    "lastSyncStatus": "success",
    "lastSyncSummary": { "synced": 12, "skipped": 1, "failed": 0 }
  }
}
```

Never return raw `access_token` after save.

### Connect / update credentials

```http
PUT /workspaces/{workspaceId}/integrations/whatsapp
Content-Type: application/json

{
  "metaCatalogId": "123456789",
  "metaWabaId": "987654321",
  "accessToken": "EAAG..."
}
```

Backend validates token against catalog ID, sets `status: connected`.

### Disconnect

```http
DELETE /workspaces/{workspaceId}/integrations/whatsapp
```

Clears token; optional: batch DELETE all synced retailer IDs from Meta.

### Sync now

```http
POST /workspaces/{workspaceId}/integrations/whatsapp/sync
```

```json
{
  "success": true,
  "data": {
    "lastSyncStatus": "success",
    "lastSyncSummary": { "synced": 12, "skipped": 1, "failed": 0 },
    "errors": [
      { "productId": "...", "title": "...", "message": "image_url not reachable" }
    ]
  }
}
```

### Sync log (optional v1.1)

```http
GET /workspaces/{workspaceId}/integrations/whatsapp/sync-log?limit=20
```

## Auto-sync triggers

After v1 manual sync, hook:

- `POST/PATCH` product publish → enqueue sync for that product.
- `POST` product archive → DELETE in Meta catalog.
- Nightly job for drift correction.

## Frontend (this repo)

| File | Role |
| --- | --- |
| `src/types/whatsapp-integration.ts` | DTOs |
| `src/apis/whatsapp-integration.ts` | API client |
| `src/hooks/use-whatsapp-integration.ts` | React Query |
| `src/components/dashboard/whatsapp-settings-panel.tsx` | Settings UI |
| `src/lib/meta-whatsapp-catalog-mapper.ts` | Product → Meta payload (shared logic) |

Settings → tabs: **Payments** | **WhatsApp**.

## Validation

- [ ] Merchant can save catalog ID + token; status becomes `connected`.
- [ ] Sync pushes active products with HTTPS images to Meta catalog.
- [ ] Archived products removed from catalog.
- [ ] Out-of-stock products show `out of stock` in Meta.
- [ ] Product URLs open public PDP `/s/{slug}/shop/{productSlug}`.
- [ ] Token stored encrypted; not returned on GET.
- [ ] WhatsApp Business app shows catalog after Meta link + sync.

## Error codes

| Code | Meaning |
| --- | --- |
| `WHATSAPP_NOT_CONFIGURED` | No integration row |
| `META_AUTH_FAILED` | Invalid / expired token |
| `META_CATALOG_NOT_FOUND` | Bad catalog ID |
| `META_SYNC_FAILED` | Graph API batch error |
| `PRODUCT_IMAGE_NOT_PUBLIC` | Skip product |

## Security

- Encrypt `access_token` (Azure Key Vault / app secret).
- Rate-limit sync: e.g. 1 manual sync / 5 min / workspace.
- Log Meta errors without leaking token.

## Acceptance (merchant)

1. Connect Meta catalog in Settings.
2. Publish storefront + ≥ 1 active product with image.
3. Run sync → products visible in WhatsApp Business catalog.
4. Customer opens WhatsApp → Catalog → sees products with prices.
