"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type FavoritesState = {
  productIds: string[];
  toggle: (productId: string) => void;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
      add: (productId) =>
        set((state) =>
          state.productIds.includes(productId)
            ? state
            : { productIds: [...state.productIds, productId] },
        ),
      remove: (productId) =>
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        })),
      has: (productId) => get().productIds.includes(productId),
      clear: () => set({ productIds: [] }),
    }),
    {
      name: "fragrance-store-favorites",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ productIds: state.productIds }),
      skipHydration: true,
    },
  ),
);
