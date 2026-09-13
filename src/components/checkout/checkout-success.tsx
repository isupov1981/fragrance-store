"use client";

import { useEffect } from "react";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useCartStore } from "@/lib/cart/store";

export function CheckoutSuccess({ orderId }: { orderId?: string }) {
  const clear = useCartStore((state) => state.clear);
  const { dict } = useI18n();

  useEffect(() => {
    if (orderId) clear();
  }, [clear, orderId]);

  return (
    <div className="mx-auto max-w-xl py-24 text-center">
      <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
        {dict.checkout.title}
      </p>
      <h1 className="mt-4 text-4xl font-semibold">{dict.success.title}</h1>
      {orderId ? (
        <p className="mt-5 text-zinc-600">{orderId}</p>
      ) : null}
      <LocaleLink
        href="/collections/all"
        className="mt-8 inline-block rounded-full bg-zinc-950 px-6 py-3 text-white"
      >
        {dict.cart.browse}
      </LocaleLink>
    </div>
  );
}
