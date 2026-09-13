"use client";

import { FormEvent, useState } from "react";

export function ResourceForm({
  section,
  fields,
}: {
  section: string;
  fields: ReadonlyArray<readonly [string, string]>;
}) {
  const [message, setMessage] = useState<string>();
  const [saving, setSaving] = useState(false);
  const creatable = section !== "orders";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(undefined);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(`/api/admin/${section}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage(result.error ?? "Не удалось сохранить запись");
      return;
    }
    event.currentTarget.reset();
    setMessage("Запись сохранена. Обновите список для просмотра.");
  }

  return (
    <form className="grid gap-4 md:grid-cols-3" onSubmit={submit}>
      {fields.map(([name, label]) => (
        <div key={name}>
          <label htmlFor={`${section}-${name}`} className="mb-1 block text-sm font-medium">{label}</label>
          <input id={`${section}-${name}`} name={name} required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
      ))}
      <div className="md:col-span-3">
        <button type="submit" disabled={!creatable || saving} className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60">
          {!creatable ? "Заказы создаются через checkout" : saving ? "Сохранение…" : "Сохранить"}
        </button>
        {message ? <p role="status" className="mt-2 text-sm">{message}</p> : null}
      </div>
    </form>
  );
}
