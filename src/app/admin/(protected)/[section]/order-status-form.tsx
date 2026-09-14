"use client";

import { FormEvent, useState } from "react";

import { useAdminI18n } from "@/components/admin/admin-i18n-provider";
import { formatAdminMessage } from "@/lib/admin/i18n";

const statuses = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;

export function OrderStatusForm({ id, status }: { id: string; status: string }) {
  const { dict } = useAdminI18n();
  const [value, setValue] = useState(status);
  const [message, setMessage] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    setMessage(response.ok ? dict.orders.updated : dict.orders.updateFailed);
  }

  return (
    <form className="flex items-center gap-2" onSubmit={submit}>
      <label className="sr-only" htmlFor={`order-status-${id}`}>
        {formatAdminMessage(dict.orders.statusLabel, { id })}
      </label>
      <select
        className="rounded border border-slate-300 px-2 py-1 text-sm"
        id={`order-status-${id}`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        {statuses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <button className="rounded bg-slate-900 px-2 py-1 text-xs text-white" type="submit">
        OK
      </button>
      {message ? <span className="text-xs text-slate-500">{message}</span> : null}
    </form>
  );
}
