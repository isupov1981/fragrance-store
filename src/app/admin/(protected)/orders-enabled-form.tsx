"use client";

import { FormEvent, useState } from "react";

import { useAdminI18n } from "@/components/admin/admin-i18n-provider";

type Props = {
  initialEnabled: boolean;
  canEnableOrders?: boolean;
  paymentProvider?: string;
};

export function OrdersEnabledForm({
  initialEnabled,
  canEnableOrders = true,
  paymentProvider = "unknown",
}: Props) {
  const { dict } = useAdminI18n();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState(false);
  const [blocked, setBlocked] = useState(!canEnableOrders);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(undefined);
    setError(false);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ordersEnabled: enabled }),
      });
      const data = (await response.json().catch(() => null)) as {
        ordersEnabled?: boolean;
        error?: string;
        code?: string;
        canEnableOrders?: boolean;
        paymentProvider?: string;
      } | null;
      if (!response.ok) {
        setError(true);
        setBlocked(data?.code === "demo_payments" || data?.canEnableOrders === false);
        setMessage(
          data?.code === "demo_payments"
            ? dict.settings.demoPaymentsBlocked
            : (data?.error ?? dict.settings.saveFailed),
        );
        return;
      }
      setEnabled(Boolean(data?.ordersEnabled));
      setBlocked(data?.canEnableOrders === false);
      setMessage(data?.ordersEnabled ? dict.settings.enabledOk : dict.settings.disabledOk);
    } catch {
      setError(true);
      setMessage(dict.settings.saveFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl bg-white p-5 shadow-sm"
      aria-labelledby="orders-enabled-heading"
    >
      <p className="text-sm font-medium text-slate-500">{dict.settings.eyebrow}</p>
      <h2 id="orders-enabled-heading" className="mt-1 text-xl font-bold">
        {dict.settings.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">{dict.settings.copy}</p>
      <p className="mt-2 text-sm text-slate-500">
        {dict.settings.paymentProvider}: <span className="font-medium text-slate-700">{paymentProvider}</span>
      </p>

      {blocked ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
          {dict.settings.demoPaymentsBlocked}
        </p>
      ) : null}

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4">
        <input
          className="mt-1 size-4"
          type="checkbox"
          checked={enabled}
          onChange={(event) => {
            if (blocked && event.target.checked) return;
            setEnabled(event.target.checked);
          }}
          name="ordersEnabled"
        />
        <span>
          <span className="block font-medium">{dict.settings.ordersLabel}</span>
          <span className="mt-1 block text-sm text-slate-500">
            {enabled ? dict.settings.ordersOn : dict.settings.ordersOff}
          </span>
        </span>
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={pending || (blocked && enabled)}
        >
          {pending ? dict.settings.saving : dict.settings.save}
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
