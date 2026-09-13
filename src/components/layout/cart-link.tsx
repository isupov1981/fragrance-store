"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { useCartStore } from "@/lib/cart/store";

export function CartLink() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);
  const storedCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const hydrated = useSyncExternalStore(
    (onChange) => useCartStore.persist.onFinishHydration(onChange),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );
  const count = hydrated ? storedCount : 0;

  return (
    <Link className="icon-button relative" href="/cart" aria-label="Shopping bag">
      <ShoppingBag aria-hidden="true" size={20} />
      <span className="sr-only" aria-live="polite" suppressHydrationWarning>
        {count} {count === 1 ? "item" : "items"}
      </span>
      <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-bronze text-[9px] text-white" aria-hidden="true" suppressHydrationWarning>
        {count > 9 ? "9+" : count}
      </span>
    </Link>
  );
}
