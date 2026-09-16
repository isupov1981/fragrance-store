"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

import { trackCommerceEvent } from "@/components/analytics/consent-manager";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useCurrency } from "@/components/i18n/currency-provider";
import { useI18n } from "@/components/i18n/i18n-provider";
import { calculateCartTotals } from "@/lib/cart/cart";
import { useHydratedCart } from "@/lib/cart/use-hydrated-cart";
import { EXPRESS_SHIPPING_ILS_CENTS } from "@/lib/currency";
import { defaultCountryForLocale, getCountryOptions } from "@/lib/i18n/countries";
import {
  getShippingZone,
  quoteShippingIls,
  SHIPPABLE_COUNTRY_CODES,
} from "@/lib/shipping/international";

type CheckoutResponse = {
  error?: string;
  redirectUrl?: string;
};

const fieldClass = "rounded-lg border border-zinc-300 px-4 py-3";

export function CheckoutForm() {
  const { items, hydrated } = useHydratedCart();
  const totals = calculateCartTotals(items);
  const idempotencyKey = useRef<string>(crypto.randomUUID());
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [country, setCountry] = useState<string>(defaultCountryForLocale());
  const { dict, locale } = useI18n();
  const { currency, format } = useCurrency();
  const countries = useMemo(
    () => getCountryOptions(locale, SHIPPABLE_COUNTRY_CODES),
    [locale],
  );
  const zone = getShippingZone(country);
  const isIsrael = zone === "israel";
  const method = isIsrael ? shippingMethod : "standard";
  const shippingIls = quoteShippingIls(country, totals.subtotal, method) ?? 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    trackCommerceEvent("begin_checkout", {
      currency,
      value: (totals.subtotal + shippingIls) / 100,
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
            country,
          },
          shippingMethod: method,
          currency,
          locale,
          acceptsTerms: form.get("acceptsTerms") === "on",
        }),
      });
      const result = (await response.json()) as CheckoutResponse;
      if (!response.ok || !result.redirectUrl) {
        throw new Error(result.error ?? dict.checkout.failed);
      }
      window.location.assign(result.redirectUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : dict.checkout.error);
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return <p className="py-20 text-center text-zinc-600">{dict.checkout.loading}</p>;
  }

  if (!items.length) {
    return (
      <div className="py-20 text-center">
        <p className="mb-5 text-zinc-600">{dict.checkout.empty}</p>
        <LocaleLink href="/collections/all" className="underline">
          {dict.cart.browse}
        </LocaleLink>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-10 lg:grid-cols-[1fr_360px]"
    >
      <section>
        <h2 className="text-xl font-medium">{dict.checkout.contact}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <input className={`${fieldClass} sm:col-span-2`} name="name" placeholder={dict.checkout.name} autoComplete="name" required />
          <input className={fieldClass} name="email" type="email" placeholder={dict.checkout.email} autoComplete="email" required />
          <input className={fieldClass} name="phone" type="tel" placeholder={dict.checkout.phone} autoComplete="tel" />
          <input className={`${fieldClass} sm:col-span-2`} name="addressLine1" placeholder={dict.checkout.address} autoComplete="address-line1" required />
          <input className={`${fieldClass} sm:col-span-2`} name="addressLine2" placeholder={dict.checkout.apartment} autoComplete="address-line2" />
          <input className={fieldClass} name="city" placeholder={dict.checkout.city} autoComplete="address-level2" required />
          <input className={fieldClass} name="postalCode" placeholder={dict.checkout.postal} autoComplete="postal-code" required />
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm text-zinc-600" htmlFor="checkout-country">
              {dict.checkout.country}
            </label>
            <select
              id="checkout-country"
              className={`${fieldClass} w-full`}
              name="country"
              autoComplete="country"
              value={country}
              onChange={(event) => {
                const next = event.target.value;
                setCountry(next);
                if (getShippingZone(next) !== "israel") setShippingMethod("standard");
              }}
              required
            >
              {countries.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <fieldset className="mt-8">
          <legend className="text-xl font-medium">{dict.checkout.delivery}</legend>
          <div className="mt-4 grid gap-3">
            <label className="flex items-center justify-between rounded-lg border border-zinc-300 p-4">
              <span>
                <input
                  className="me-3"
                  type="radio"
                  name="shippingMethod"
                  value="standard"
                  checked={method === "standard"}
                  onChange={() => setShippingMethod("standard")}
                />
                {isIsrael ? dict.checkout.standard : dict.checkout.upsSaver}
              </span>
              <span>{shippingIls === 0 ? dict.checkout.free : format(shippingIls)}</span>
            </label>
            {isIsrael ? (
              <label className="flex items-center justify-between rounded-lg border border-zinc-300 p-4">
                <span>
                  <input
                    className="me-3"
                    type="radio"
                    name="shippingMethod"
                    value="express"
                    checked={shippingMethod === "express"}
                    onChange={() => setShippingMethod("express")}
                  />
                  {dict.checkout.express}
                </span>
                <span>{format(EXPRESS_SHIPPING_ILS_CENTS)}</span>
              </label>
            ) : (
              <p className="text-sm text-zinc-500">
                {dict.checkout.intlNote}{" "}
                <LocaleLink className="underline" href="/shipping">
                  {dict.footer.delivery}
                </LocaleLink>
              </p>
            )}
          </div>
        </fieldset>
        <label className="mt-6 flex items-start gap-3 text-sm">
          <input className="mt-1" type="checkbox" name="acceptsTerms" required />
          <span>{dict.checkout.terms}</span>
        </label>
      </section>
      <aside className="h-fit rounded-xl bg-zinc-50 p-6">
        <h2 className="text-xl font-medium">{dict.checkout.summary}</h2>
        <ul className="mt-5 space-y-3 text-sm">
          {items.map((item) => (
            <li className="flex justify-between gap-4" key={item.variantId}>
              <span>{item.productName}, {dict.variants[item.variantName as keyof typeof dict.variants] ?? item.variantName} × {item.quantity}</span>
              <span>{format(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-between border-t border-zinc-200 pt-5 text-lg font-medium">
          <span>{dict.checkout.total}</span>
          <span>{format(totals.subtotal + shippingIls)}</span>
        </div>
        {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
        <button
          className="mt-6 w-full rounded-full bg-zinc-950 px-5 py-3 text-white disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? dict.checkout.starting : dict.checkout.pay}
        </button>
        <p className="mt-3 text-xs text-zinc-500">
          {dict.checkout.demo}
        </p>
      </aside>
    </form>
  );
}
