"use client";

import { FormEvent, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { localeMeta } from "@/lib/i18n/config";
import { formatMoney, isCurrency } from "@/lib/currency";

type LookupResult = {
  id: string;
  status: string;
  total: number;
  currency: string;
  items: Array<{ name: string; variant: string; quantity: number }>;
};

export function OrderLookupForm() {
  const { dict, locale } = useI18n();
  const [error, setError] = useState<string>();
  const [order, setOrder] = useState<LookupResult>();
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setOrder(undefined);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const id = String(form.get("orderId") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const response = await fetch(`/api/orders/${encodeURIComponent(id)}?email=${encodeURIComponent(email)}`);
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(dict.account.notFound);
      return;
    }
    setOrder(result as LookupResult);
  }

  return (
    <div className="mx-auto max-w-xl">
      <form className="grid gap-5" onSubmit={submit}>
        <div>
          <label className="eyebrow" htmlFor="account-email">{dict.account.email}</label>
          <input className="mt-2 w-full border-b border-ink/25 bg-transparent py-3 text-sm outline-none" id="account-email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label className="eyebrow" htmlFor="account-order">{dict.account.orderId}</label>
          <input className="mt-2 w-full border-b border-ink/25 bg-transparent py-3 text-sm outline-none" id="account-order" name="orderId" required />
        </div>
        <button className="button-primary h-13 w-max" type="submit" disabled={loading}>
          {dict.account.lookup}
        </button>
        {error ? <p role="status" className="text-sm text-ink/70">{error}</p> : null}
      </form>
      {order ? (
        <section className="mt-10 border-t border-ink/10 pt-8" aria-live="polite">
          <p className="eyebrow">{dict.account.status}</p>
          <p className="mt-2 font-display text-3xl">{order.status}</p>
          <p className="mt-4 text-sm">{dict.account.total}: {formatOrderTotal(order.total, order.currency, locale)}</p>
          <ul className="mt-6 space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={`${item.name}-${item.variant}`}>
                {item.name} · {item.variant} × {item.quantity}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function formatOrderTotal(amount: number, currency: string, locale: keyof typeof localeMeta) {
  const code = currency.toUpperCase();
  return formatMoney(amount, isCurrency(code) ? code : "USD", localeMeta[locale].intl);
}
