import { describe, expect, it } from "vitest";
import { brandIndexLetter, groupBrandsByLetter } from "@/lib/catalog/brands";

describe("brandIndexLetter", () => {
  it("groups digits and letters", () => {
    expect(brandIndexLetter("18.21 Man Made")).toBe("0-9");
    expect(brandIndexLetter("Filippo Sorcinelli")).toBe("F");
    expect(brandIndexLetter("éclats")).toBe("#");
  });
});

describe("groupBrandsByLetter", () => {
  it("returns only letters that have brands, sorted", () => {
    const groups = groupBrandsByLetter([
      { name: "Filippo Sorcinelli", slug: "filippo-sorcinelli" },
      { name: "Atelier Nox", slug: "atelier-nox" },
      { name: "18.21", slug: "18-21" },
    ]);
    expect(groups.map((group) => group.letter)).toEqual(["0-9", "A", "F"]);
    expect(groups[1]?.brands[0]?.name).toBe("Atelier Nox");
  });
});
