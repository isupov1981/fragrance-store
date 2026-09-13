import { products } from "@/lib/catalog";

import type { CheckoutInput } from "./schema";

export type PricedLine = {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
};

export type PricedCart = {
  lines: PricedLine[];
  subtotal: number;
  shippingTotal: number;
  total: number;
  currency: "usd";
};

export class CheckoutPricingError extends Error {}

export function priceCheckoutItems(
  items: CheckoutInput["items"],
  shippingMethod: CheckoutInput["shippingMethod"],
): PricedCart {
  const quantities = new Map<string, number>();
  for (const item of items) {
    quantities.set(
      item.variantId,
      (quantities.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  const lines = Array.from(quantities, ([variantId, quantity]) => {
    const product = products.find((candidate) =>
      candidate.variants.some((variant) => variant.id === variantId),
    );
    const variant = product?.variants.find(
      (candidate) => candidate.id === variantId,
    );
    if (!product || !variant) {
      throw new CheckoutPricingError(`Unknown variant: ${variantId}`);
    }
    if (quantity > 99 || quantity > variant.stock) {
      throw new CheckoutPricingError(
        `${product.name} (${variant.name}) has only ${variant.stock} in stock`,
      );
    }
    return {
      productId: product.id,
      variantId,
      productName: product.name,
      variantName: variant.name,
      sku: variant.sku,
      unitPrice: variant.price,
      quantity,
    };
  });

  const subtotal = lines.reduce(
    (total, line) => total + line.unitPrice * line.quantity,
    0,
  );
  const shippingTotal = shippingMethod === "express" ? 2500 : subtotal >= 25000 ? 0 : 1200;

  return {
    lines,
    subtotal,
    shippingTotal,
    total: subtotal + shippingTotal,
    currency: "usd",
  };
}
