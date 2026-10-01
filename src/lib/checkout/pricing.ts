import type { StoreProduct } from "@/lib/catalog";
import { fallbackProducts } from "@/lib/catalog";
import { databaseEnabled } from "@/lib/db/enabled";
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
  brand?: string;
  manufacturer?: string;
  originCountry?: string;
  inci?: string;
  supplyChannel?: "official" | "parallel";
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
      brand: product.brand || undefined,
      manufacturer: product.manufacturer,
      originCountry: product.originCountry,
      inci: product.inci,
      supplyChannel: product.supplyChannel,
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

/**
 * Prices from the live variant rows. The storefront catalogue cache can be
 * up to 15 minutes old, so stock and price at checkout must not use it.
 */
async function loadCheckoutCatalog(variantIds: string[]): Promise<StoreProduct[]> {
  const { prisma } = await import("@/lib/db/prisma");
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds }, product: { status: "ACTIVE" } },
    include: { product: { include: { brand: true } } },
  });
  return variants.map((variant) => ({
    id: variant.product.id,
    slug: variant.product.slug,
    name: variant.product.name,
    brand: variant.product.brand?.name ?? "",
    description: variant.product.description,
    category: "all",
    manufacturer: variant.product.manufacturer ?? undefined,
    originCountry: variant.product.originCountry ?? undefined,
    inci: variant.product.inci ?? undefined,
    supplyChannel:
      variant.product.supplyChannel === "official" || variant.product.supplyChannel === "parallel"
        ? variant.product.supplyChannel
        : undefined,
    images: [],
    variants: [
      {
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        price: variant.price,
        compareAt: variant.compareAt ?? undefined,
        stock: variant.stock,
      },
    ],
  }));
}

export async function priceCheckoutItems(
  items: CheckoutInput["items"],
  shippingMethod: CheckoutInput["shippingMethod"],
  currency: Currency = "ILS",
  country = "IL",
) {
  if (!databaseEnabled()) {
    return priceCatalogItems(fallbackProducts, items, shippingMethod, currency, country);
  }
  const variantIds = [...new Set(items.map((item) => item.variantId))];
  return priceCatalogItems(
    await loadCheckoutCatalog(variantIds),
    items,
    shippingMethod,
    currency,
    country,
  );
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
