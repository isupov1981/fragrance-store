import { describe, expect, it } from "vitest";
import { parseNotesField, resolveScent } from "@/lib/catalog/scent";
import { averageRating, reviewQuote, reviewsForProduct, type StoreReview } from "@/lib/content/reviews";

describe("parseNotesField", () => {
  it("keeps a flat note list", () => {
    expect(parseNotesField(["Incense", " Amber ", ""])).toEqual({ notes: ["Incense", "Amber"] });
  });

  it("ignores unknown scent labels", () => {
    expect(parseNotesField({ top: ["Bergamot"], occasion: "party", sillage: "bold" })).toEqual({
      notes: ["Bergamot"],
      pyramid: { top: ["Bergamot"], heart: [], base: [] },
      occasion: undefined,
      season: undefined,
      sillage: "bold",
    });
  });
});

describe("resolveScent", () => {
  it("uses an editorial pyramid when the product has no stored notes", () => {
    const scent = resolveScent({ slug: "thoo-doux-ennui" });
    expect(scent.pyramid?.top).toEqual(["Apricot jam", "Mandarin", "Ylang-ylang"]);
    expect(scent.occasion).toBe("evening");
    expect(scent.notes).toContain("Peach");
  });

  it("shows the editorial pyramid when stored notes are the same notes flattened", () => {
    const scent = resolveScent({
      slug: "thoo-doux-ennui",
      notes: ["Apricot jam", "Mandarin", "Peach", "Vanilla", "Musk"],
    });
    expect(scent.pyramid?.heart).toEqual(["Peach", "Salted butter", "Ylang-ylang"]);
    expect(scent.notes).toEqual(["Apricot jam", "Mandarin", "Peach", "Vanilla", "Musk"]);
  });

  it("keeps stored notes ahead of an editorial pyramid they contradict", () => {
    const scent = resolveScent({
      slug: "thoo-doux-ennui",
      notes: ["Incense"],
    });
    expect(scent.pyramid).toBeUndefined();
    expect(scent.notes).toEqual(["Incense"]);
    expect(scent.sillage).toBe("moderate");
  });

  it("lets a stored pyramid override the editorial one", () => {
    const scent = resolveScent({
      slug: "thoo-doux-ennui",
      notes: ["Smoke"],
      pyramid: { top: ["Smoke"], heart: [], base: [] },
      sillage: "bold",
    });
    expect(scent.pyramid?.top).toEqual(["Smoke"]);
    expect(scent.sillage).toBe("bold");
    expect(scent.occasion).toBe("evening");
  });
});

describe("reviews", () => {
  const sample: StoreReview[] = [
    { id: "a", productSlug: "notre-dame", rating: 5, author: "Noa", quote: "Close and smoky.", quoteHe: "קרוב ומעושן." },
    { id: "b", rating: 3, author: "Alex", quote: "Quiet." },
  ];

  it("filters quotes to the fragrance they mention", () => {
    expect(reviewsForProduct("notre-dame").map((review) => review.id)).toEqual([]);
    expect(sample.filter((review) => review.productSlug === "notre-dame")).toHaveLength(1);
  });

  it("averages ratings and picks the locale quote", () => {
    expect(averageRating(sample)).toBe(4);
    expect(reviewQuote(sample[0], "he")).toBe("קרוב ומעושן.");
    expect(reviewQuote(sample[0], "ru")).toBe("Close and smoky.");
  });
});
