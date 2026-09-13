"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useCartStore } from "@/lib/cart/store";

export function CheckoutSuccess({ orderId }: { orderId?: string }) {
  const clear = useCartStore((state) => state.clear);

  useEffect(() => {
    if (orderId) clear();
  }, [clear, orderId]);

  return (
    <div className="mx-auto max-w-xl py-24 text-center">
      <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
        Order confirmed
      </p>
      <h1 className="mt-4 text-4xl font-semibold">Thank you for your order</h1>
      {orderId ? (
        <p className="mt-5 text-zinc-600">Order reference: {orderId}</p>
      ) : null}
      <p className="mt-2 text-zinc-600">
        A confirmation will be sent when email delivery is configured.
      </p>
      <Link
        href="/collections/all"
        className="mt-8 inline-block rounded-full bg-zinc-950 px-6 py-3 text-white"
      >
        Continue shopping
      </Link>
    </div>
  );
}
