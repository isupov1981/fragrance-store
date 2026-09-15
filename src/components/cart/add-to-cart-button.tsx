"use client";

import { useState } from "react";

import { trackCommerceEvent } from "@/components/analytics/consent-manager";
import { useCurrency } from "@/components/i18n/currency-provider";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { StoreProduct, StoreVariant } from "@/lib/catalog";
import { createCartItem } from "@/lib/cart/cart";
import { useCartStore } from "@/lib/cart/store";
import { ordersEnabled } from "@/lib/commerce";

type AddToCartButtonProps = {
  product: StoreProduct;
  variant: StoreVariant;
  quantity?: number;
  className?: string;
};

export function AddToCartButton({
  product,
  variant,
  quantity = 1,
  className,
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const { dict } = useI18n();
  const { currency, convert } = useCurrency();
  const [added, setAdded] = useState(false);
  const soldOut = variant.stock < 1;

  function handleClick() {
    if (!ordersEnabled) return;
    addItem(createCartItem(product, variant, quantity));
    openDrawer();
    trackCommerceEvent("add_to_cart", {
      currency,
      value: convert(variant.price * quantity) / 100,
      items: [{ item_id: variant.sku, item_name: product.name, quantity }],
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      type="button"
      data-testid="add-to-cart"
      disabled={soldOut || !ordersEnabled}
      onClick={handleClick}
      className={
        className ??
        "rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
      }
    >
      {!ordersEnabled
        ? dict.browseOnly.title
        : soldOut
          ? dict.product.soldOut
          : added
            ? dict.product.added
            : dict.product.add}
    </button>
  );
}
