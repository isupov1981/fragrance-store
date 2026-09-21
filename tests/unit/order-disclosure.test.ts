import { describe, expect, it } from "vitest";
import { buildOrderDisclosure, isIsraeliDestination } from "@/lib/email/disclosure";

const line = {
  productName: "Notre-Dame",
  variantName: "10 ml",
  quantity: 1,
  brand: "Filippo Sorcinelli",
  manufacturer: "Filippo Sorcinelli",
  originCountry: "Italy",
  inci: "Alcohol Denat., Parfum, Aqua",
  supplyChannel: "parallel" as const,
};

describe("order disclosure", () => {
  it("includes manufacturer, origin, ingredients, parallel import and warranty", () => {
    const text = buildOrderDisclosure("en", "IL", [line]);
    expect(text).toContain("Manufacturer: Filippo Sorcinelli");
    expect(text).toContain("Country of manufacture: Italy");
    expect(text).toContain("Alcohol Denat.");
    expect(text).toContain("Parallel import");
    expect(text).toContain("Warranty:");
    expect(text).toContain("Prices include Israeli VAT.");
  });

  it("does not invent missing manufacturer data and explains export VAT", () => {
    const text = buildOrderDisclosure("en", "DE", [
      { productName: "Notre-Dame", variantName: "10 ml", quantity: 1 },
    ]);
    expect(text).toContain("printed on the packaging");
    expect(text).toContain("that VAT is not removed");
    expect(isIsraeliDestination("DE")).toBe(false);
    expect(isIsraeliDestination("IL")).toBe(true);
  });
});
