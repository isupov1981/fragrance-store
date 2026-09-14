import type { StoreProduct } from "@/lib/catalog";
import { fallbackProducts } from "@/lib/catalog";
import { listStoreProducts } from "@/lib/db/products";
import {
  convertCatalogCents,
  EXPRESS_SHIPPING_ILS_CENTS,
  FREE_SHIPPING_ILS_CENTS,
  STANDARD_SHIPPING_ILS_CENTS,
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

export function priceCatalogItems(
  catalog: StoreProduct[],
  items: CheckoutInput["items"],
  shippingMethod: CheckoutInput["shippingMethod"],
  currency: Currency = "ILS",
): PricedCart {
  const quantities = new Map<string, number>();
  for (const item of items) {
    quantities.set(
      item.variantId,
      (quantities.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  const lines = Array.from(quantities, ([variantId, quantity]) => {
    const product = catalog.find((candidate) =>
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

  const subtotalIls = lines.reduce(
    (total, line) => total + line.unitPrice * line.quantity,
    0,
  );
  const shippingIls =
    shippingMethod === "express"
      ? EXPRESS_SHIPPING_ILS_CENTS
      : subtotalIls >= FREE_SHIPPING_ILS_CENTS
        ? 0
        : STANDARD_SHIPPING_ILS_CENTS;

  return {
    lines: lines.map((line) => ({
      ...line,
      unitPrice: convertCatalogCents(line.unitPrice, currency),
    })),
    subtotal: convertCatalogCents(subtotalIls, currency),
    shippingTotal: convertCatalogCents(shippingIls, currency),
    total: convertCatalogCents(subtotalIls + shippingIls, currency),
    currency: currency.toLowerCase() as PricedCart["currency"],
    shippingMethod,
  };
}

export async function priceCheckoutItems(
  items: CheckoutInput["items"],
  shippingMethod: CheckoutInput["shippingMethod"],
  currency: Currency = "ILS",
) {
  return priceCatalogItems(await listStoreProducts(), items, shippingMethod, currency);
}

/** Synchronous helper for tests against the fallback catalogue. */
export function priceCheckoutItemsSync(
  items: CheckoutInput["items"],
  shippingMethod: CheckoutInput["shippingMethod"],
  currency: Currency = "ILS",
) {
  return priceCatalogItems(fallbackProducts, items, shippingMethod, currency);
}
