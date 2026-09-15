import { describe, expect, it } from "vitest";
import { convertCatalogCents } from "@/lib/currency";
import { calculateCartTotals, type CartItem } from "@/lib/cart/cart";
import { priceCheckoutItemsSync as priceCheckoutItems, CheckoutPricingError } from "@/lib/checkout/pricing";

const line: CartItem = {
  productId: "product",
  variantId: "variant",
  slug: "product",
  productName: "Product",
  variantName: "50 ml",
  unitPrice: 1250,
  quantity: 2,
};

describe("calculateCartTotals", () => {
  it("calculates quantity and subtotal in minor units", () => {
    expect(calculateCartTotals([line, { ...line, variantId: "other", quantity: 1 }])).toEqual({
      itemCount: 3,
      subtotal: 3750,
    });
  });
});

describe("priceCheckoutItems", () => {
  it("uses server catalogue ILS prices and adds standard shipping", () => {
    const cart = priceCheckoutItems([{ variantId: "v-amber-50", quantity: 1 }], "standard");
    expect(cart.subtotal).toBe(62496);
    expect(cart.shippingTotal).toBe(4500);
    expect(cart.total).toBe(66996);
    expect(cart.ilsTotal).toBe(66996);
    expect(cart.currency).toBe("ils");
    expect(cart.shippingMethod).toBe("standard");
  });

  it("converts catalogue prices into USD rounded to whole dollars", () => {
    const cart = priceCheckoutItems([{ variantId: "v-amber-50", quantity: 1 }], "standard", "USD");
    expect(cart.currency).toBe("usd");
    expect(cart.subtotal).toBe(convertCatalogCents(62496, "USD"));
    expect(cart.shippingTotal).toBe(convertCatalogCents(4500, "USD"));
    expect(cart.total).toBe(convertCatalogCents(66996, "USD"));
    expect(cart.ilsTotal).toBe(66996);
  });

  it("rejects quantities above available stock", () => {
    expect(() =>
      priceCheckoutItems([{ variantId: "v-amber-50", quantity: 13 }], "standard"),
    ).toThrow(CheckoutPricingError);
  });
});
