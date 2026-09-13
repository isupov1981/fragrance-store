"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useCartStore } from "@/lib/cart/store";

export function useHydratedCart() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  const hydrated = useSyncExternalStore(
    (onChange) => useCartStore.persist.onFinishHydration(onChange),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );
  const items = useCartStore((state) => state.items);

  return { items: hydrated ? items : [], hydrated };
}
