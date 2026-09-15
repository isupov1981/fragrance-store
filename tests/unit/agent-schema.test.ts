import { describe, expect, it } from "vitest";
import { createProductInputSchema } from "@/lib/agent/schema";
import { parseAdminProductInput } from "@/lib/agent/products";
import { toSlug } from "@/lib/catalog/slug";

describe("createProductInputSchema", () => {
  it("accepts sample-size ILS variants as DRAFT-ready payload", () => {
    const parsed = createProductInputSchema.parse({
      name: "Notre-Dame",
      slug: "notre-dame-test",
      description: "Incense, wet stone and a thread of light after the fire.",
      descriptionHe: "קטורת, אבן לחה וחוט אור אחרי השריפה במקדש.",
      brand: "Filippo Sorcinelli",
      category: "woody",
      merchandising: ["back-in-stock", "testers-refills"],
      concentration: "extrait",
      variants: [
        { name: "1 ml", sku: "FS-NDT-1", price: 3200, stock: 10 },
        { name: "3 ml", sku: "FS-NDT-3", price: 7900, stock: 8 },
      ],
    });
    expect(parsed.variants).toHaveLength(2);
    expect(parsed.featured).toBe(false);
    expect(parsed.merchandising).toEqual(["back-in-stock", "testers-refills"]);
  });
});

describe("parseAdminProductInput", () => {
  it("maps the simple admin form into a single-variant draft", () => {
    const parsed = parseAdminProductInput({
      name: "Amber Veil",
      slug: "amber-veil-draft",
      description: "A warm enveloping amber composition.",
      sku: "MS-AV-D",
      price: 62496,
      stock: 3,
      imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601",
      brand: "Maison Sol",
      category: "amber",
    });
    expect(parsed.variants[0]?.sku).toBe("MS-AV-D");
    expect(parsed.images?.[0]?.url).toContain("unsplash");
  });
});

describe("toSlug", () => {
  it("slugifies brand names", () => {
    expect(toSlug("Filippo Sorcinelli")).toBe("filippo-sorcinelli");
  });
});
