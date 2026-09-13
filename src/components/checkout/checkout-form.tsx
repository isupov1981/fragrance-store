"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";

import { trackCommerceEvent } from "@/components/analytics/consent-manager";
import { calculateCartTotals } from "@/lib/cart/cart";
import { useCartStore } from "@/lib/cart/store";
import { formatMoney } from "@/lib/catalog";

type CheckoutResponse = {
  error?: string;
  redirectUrl?: string;
};

const fieldClass = "rounded-lg border border-zinc-300 px-4 py-3";

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const totals = calculateCartTotals(items);
  const idempotencyKey = useRef<string>(crypto.randomUUID());
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const shippingTotal = shippingMethod === "express" ? 2500 : totals.subtotal >= 25000 ? 0 : 1200;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    trackCommerceEvent("begin_checkout", {
      currency: process.env.NEXT_PUBLIC_STORE_CURRENCY ?? "USD",
      value: (totals.subtotal + shippingTotal) / 100,
      items: items.map((item) => ({
        item_id: item.variantId,
        item_name: item.productName,
        quantity: item.quantity,
      })),
    });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          items: items.map(({ variantId, quantity }) => ({
            variantId,
            quantity,
          })),
          customer: {
            name: form.get("name"),
            email: form.get("email"),
            phone: form.get("phone") || undefined,
            addressLine1: form.get("addressLine1"),
            addressLine2: form.get("addressLine2") || undefined,
            city: form.get("city"),
            postalCode: form.get("postalCode"),
            country: form.get("country"),
          },
          shippingMethod,
          acceptsTerms: form.get("acceptsTerms") === "on",
        }),
      });
      const result = (await response.json()) as CheckoutResponse;
      if (!response.ok || !result.redirectUrl) {
        throw new Error(result.error ?? "Checkout could not be started");
      }
      window.location.assign(result.redirectUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout failed");
      setSubmitting(false);
    }
  }

  if (!items.length) {
    return (
      <div className="py-20 text-center">
        <p className="mb-5 text-zinc-600">Add something to your cart first.</p>
        <Link href="/collections/all" className="underline">
          Browse fragrances
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-10 lg:grid-cols-[1fr_360px]"
    >
      <section>
        <h2 className="text-xl font-medium">Contact and shipping</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <input className={`${fieldClass} sm:col-span-2`} name="name" placeholder="Full name" autoComplete="name" required />
          <input className={fieldClass} name="email" type="email" placeholder="Email" autoComplete="email" required />
          <input className={fieldClass} name="phone" type="tel" placeholder="Phone (optional)" autoComplete="tel" />
          <input className={`${fieldClass} sm:col-span-2`} name="addressLine1" placeholder="Address" autoComplete="address-line1" required />
          <input className={`${fieldClass} sm:col-span-2`} name="addressLine2" placeholder="Apartment, suite (optional)" autoComplete="address-line2" />
          <input className={fieldClass} name="city" placeholder="City" autoComplete="address-level2" required />
          <input className={fieldClass} name="postalCode" placeholder="Postal code" autoComplete="postal-code" required />
          <input className={fieldClass} name="country" placeholder="Country code (US)" autoComplete="country" minLength={2} maxLength={2} required />
        </div>
        <fieldset className="mt-8">
          <legend className="text-xl font-medium">Delivery</legend>
          <div className="mt-4 grid gap-3">
            <label className="flex items-center justify-between rounded-lg border border-zinc-300 p-4">
              <span><input className="mr-3" type="radio" name="shippingMethod" value="standard" checked={shippingMethod === "standard"} onChange={() => setShippingMethod("standard")} />Standard delivery</span>
              <span>{totals.subtotal >= 25000 ? "Free" : formatMoney(1200)}</span>
            </label>
            <label className="flex items-center justify-between rounded-lg border border-zinc-300 p-4">
              <span><input className="mr-3" type="radio" name="shippingMethod" value="express" checked={shippingMethod === "express"} onChange={() => setShippingMethod("express")} />Express delivery</span>
              <span>{formatMoney(2500)}</span>
            </label>
          </div>
        </fieldset>
        <label className="mt-6 flex items-start gap-3 text-sm">
          <input className="mt-1" type="checkbox" name="acceptsTerms" required />
          <span>I agree to the terms, shipping policy and returns policy.</span>
        </label>
      </section>
      <aside className="h-fit rounded-xl bg-zinc-50 p-6">
        <h2 className="text-xl font-medium">Order summary</h2>
        <ul className="mt-5 space-y-3 text-sm">
          {items.map((item) => (
            <li className="flex justify-between gap-4" key={item.variantId}>
              <span>{item.productName}, {item.variantName} × {item.quantity}</span>
              <span>{formatMoney(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-between border-t border-zinc-200 pt-5 text-lg font-medium">
          <span>Total</span>
          <span>{formatMoney(totals.subtotal + shippingTotal)}</span>
        </div>
        {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
        <button
          className="mt-6 w-full rounded-full bg-zinc-950 px-5 py-3 text-white disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Starting payment…" : "Continue to payment"}
        </button>
        <p className="mt-3 text-xs text-zinc-500">
          Without Stripe configuration, a safe demo payment is used.
        </p>
      </aside>
    </form>
  );
}
