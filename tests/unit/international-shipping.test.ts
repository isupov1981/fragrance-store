import { describe, expect, it } from "vitest";
import {
  EUROPE_ZONE1_COUNTRY_CODES,
  EUROPE_ZONE2_COUNTRY_CODES,
  europeZone1Destinations,
  europeZone2Destinations,
  getShippingZone,
  isShippableCountry,
  quoteShippingIls,
  unitedStatesDestinations,
} from "@/lib/shipping/international";

describe("international shipping destinations", () => {
  it("lists all 50 US states and the published European zones", () => {
    expect(unitedStatesDestinations).toHaveLength(50);
    expect(europeZone2Destinations).toHaveLength(21);
    expect(europeZone1Destinations).toHaveLength(26);
  });

  it("keeps English destination names unique within each zone", () => {
    for (const zone of [unitedStatesDestinations, europeZone1Destinations, europeZone2Destinations]) {
      const names = zone.map((place) => place.en);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("maps published destinations to checkout zones and excludes unlisted countries", () => {
    expect(EUROPE_ZONE1_COUNTRY_CODES).toHaveLength(europeZone1Destinations.length);
    expect(EUROPE_ZONE2_COUNTRY_CODES).toHaveLength(europeZone2Destinations.length);
    expect(getShippingZone("IL")).toBe("israel");
    expect(getShippingZone("US")).toBe("us");
    expect(getShippingZone("DE")).toBe("zone1");
    expect(getShippingZone("PL")).toBe("zone2");
    expect(["CA", "AU", "TR", "UA", "RU", "JP", "CN"].every((code) => !isShippableCountry(code))).toBe(true);
  });

  it("quotes Israel ₪45 / free ₪499 and international ₪50 or ₪75 / free ₪699", () => {
    expect(quoteShippingIls("IL", 49899, "standard")).toBe(4500);
    expect(quoteShippingIls("IL", 49900, "standard")).toBe(0);
    expect(quoteShippingIls("IL", 80000, "express")).toBe(9300);
    expect(quoteShippingIls("US", 69899)).toBe(5000);
    expect(quoteShippingIls("FR", 69900)).toBe(0);
    expect(quoteShippingIls("PL", 50000)).toBe(7500);
    expect(quoteShippingIls("CA", 80000)).toBeNull();
  });
});

describe("checkout country validation", () => {
  it("accepts shippable countries and rejects Canada, Australia, Turkey, Ukraine and Russia", async () => {
    const { checkoutSchema } = await import("@/lib/checkout/schema");
    const base = {
      idempotencyKey: "checkout-key-16ch",
      items: [{ variantId: "v-notre-1", quantity: 1 }],
      customer: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        addressLine1: "1 Atelier Lane",
        city: "Tel Aviv",
        postalCode: "61000",
        country: "IL",
      },
      shippingMethod: "standard" as const,
      acceptsTerms: true as const,
    };
    expect(checkoutSchema.safeParse(base).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...base, customer: { ...base.customer, country: "FR" } }).success).toBe(true);
    for (const country of ["CA", "AU", "TR", "UA", "RU"]) {
      expect(checkoutSchema.safeParse({ ...base, customer: { ...base.customer, country } }).success).toBe(false);
    }
  });
});

