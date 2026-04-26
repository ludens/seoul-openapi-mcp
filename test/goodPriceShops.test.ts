import { describe, expect, test } from "vitest";
import { searchGoodPriceShops } from "../src/tools/goodPriceShopsTool.js";

describe("searchGoodPriceShops", () => {
  test("searches static good-price shop data by district, item name, and max item price", async () => {
    const output = await searchGoodPriceShops({
      districtName: "송파구",
      itemName: "아메리카노",
      maxItemPrice: 4000,
      limit: 5,
    });

    expect(output.dataSource).toBe("static-json");
    expect(output.totalCount).toBeGreaterThan(0);
    expect(output.rows.length).toBeGreaterThan(0);
    expect(output.rows.length).toBeLessThanOrEqual(5);

    for (const shop of output.rows) {
      expect(shop.address).toContain("송파구");
      expect(shop.items.length).toBeGreaterThan(0);
      expect(
        shop.items.some(
          (item) =>
            item.name.includes("아메리카노") && item.price <= 4000,
        ),
      ).toBe(true);
    }
  });

  test("joins every static shop with its product rows by shop id", async () => {
    const output = await searchGoodPriceShops({ limit: 2000 });

    expect(output.totalCount).toBe(1867);
    expect(output.rows).toHaveLength(1867);
    expect(output.rows.filter((shop) => shop.items.length > 0)).toHaveLength(
      1862,
    );
  });
});
