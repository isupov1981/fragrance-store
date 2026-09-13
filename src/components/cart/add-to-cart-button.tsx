"use client";

import { useState } from "react";

import { trackCommerceEvent } from "@/components/analytics/consent-manager";
import type { StoreProduct, StoreVariant } from "@/lib/catalog";
import { createCartItem } from "@/lib/cart/cart";
import { useCartStore } from "@/lib/cart/store";

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
  const [added, setAdded] = useState(false);
  const soldOut = variant.stock < 1;

  function handleClick() {
    addItem(createCartItem(product, variant, quantity));
    trackCommerceEvent("add_to_cart", {
      currency: process.env.NEXT_PUBLIC_STORE_CURRENCY ?? "USD",
      value: (variant.price * quantity) / 100,
      items: [{ item_id: variant.sku, item_name: product.name, quantity }],
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={handleClick}
      className={
        className ??
        "rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
      }
    >
      {soldOut ? "Sold out" : added ? "Added to cart" : "Add to cart"}
    </button>
  );
}
