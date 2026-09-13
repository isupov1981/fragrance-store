"use client";

import Link from "next/link";

import { calculateCartTotals } from "@/lib/cart/cart";
import { useCartStore } from "@/lib/cart/store";
import { formatMoney } from "@/lib/catalog";

export function CartView() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const totals = calculateCartTotals(items);

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="mb-6 text-zinc-600">Your cart is empty.</p>
        <Link className="underline" href="/products">
          Browse fragrances
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-zinc-200">
        {items.map((item) => (
          <li key={item.variantId} className="flex gap-5 py-6">
            {item.image ? (
              // External catalog URLs are intentionally rendered without Next image config.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt=""
                className="h-28 w-24 rounded-lg object-cover"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <Link className="font-medium" href={`/products/${item.slug}`}>
                {item.productName}
              </Link>
              <p className="text-sm text-zinc-500">{item.variantName}</p>
              <p className="mt-2">{formatMoney(item.unitPrice)}</p>
              <div className="mt-4 flex items-center gap-4">
                <input
                  aria-label={`Quantity for ${item.productName}`}
                  className="w-20 rounded border border-zinc-300 px-3 py-2"
                  min={0}
                  max={99}
                  type="number"
                  value={item.quantity}
                  onChange={(event) =>
                    setQuantity(item.variantId, Number(event.target.value))
                  }
                />
                <button
                  className="text-sm underline"
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="font-medium">
              {formatMoney(item.unitPrice * item.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-xl bg-zinc-50 p-6">
        <div className="flex justify-between text-lg font-medium">
          <span>Subtotal ({totals.itemCount})</span>
          <span>{formatMoney(totals.subtotal)}</span>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          Shipping and taxes are calculated at checkout.
        </p>
        <Link
          href="/checkout"
          className="mt-6 block rounded-full bg-zinc-950 px-5 py-3 text-center text-white"
        >
          Checkout
        </Link>
      </aside>
    </div>
  );
}
