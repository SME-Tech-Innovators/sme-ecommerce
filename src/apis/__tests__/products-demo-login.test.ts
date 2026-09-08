import { listProducts, listCategories } from "@/apis/products";

describe("demo product APIs", () => {
  it("returns demo products for the local access token", async () => {
    const result = await listProducts("demo-workspace-456", "demo-local-token");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items.length).toBeGreaterThan(0);
      expect(result.data.items[0]?.title).toBe("Classic Tee");
    }
  });

  it("returns demo categories for the local access token", async () => {
    const result = await listCategories("demo-workspace-456", "demo-local-token");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0]?.name).toBe("Hair");
      expect(result.data.map((category) => category.name)).toContain("Food");
      expect(result.data.map((category) => category.name)).toContain("Clothing");
      expect(result.data.map((category) => category.name)).toContain("Toy");
    }
  });
});
