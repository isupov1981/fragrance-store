import type { StoreProduct, StoreVariant } from "@/lib/catalog";

export type CartItem = {
  productId: string;
  variantId: string;
  slug: string;
  productName: string;
  variantName: string;
  image?: string;
  unitPrice: number;
  quantity: number;
};

export type CartTotals = {
  itemCount: number;
  subtotal: number;
};

export function createCartItem(
  product: StoreProduct,
  variant: StoreVariant,
  quantity = 1,
): CartItem {
  return {
    productId: product.id,
    variantId: variant.id,
    slug: product.slug,
    productName: product.name,
    variantName: variant.name,
    image: product.images[0],
    unitPrice: variant.price,
    quantity,
  };
}

export function calculateCartTotals(items: CartItem[]): CartTotals {
  return items.reduce(
    (totals, item) => ({
      itemCount: totals.itemCount + item.quantity,
      subtotal: totals.subtotal + item.unitPrice * item.quantity,
    }),
    { itemCount: 0, subtotal: 0 },
  );
}
