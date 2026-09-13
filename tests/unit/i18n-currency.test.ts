import { describe, expect, it } from "vitest";
import { convertUsdCents, formatMoney } from "@/lib/currency";
import { negotiateLocale } from "@/lib/i18n/config";
import { interpolate } from "@/lib/i18n/interpolate";
import { localizedPath, replaceLocaleInPath, stripLocalePrefix } from "@/lib/i18n/path";

describe("convertUsdCents", () => {
  it("keeps USD amounts unchanged", () => {
    expect(convertUsdCents(16800, "USD")).toBe(16800);
  });

  it("converts into euro and shekel minor units", () => {
    expect(convertUsdCents(10000, "EUR")).toBe(9200);
    expect(convertUsdCents(10000, "ILS")).toBe(37200);
  });
});

describe("formatMoney", () => {
  it("formats converted amounts with the currency symbol", () => {
    expect(formatMoney(16800, "USD", "en-US")).toContain("168.00");
    expect(formatMoney(convertUsdCents(16800, "EUR"), "EUR", "en-US")).toMatch(/€|EUR/);
    expect(formatMoney(convertUsdCents(16800, "ILS"), "ILS", "he-IL")).toMatch(/₪|ILS/);
  });
});

describe("locale routing", () => {
  it("prefixes storefront paths for each locale", () => {
    expect(localizedPath("en", "/products/amber-veil")).toBe("/en/products/amber-veil");
    expect(localizedPath("he", "/cart?from=nav")).toBe("/he/cart?from=nav");
    expect(stripLocalePrefix("/he/collections/all")).toBe("/collections/all");
    expect(replaceLocaleInPath("/en/about", "he")).toBe("/he/about");
  });

  it("prefers the locale cookie, then Hebrew Accept-Language", () => {
    expect(negotiateLocale("en-US,en;q=0.9", "he")).toBe("he");
    expect(negotiateLocale("he-IL,he;q=0.9", null)).toBe("he");
    expect(negotiateLocale("en-US,en;q=0.9", null)).toBe("en");
  });
});

describe("interpolate", () => {
  it("fills named placeholders", () => {
    expect(interpolate("Complimentary delivery on orders over {amount}", { amount: "$250.00" })).toBe(
      "Complimentary delivery on orders over $250.00",
    );
  });
});
