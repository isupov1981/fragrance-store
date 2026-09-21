"use client";

import { calculateCartTotals } from "@/lib/cart/cart";
import { useCartStore } from "@/lib/cart/store";
import { useHydratedCart } from "@/lib/cart/use-hydrated-cart";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useCurrency } from "@/components/i18n/currency-provider";
import { useI18n } from "@/components/i18n/i18n-provider";
import { interpolate } from "@/lib/i18n/interpolate";

export function CartView() {
  const { items, hydrated } = useHydratedCart();
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const totals = calculateCartTotals(items);
  const { dict } = useI18n();
  const { format } = useCurrency();

  if (!hydrated) {
    return <p className="py-20 text-center text-zinc-600">{dict.checkout.loading}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="mb-6 text-zinc-600">{dict.cart.empty}</p>
        <LocaleLink className="underline" href="/collections/all">
          {dict.cart.browse}
        </LocaleLink>
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
              <LocaleLink className="font-medium" href={`/products/${item.slug}`}>
                {item.productName}
              </LocaleLink>
              <p className="text-sm text-zinc-500">{dict.variants[item.variantName as keyof typeof dict.variants] ?? item.variantName}</p>
              <p className="mt-2">{format(item.unitPrice)}</p>
              <div className="mt-4 flex items-center gap-4">
                <input
                  aria-label={interpolate(dict.cart.quantity, { name: item.productName })}
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
                  {dict.cart.remove}
                </button>
              </div>
            </div>
            <p className="font-medium">
              {format(item.unitPrice * item.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-xl bg-zinc-50 p-6">
        <div className="flex justify-between text-lg font-medium">
          <span>{interpolate(dict.cart.subtotal, { count: totals.itemCount })}</span>
          <span>{format(totals.subtotal)}</span>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          {dict.cart.shippingNote}
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500">{dict.product.vatAbroad}</p>
        <LocaleLink
          href="/checkout"
          className="mt-6 block rounded-full bg-zinc-950 px-5 py-3 text-center text-white"
        >
          {dict.cart.checkout}
        </LocaleLink>
      </aside>
    </div>
  );
}
