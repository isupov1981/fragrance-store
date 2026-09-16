import type { StoreProduct } from "@/lib/catalog";
import { fallbackProducts } from "@/lib/catalog";
import { listStoreProducts } from "@/lib/db/products";
import { convertCatalogCents, type Currency } from "@/lib/currency";
import { quoteShippingIls } from "@/lib/shipping/international";

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
  ilsTotal: number;
  currency: "usd" | "eur" | "ils";
  shippingMethod: CheckoutInput["shippingMethod"];
};

export class CheckoutPricingError extends Error {}

export function priceCatalogItems(
  catalog: StoreProduct[],
  items: CheckoutInput["items"],
  shippingMethod: CheckoutInput["shippingMethod"],
  currency: Currency = "ILS",
  country = "IL",
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
  const shippingIls = quoteShippingIls(country, subtotalIls, shippingMethod);
  if (shippingIls === null) {
    throw new CheckoutPricingError("We do not ship to this destination");
  }

  return {
    lines: lines.map((line) => ({
      ...line,
      unitPrice: convertCatalogCents(line.unitPrice, currency),
    })),
    subtotal: convertCatalogCents(subtotalIls, currency),
    shippingTotal: convertCatalogCents(shippingIls, currency),
    total: convertCatalogCents(subtotalIls + shippingIls, currency),
    ilsTotal: subtotalIls + shippingIls,
    currency: currency.toLowerCase() as PricedCart["currency"],
    shippingMethod,
  };
}

export async function priceCheckoutItems(
  items: CheckoutInput["items"],
  shippingMethod: CheckoutInput["shippingMethod"],
  currency: Currency = "ILS",
  country = "IL",
) {
  return priceCatalogItems(await listStoreProducts(), items, shippingMethod, currency, country);
}

/** Synchronous helper for tests against the fallback catalogue. */
export function priceCheckoutItemsSync(
  items: CheckoutInput["items"],
  shippingMethod: CheckoutInput["shippingMethod"],
  currency: Currency = "ILS",
  country = "IL",
) {
  return priceCatalogItems(fallbackProducts, items, shippingMethod, currency, country);
}
