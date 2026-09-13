import { describe, expect, it } from "vitest";
import { calculateCartTotals, type CartItem } from "@/lib/cart/cart";
import { priceCheckoutItems, CheckoutPricingError } from "@/lib/checkout/pricing";

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
  it("uses server catalogue prices and adds standard shipping", () => {
    const cart = priceCheckoutItems([{ variantId: "v-amber-50", quantity: 1 }], "standard");
    expect(cart.subtotal).toBe(16800);
    expect(cart.shippingTotal).toBe(1200);
    expect(cart.total).toBe(18000);
  });

  it("rejects quantities above available stock", () => {
    expect(() =>
      priceCheckoutItems([{ variantId: "v-amber-50", quantity: 13 }], "standard"),
    ).toThrow(CheckoutPricingError);
  });
});
