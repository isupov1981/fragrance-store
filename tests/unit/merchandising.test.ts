import { describe, expect, it } from "vitest";
import { matchesMerchandisingEdit, merchandisingTitle } from "@/lib/catalog/merchandising";
import { en } from "@/lib/i18n/en";

describe("matchesMerchandisingEdit", () => {
  it("filters by merchandising tags and flags", () => {
    const product = {
      category: "woody",
      categorySlugs: ["woody", "testers-refills"],
      newArrival: true,
      featured: false,
    };
    expect(matchesMerchandisingEdit(product, "")).toBe(true);
    expect(matchesMerchandisingEdit(product, "new")).toBe(true);
    expect(matchesMerchandisingEdit(product, "featured")).toBe(false);
    expect(matchesMerchandisingEdit(product, "testers")).toBe(true);
    expect(matchesMerchandisingEdit(product, "back-in-stock")).toBe(false);
  });
});

describe("merchandisingTitle", () => {
  it("returns categories menu labels", () => {
    expect(merchandisingTitle(en, "back-in-stock", "Fallback")).toBe("Back In Stock");
    expect(merchandisingTitle(en, "", "Fallback")).toBe("Fallback");
  });
});
