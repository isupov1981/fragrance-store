"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatMoney, type StoreProduct } from "@/lib/catalog";

export function ProductPurchase({ product }: { product: StoreProduct }) {
  const { variants } = product;
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const selected = variants.find((variant) => variant.id === variantId) ?? variants[0];
  const unavailable = !selected || selected.stock < 1;

  return (
    <div className="mt-8">
      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.16em]">Choose a size</legend>
        <div className="grid grid-cols-2 gap-2">
          {variants.map((variant) => (
            <label
              className={`cursor-pointer border px-4 py-3 text-center text-sm transition ${
                variantId === variant.id ? "border-ink bg-ink text-ivory" : "border-ink/20 hover:border-ink/60"
              } ${variant.stock < 1 ? "cursor-not-allowed opacity-45" : ""}`}
              key={variant.id}
            >
              <input
                className="sr-only"
                type="radio"
                value={variant.id}
                checked={variantId === variant.id}
                onChange={() => setVariantId(variant.id)}
                disabled={variant.stock < 1}
              />
              <span className="block">{variant.name}</span>
              <span className="mt-0.5 block text-[10px] opacity-70">{formatMoney(variant.price)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex gap-3">
        <div className="flex h-14 items-center border border-ink/20" aria-label="Quantity selector">
          <button
            className="grid size-12 place-items-center disabled:opacity-30"
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity === 1}
            aria-label="Decrease quantity"
          >
            <Minus aria-hidden="true" size={15} />
          </button>
          <input className="w-8 bg-transparent text-center text-sm outline-none" value={quantity} readOnly aria-label="Quantity" />
          <button
            className="grid size-12 place-items-center disabled:opacity-30"
            type="button"
            onClick={() => setQuantity((current) => Math.min(selected?.stock ?? 1, current + 1))}
            disabled={unavailable || quantity >= (selected?.stock ?? 0)}
            aria-label="Increase quantity"
          >
            <Plus aria-hidden="true" size={15} />
          </button>
        </div>
        {selected && (
          <AddToCartButton
            product={product}
            variant={selected}
            quantity={quantity}
            className="button-primary h-14 flex-1 disabled:cursor-not-allowed disabled:opacity-45"
          />
        )}
      </div>
      <ul className="mt-6 grid gap-2 text-xs text-ink/65 sm:grid-cols-2">
        <li className="flex items-center gap-2"><Check aria-hidden="true" size={14} /> Complimentary samples</li>
        <li className="flex items-center gap-2"><Check aria-hidden="true" size={14} /> Gift wrapping available</li>
      </ul>
    </div>
  );
}
