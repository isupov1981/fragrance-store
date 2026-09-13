"use client";

import { ShoppingBag } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useCartStore } from "@/lib/cart/store";
import { useHydratedCart } from "@/lib/cart/use-hydrated-cart";

export function CartLink() {
  const { dict } = useI18n();
  const { items, hydrated } = useHydratedCart();
  const openDrawer = useCartStore((state) => state.openDrawer);
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const label = hydrated
    ? `${dict.cart.open}, ${count} ${count === 1 ? dict.cart.item : dict.cart.items}`
    : dict.cart.open;

  return (
    <button className="icon-button relative" type="button" onClick={openDrawer} aria-label={label} data-testid="open-cart">
      <ShoppingBag aria-hidden="true" size={20} />
      <span className="absolute end-0 top-0 grid size-4 place-items-center rounded-full bg-bronze text-[9px] text-white" aria-hidden="true">
        {hydrated ? (count > 9 ? "9+" : count) : 0}
      </span>
    </button>
  );
}
