import { describe, expect, it } from "vitest";
import { products } from "@/lib/catalog";
import { paginateCollection, sortCollection } from "@/lib/catalog/browse";

describe("sortCollection", () => {
  it("orders by price ascending", () => {
    const sorted = sortCollection(products, "price-asc");
    const prices = sorted.map((product) => product.variants[0]?.price ?? 0);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("puts featured products first", () => {
    const sorted = sortCollection(products, "featured");
    const featuredFlags = sorted.map((product) => Boolean(product.featured));
    const firstUnfeatured = featuredFlags.indexOf(false);
    expect(featuredFlags.slice(0, firstUnfeatured === -1 ? featuredFlags.length : firstUnfeatured).every(Boolean)).toBe(true);
  });
});

describe("paginateCollection", () => {
  it("slices a page and clamps the current page", () => {
    const page = paginateCollection(["a", "b", "c", "d"], 2, 2);
    expect(page).toEqual({ items: ["c", "d"], page: 2, totalPages: 2, total: 4 });
    expect(paginateCollection(["a"], 9, 2).page).toBe(1);
  });
});
