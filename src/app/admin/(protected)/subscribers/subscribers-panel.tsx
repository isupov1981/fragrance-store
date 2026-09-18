"use client";

import { FormEvent, useMemo, useState } from "react";

import { useAdminI18n } from "@/components/admin/admin-i18n-provider";
import type { AdminSubscriber } from "@/lib/newsletter/subscribers";

type Props = {
  initialSubscribers: AdminSubscriber[];
};

export function SubscribersPanel({ initialSubscribers }: Props) {
  const { dict } = useAdminI18n();
  const copy = dict.subscribers;
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [email, setEmail] = useState("");
  const [locale, setLocale] = useState("he");
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState(false);

  const counts = useMemo(() => {
    const active = subscribers.filter((row) => row.active).length;
    return { total: subscribers.length, active, blocked: subscribers.length - active };
  }, [subscribers]);

  async function addSubscriber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(undefined);
    setError(false);
    try {
      const response = await fetch("/api/admin/newsletter/subscribers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      const data = (await response.json().catch(() => null)) as {
        subscriber?: AdminSubscriber;
        error?: string;
      } | null;
      if (!response.ok || !data?.subscriber) {
        setError(true);
        setMessage(data?.error ?? copy.addFailed);
        return;
      }
      setSubscribers((rows) => {
        const without = rows.filter((row) => row.id !== data.subscriber!.id && row.email !== data.subscriber!.email);
        return [data.subscriber!, ...without];
      });
      setEmail("");
      setMessage(copy.addOk);
    } catch {
      setError(true);
      setMessage(copy.addFailed);
    } finally {
      setPending(false);
    }
  }

  async function setBlocked(id: string, blocked: boolean) {
    setBusyId(id);
    setMessage(undefined);
    setError(false);
    try {
      const response = await fetch(`/api/admin/newsletter/subscribers/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ blocked }),
      });
      const data = (await response.json().catch(() => null)) as {
        subscriber?: AdminSubscriber;
        error?: string;
      } | null;
      if (!response.ok || !data?.subscriber) {
        setError(true);
        setMessage(data?.error ?? copy.updateFailed);
        return;
      }
      setSubscribers((rows) => rows.map((row) => (row.id === id ? data.subscriber! : row)));
      setMessage(blocked ? copy.blockedOk : copy.unblockedOk);
    } catch {
      setError(true);
      setMessage(copy.updateFailed);
    } finally {
      setBusyId(null);
    }
  }

  async function removeSubscriber(id: string) {
    if (!window.confirm(copy.deleteConfirm)) return;
    setBusyId(id);
    setMessage(undefined);
    setError(false);
    try {
      const response = await fetch(`/api/admin/newsletter/subscribers/${id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(true);
        setMessage(data?.error ?? copy.deleteFailed);
        return;
      }
      setSubscribers((rows) => rows.filter((row) => row.id !== id));
      setMessage(copy.deleteOk);
    } catch {
      setError(true);
      setMessage(copy.deleteFailed);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-white p-5 shadow-sm" aria-labelledby="subscribers-add-heading">
        <h2 id="subscribers-add-heading" className="text-xl font-semibold">
          {copy.addTitle}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{copy.addHelp}</p>
        <form onSubmit={addSubscriber} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[16rem] flex-1 text-sm">
            <span className="mb-1 block text-slate-600">{copy.email}</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              type="email"
              name="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">{copy.locale}</span>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2"
              name="locale"
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
            >
              <option value="he">עברית</option>
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </label>
          <button
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            type="submit"
            disabled={pending || !email.trim()}
          >
            {pending ? copy.adding : copy.add}
          </button>
        </form>
      </section>

      <section className="overflow-x-auto rounded-xl bg-white shadow-sm" aria-labelledby="subscribers-list-heading">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 id="subscribers-list-heading" className="text-xl font-semibold">
            {copy.listTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {copy.counts
              .replace("{total}", String(counts.total))
              .replace("{active}", String(counts.active))
              .replace("{blocked}", String(counts.blocked))}
          </p>
          {message ? (
            <p className={`mt-2 text-sm ${error ? "text-red-600" : "text-slate-600"}`} role="status">
              {message}
            </p>
          ) : null}
        </div>
        <table className="w-full border-collapse text-start">
          <caption className="sr-only">{copy.listTitle}</caption>
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-sm">
                {copy.email}
              </th>
              <th scope="col" className="px-4 py-3 text-sm">
                {copy.locale}
              </th>
              <th scope="col" className="px-4 py-3 text-sm">
                {copy.status}
              </th>
              <th scope="col" className="px-4 py-3 text-sm">
                {copy.joined}
              </th>
              <th scope="col" className="px-4 py-3 text-sm">
                {copy.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length ? (
              subscribers.map((row) => {
                const busy = busyId === row.id;
                return (
                  <tr key={row.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3 uppercase">{row.locale}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          row.active
                            ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800"
                            : "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                        }
                      >
                        {row.active ? copy.statusActive : copy.statusBlocked}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.active ? (
                          <button
                            type="button"
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-60"
                            disabled={busy}
                            onClick={() => setBlocked(row.id, true)}
                          >
                            {copy.block}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-60"
                            disabled={busy}
                            onClick={() => setBlocked(row.id, false)}
                          >
                            {copy.unblock}
                          </button>
                        )}
                        <button
                          type="button"
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 disabled:opacity-60"
                          disabled={busy}
                          onClick={() => removeSubscriber(row.id)}
                        >
                          {copy.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  {copy.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
