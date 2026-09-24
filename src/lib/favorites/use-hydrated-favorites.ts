"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useFavoritesStore } from "@/lib/favorites/store";

export function useHydratedFavorites() {
  useEffect(() => {
    void useFavoritesStore.persist.rehydrate();
  }, []);

  const hydrated = useSyncExternalStore(
    (onChange) => useFavoritesStore.persist.onFinishHydration(onChange),
    () => useFavoritesStore.persist.hasHydrated(),
    () => false,
  );
  const productIds = useFavoritesStore((state) => state.productIds);

  return { productIds: hydrated ? productIds : [], hydrated };
}
