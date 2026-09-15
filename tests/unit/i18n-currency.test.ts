import { describe, expect, it } from "vitest";
import { convertCatalogCents, formatMoney } from "@/lib/currency";
import { negotiateLocale } from "@/lib/i18n/config";
import { interpolate } from "@/lib/i18n/interpolate";
import { localizedPath, replaceLocaleInPath, stripLocalePrefix } from "@/lib/i18n/path";

describe("convertCatalogCents", () => {
  it("keeps ILS amounts unchanged", () => {
    expect(convertCatalogCents(3200, "ILS")).toBe(3200);
  });

  it("rounds USD and EUR to whole major units from ILS", () => {
    expect(convertCatalogCents(3200, "USD")).toBe(900);
    expect(convertCatalogCents(3200, "EUR")).toBe(800);
    expect(convertCatalogCents(7900, "USD")).toBe(2100);
    expect(convertCatalogCents(7900, "EUR")).toBe(2000);
    expect(convertCatalogCents(11900, "USD")).toBe(3200);
    expect(convertCatalogCents(21900, "USD")).toBe(5900);
  });
});

describe("formatMoney", () => {
  it("formats ILS with cents and USD/EUR without fractional cents", () => {
    expect(formatMoney(3200, "ILS")).toBe("₪32.00");
    expect(formatMoney(900, "USD")).toBe("$9");
    expect(formatMoney(800, "EUR")).toBe("€8");
  });
});

describe("locale routing", () => {
  it("prefixes storefront paths for each locale", () => {
    expect(localizedPath("en", "/products/amber-veil")).toBe("/en/products/amber-veil");
    expect(localizedPath("he", "/cart?from=nav")).toBe("/he/cart?from=nav");
    expect(localizedPath("ru", "/about")).toBe("/ru/about");
    expect(stripLocalePrefix("/he/collections/all")).toBe("/collections/all");
    expect(replaceLocaleInPath("/en/about", "he")).toBe("/he/about");
    expect(replaceLocaleInPath("/he/cart", "ru")).toBe("/ru/cart");
  });

  it("prefers the locale cookie, then Hebrew/Russian Accept-Language", () => {
    expect(negotiateLocale("en-US,en;q=0.9", "he")).toBe("he");
    expect(negotiateLocale("he-IL,he;q=0.9", null)).toBe("he");
    expect(negotiateLocale("ru-RU,ru;q=0.9", null)).toBe("ru");
    expect(negotiateLocale("en-US,en;q=0.9", null)).toBe("en");
  });
});

describe("interpolate", () => {
  it("fills named placeholders", () => {
    expect(interpolate("Complimentary delivery on orders over {amount}", { amount: "₪930.00" })).toBe(
      "Complimentary delivery on orders over ₪930.00",
    );
  });
});
