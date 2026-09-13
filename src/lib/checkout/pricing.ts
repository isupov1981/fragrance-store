import { products } from "@/lib/catalog";
import {
  convertUsdCents,
  EXPRESS_SHIPPING_USD_CENTS,
  FREE_SHIPPING_USD_CENTS,
  STANDARD_SHIPPING_USD_CENTS,
  type Currency,
} from "@/lib/currency";

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
  currency: "usd" | "eur" | "ils";
  shippingMethod: CheckoutInput["shippingMethod"];
};

export class CheckoutPricingError extends Error {}

export function priceCheckoutItems(
  items: CheckoutInput["items"],
  shippingMethod: CheckoutInput["shippingMethod"],
  currency: Currency = "USD",
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

  const subtotalUsd = lines.reduce(
    (total, line) => total + line.unitPrice * line.quantity,
    0,
  );
  const shippingUsd =
    shippingMethod === "express"
      ? EXPRESS_SHIPPING_USD_CENTS
      : subtotalUsd >= FREE_SHIPPING_USD_CENTS
        ? 0
        : STANDARD_SHIPPING_USD_CENTS;

  return {
    lines: lines.map((line) => ({
      ...line,
      unitPrice: convertUsdCents(line.unitPrice, currency),
    })),
    subtotal: convertUsdCents(subtotalUsd, currency),
    shippingTotal: convertUsdCents(shippingUsd, currency),
    total: convertUsdCents(subtotalUsd + shippingUsd, currency),
    currency: currency.toLowerCase() as PricedCart["currency"],
    shippingMethod,
  };
}
