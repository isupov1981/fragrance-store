"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CartItem } from "@/lib/cart/cart";

type CartState = {
  items: CartItem[];
  drawerOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const clampQuantity = (quantity: number) =>
  Math.max(1, Math.min(99, Math.trunc(quantity)));

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      drawerOpen: false,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            ({ variantId }) => variantId === item.variantId,
          );
          if (!existing) {
            return {
              drawerOpen: true,
              items: [
                ...state.items,
                { ...item, quantity: clampQuantity(item.quantity) },
              ],
            };
          }
          return {
            drawerOpen: true,
            items: state.items.map((current) =>
              current.variantId === item.variantId
                ? {
                    ...current,
                    quantity: clampQuantity(current.quantity + item.quantity),
                  }
                : current,
            ),
          };
        }),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.variantId !== variantId)
              : state.items.map((item) =>
                  item.variantId === variantId
                    ? { ...item, quantity: clampQuantity(quantity) }
                    : item,
                ),
        })),
      clear: () => set({ items: [], drawerOpen: false }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
    }),
    {
      name: "fragrance-store-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      skipHydration: true,
    },
  ),
);
