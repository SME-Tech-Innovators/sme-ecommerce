import { productToMetaCatalogPayload } from "@/lib/meta-whatsapp-catalog-mapper";
import type { ProductApi } from "@/types/product";

function sampleProduct(overrides: Partial<ProductApi> = {}): ProductApi {
  return {
    id: "prod-1",
    workspaceId: "ws-1",
    title: "Stoneware mug",
    slug: "stoneware-mug",
    sku: "MUG-001",
    priceAmount: 32000,
    compareAtPriceAmount: null,
    currency: "ZAR",
    priceLabel: "R 320.00",
    compareAtPriceLabel: null,
    onSale: false,
    quantityAvailable: 5,
    inStock: true,
    category: { id: "c1", name: "Homeware", slug: "homeware" },
    status: "active",
    mainImageId: "m1",
    imageUrl: "https://cdn.example.com/mug.jpg",
    summary: "Handmade mug set",
    galleryMediaIds: [],
    galleryUrls: [],
    configurationLabel: "",
    warrantyNote: "",
    shippingNote: "",
    metadata: {},
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("meta whatsapp catalog mapper", () => {
  it("maps active product with HTTPS image", () => {
    const payload = productToMetaCatalogPayload({
      product: sampleProduct(),
      storeSlug: "my-store",
      storeName: "Artisan Atelier",
    });
    expect(payload).toMatchObject({
      retailer_id: "MUG-001",
      name: "Stoneware mug",
      price: "320.00 ZAR",
      currency: "ZAR",
      availability: "in stock",
      condition: "new",
      brand: "Artisan Atelier",
    });
    expect(payload?.url).toContain("/s/my-store/shop/stoneware-mug");
  });

  it("returns null for draft products", () => {
    expect(
      productToMetaCatalogPayload({
        product: sampleProduct({ status: "draft" }),
        storeSlug: "my-store",
      }),
    ).toBeNull();
  });

  it("returns null without HTTPS image", () => {
    expect(
      productToMetaCatalogPayload({
        product: sampleProduct({ imageUrl: "http://insecure.example.com/x.jpg" }),
        storeSlug: "my-store",
      }),
    ).toBeNull();
  });
});
