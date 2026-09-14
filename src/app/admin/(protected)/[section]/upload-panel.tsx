"use client";

import { FormEvent, useState } from "react";

export function UploadPanel() {
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("file");
    if (!(file instanceof File) || !file.size) return;
    setPending(true);
    setMessage("");
    const data = new FormData();
    data.set("file", file);
    const response = await fetch("/api/admin/uploads", { method: "POST", body: data });
    const body = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setUrl("");
      setMessage(body.error ?? "Не удалось загрузить изображение");
      return;
    }
    setUrl(body.url);
    setMessage("Изображение сохранено. URL можно вставить в форму товара или CSV.");
    form.reset();
  }

  return (
    <section className="mt-8 rounded-xl bg-white p-5 shadow-sm" aria-labelledby="upload-heading">
      <h2 id="upload-heading" className="text-xl font-semibold">Загрузка изображений</h2>
      <p className="mb-4 text-sm text-slate-600">
        JPEG, PNG или WebP до 5 МБ. При заданных <code>S3_*</code> (MinIO локально) файл уходит в бакет;
        иначе — в <code>uploads/</code> и раздаётся с <code>/api/media/...</code>.
      </p>
      <form className="flex flex-wrap items-end gap-3" onSubmit={submit}>
        <div>
          <label htmlFor="product-image" className="mb-1 block text-sm font-medium">Файл</label>
          <input id="product-image" name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
        </div>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60" disabled={pending} type="submit">
          {pending ? "Загрузка…" : "Загрузить"}
        </button>
      </form>
      <p role="status" className="mt-3 text-sm">{message}</p>
      {url ? (
        <p className="mt-2 break-all text-sm">
          <a className="underline" href={url}>{url}</a>
        </p>
      ) : null}
    </section>
  );
}
