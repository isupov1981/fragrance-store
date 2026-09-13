"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    setPending(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Не удалось войти");
      return;
    }
    const next = search.get("next");
    router.replace(next?.startsWith("/admin") ? next : "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4" aria-describedby="login-error">
      <div>
        <label htmlFor="email" className="mb-1 block font-medium">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block font-medium">Пароль</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <p id="login-error" role="alert" aria-live="polite" className="min-h-6 text-sm text-red-700">
        {error}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Вход…" : "Войти"}
      </button>
    </form>
  );
}
