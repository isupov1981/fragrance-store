"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useCurrency } from "@/components/i18n/currency-provider";
import { useI18n } from "@/components/i18n/i18n-provider";
import { calculateCartTotals } from "@/lib/cart/cart";
import { useCartStore } from "@/lib/cart/store";
import { useHydratedCart } from "@/lib/cart/use-hydrated-cart";
import { interpolate } from "@/lib/i18n/interpolate";

export function CartDrawer() {
  const { dict } = useI18n();
  const { format } = useCurrency();
  const { items } = useHydratedCart();
  const open = useCartStore((state) => state.drawerOpen);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const totals = calculateCartTotals(items);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [closeDrawer, open]);

  if (!open) return null;

  return (
    <div className="cart-drawer" role="presentation">
      <button className="cart-drawer-backdrop" type="button" aria-label={dict.cart.close} onClick={closeDrawer} />
      <aside className="cart-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <div>
            <p className="eyebrow text-bronze">{dict.cart.addedToast}</p>
            <h2 id="cart-drawer-title" className="mt-2 font-display text-3xl">
              {dict.cart.title}
            </h2>
          </div>
          <button className="icon-button" type="button" onClick={closeDrawer} aria-label={dict.cart.close}>
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <p className="text-sm text-ink/60">{dict.cart.empty}</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {items.map((item) => (
                <li className="flex gap-4 py-4" key={item.variantId}>
                  {item.image ? (
                    // External catalog URLs are intentionally rendered without Next image config.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-24 w-20 object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <LocaleLink className="font-medium" href={`/products/${item.slug}`} onClick={closeDrawer}>
                      {item.productName}
                    </LocaleLink>
                    <p className="mt-1 text-xs text-ink/55">
                      {dict.variants[item.variantName as keyof typeof dict.variants] ?? item.variantName}
                    </p>
                    <p className="mt-2 text-sm">{format(item.unitPrice)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        aria-label={interpolate(dict.cart.quantity, { name: item.productName })}
                        className="w-16 border border-ink/20 px-2 py-1 text-sm"
                        min={0}
                        max={99}
                        type="number"
                        value={item.quantity}
                        onChange={(event) => setQuantity(item.variantId, Number(event.target.value))}
                      />
                      <button className="text-xs underline" type="button" onClick={() => removeItem(item.variantId)}>
                        {dict.cart.remove}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-ink/10 px-6 py-5">
          <div className="flex justify-between text-sm">
            <span>{interpolate(dict.cart.subtotal, { count: totals.itemCount })}</span>
            <span>{format(totals.subtotal)}</span>
          </div>
          <p className="mt-2 text-xs text-ink/55">{dict.cart.shippingNote}</p>
          <LocaleLink
            href="/checkout"
            className="button-primary mt-5 flex h-12 w-full items-center justify-center"
            onClick={closeDrawer}
          >
            {dict.cart.checkout}
          </LocaleLink>
          <LocaleLink
            href="/cart"
            className="mt-3 block text-center text-xs uppercase tracking-[0.16em] underline"
            onClick={closeDrawer}
          >
            {dict.cart.viewBag}
          </LocaleLink>
        </div>
      </aside>
    </div>
  );
}
