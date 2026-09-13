"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Preview = {
  total: number;
  errors: { row: number; issues: string[] }[];
  rows: { sku: string; name: string; price: number; stock: number }[];
};

export function CsvPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function previewFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setPending(true);
    setMessage("");
    const data = new FormData();
    data.set("file", file);
    const response = await fetch("/api/admin/products/csv/preview", { method: "POST", body: data });
    const body = await response.json();
    setPending(false);
    if (!response.ok) {
      setPreview(null);
      setMessage(body.error ?? "Не удалось проверить CSV");
      return;
    }
    setPreview(body);
    setMessage(`Проверено строк: ${body.total}. Ошибок: ${body.errors.length}.`);
  }

  async function runImport() {
    if (!file || !preview || preview.errors.length) return;
    setPending(true);
    const data = new FormData();
    data.set("file", file);
    data.set("confirm", "true");
    const response = await fetch("/api/admin/products/csv/import", { method: "POST", body: data });
    const body = await response.json();
    setPending(false);
    setMessage(
      response.ok
        ? `Импорт завершён: создано ${body.created}, обновлено ${body.updated}.`
        : body.error ?? "Импорт не выполнен",
    );
  }

  return (
    <section className="mt-8 rounded-xl bg-white p-5 shadow-sm" aria-labelledby="csv-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="csv-heading" className="text-xl font-semibold">CSV import / export</h2>
          <p className="text-sm text-slate-600">
            Сначала проверьте файл. Импорт доступен роли ADMIN при валидных строках.
          </p>
        </div>
        <Link href="/api/admin/products/csv/export" className="rounded-lg border border-slate-300 px-4 py-2">
          Экспорт CSV
        </Link>
      </div>
      <form onSubmit={previewFile} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="csv-file" className="mb-1 block text-sm font-medium">Файл товаров</label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            required
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setPreview(null);
            }}
          />
        </div>
        <button disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60">
          Проверить
        </button>
        <button
          type="button"
          onClick={runImport}
          disabled={pending || !preview || preview.errors.length > 0}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-white disabled:opacity-50"
        >
          Подтвердить импорт
        </button>
      </form>
      <p role="status" aria-live="polite" className="mt-3 text-sm">{message}</p>
      {preview?.errors.length ? (
        <ul className="mt-3 list-disc pl-5 text-sm text-red-700">
          {preview.errors.slice(0, 10).map((error) => (
            <li key={error.row}>Строка {error.row}: {error.issues.join("; ")}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
