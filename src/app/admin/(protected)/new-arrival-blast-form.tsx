"use client";

import { FormEvent, useState } from "react";

import { useAdminI18n } from "@/components/admin/admin-i18n-provider";
import { formatAdminMessage } from "@/lib/admin/i18n";

type Props = {
  pendingProducts: number;
  subscribers: number;
  smtpConfigured: boolean;
};

type BlastResponse = {
  products?: number;
  subscribers?: number;
  emailsAttempted?: number;
  emailsFailed?: number;
  productSlugs?: string[];
  error?: string;
};

export function NewArrivalBlastForm({
  pendingProducts: initialPending,
  subscribers,
  smtpConfigured,
}: Props) {
  const { dict } = useAdminI18n();
  const copy = dict.newsletterBlast;
  const [pendingProducts, setPendingProducts] = useState(initialPending);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!smtpConfigured || pendingProducts < 1) return;
    if (!window.confirm(copy.confirm)) return;

    setPending(true);
    setMessage(undefined);
    setError(false);
    try {
      const response = await fetch("/api/admin/newsletter/new-arrivals", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const data = (await response.json().catch(() => null)) as BlastResponse | null;
      if (!response.ok) {
        setError(true);
        setMessage(data?.error ?? copy.failed);
        return;
      }

      const products = data?.products ?? 0;
      setPendingProducts(0);
      if (products < 1) {
        setMessage(copy.emptyOk);
        return;
      }
      setMessage(
        formatAdminMessage(copy.success, {
          products,
          subscribers: data?.subscribers ?? subscribers,
          emails: data?.emailsAttempted ?? 0,
          failed: data?.emailsFailed ?? 0,
        }),
      );
    } catch {
      setError(true);
      setMessage(copy.failed);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl bg-white p-5 shadow-sm"
      aria-labelledby="newsletter-blast-heading"
    >
      <p className="text-sm font-medium text-slate-500">{copy.eyebrow}</p>
      <h2 id="newsletter-blast-heading" className="mt-1 text-xl font-bold">
        {copy.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">{copy.copy}</p>

      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        <li>
          {pendingProducts > 0
            ? formatAdminMessage(copy.pendingProducts, { count: pendingProducts })
            : copy.pendingNone}
        </li>
        <li>{formatAdminMessage(copy.subscribers, { count: subscribers })}</li>
        <li className={smtpConfigured ? "text-slate-600" : "text-red-700"}>
          {smtpConfigured ? copy.smtpOk : copy.smtpMissing}
        </li>
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={pending || !smtpConfigured || pendingProducts < 1}
        >
          {pending ? copy.sending : copy.send}
        </button>
        {message ? (
          <p className={`text-sm ${error ? "text-red-600" : "text-slate-600"}`} role="status">
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
