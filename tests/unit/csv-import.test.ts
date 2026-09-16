import { describe, expect, it } from "vitest";
import { importProducts, parseProductCsv } from "@/lib/import/products";

describe("parseProductCsv", () => {
  it("parses valid rows and converts decimal prices to cents", () => {
    const csv = [
      "sku,name,slug,description,variantName,price,stock,status,featured,brand,category,imageUrl",
      "MS-AV-50,Amber Veil,amber-veil,Warm amber,50 ml,168.00,12,ACTIVE,true,Maison Sol,amber,",
    ].join("\n");
    const result = parseProductCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.price).toBe(16800);
    expect(result.rows[0]?.featured).toBe(true);
    expect(result.rows[0]?.newArrival).toBe(false);
  });

  it("reports row-level validation errors", () => {
    const csv = "sku,name,slug,description,variantName,price,stock\n,Bad,,x,Default,not-a-price,-1";
    const result = parseProductCsv(csv);
    expect(result.rows).toEqual([]);
    expect(result.errors[0]?.row).toBe(2);
    expect(result.errors[0]?.issues.length).toBeGreaterThan(0);
  });
});

describe("importProducts", () => {
  it("counts created and updated rows from the repository", async () => {
    const seen = new Set<string>();
    const summary = await importProducts(
      [
        {
          sku: "A",
          name: "One",
          slug: "one",
          description: "Description long enough",
          variantName: "50 ml",
          price: 1000,
          stock: 1,
          status: "ACTIVE",
          featured: false,
          newArrival: false,
          brand: "",
          category: "",
          imageUrl: "",
        },
        {
          sku: "A",
          name: "One",
          slug: "one",
          description: "Description long enough",
          variantName: "50 ml",
          price: 1100,
          stock: 2,
          status: "ACTIVE",
          featured: false,
          newArrival: false,
          brand: "",
          category: "",
          imageUrl: "",
        },
      ],
      {
        async upsert(row) {
          if (seen.has(row.sku)) return "updated";
          seen.add(row.sku);
          return "created";
        },
      },
    );
    expect(summary).toEqual({ created: 1, updated: 1 });
  });
});
