import { describe, expect, it } from "vitest";
import { inferFamilyCategory, normalizeFamilyCategorySlug } from "@/lib/catalog/family";

describe("normalizeFamilyCategorySlug", () => {
  it("maps Hebrew and English aliases", () => {
    expect(normalizeFamilyCategorySlug("גורמני")).toBe("amber");
    expect(normalizeFamilyCategorySlug("Clean")).toBe("woody");
    expect(normalizeFamilyCategorySlug("פרחוני")).toBe("floral");
    expect(normalizeFamilyCategorySlug("dominant")).toBe("citrus");
  });
});

describe("inferFamilyCategory", () => {
  it("uses an explicit category when valid", () => {
    expect(inferFamilyCategory({ category: "floral", description: "vanilla gourmand" })).toBe("floral");
  });

  it("infers gourmand from copy", () => {
    expect(
      inferFamilyCategory({
        descriptionHe: "ניחוח גורמני עם וניל וקרמיות",
        notes: ["Vanilla", "Biscuit"],
      }),
    ).toBe("amber");
  });

  it("infers floral from notes", () => {
    expect(inferFamilyCategory({ notes: ["Rose", "Jasmine", "Iris"] })).toBe("floral");
  });

  it("defaults to amber when unclear", () => {
    expect(inferFamilyCategory({ name: "Mystery", description: "A composition." })).toBe("amber");
  });
});
