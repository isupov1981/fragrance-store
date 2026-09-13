import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <section
        aria-labelledby="login-title"
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"
      >
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-500">
          Fragrance Store
        </p>
        <h1 id="login-title" className="mb-2 text-3xl font-bold">Админ-панель</h1>
        <p className="mb-6 text-slate-600">
          Войдите с учётными данными, заданными в окружении сервера.
        </p>
        <Suspense fallback={<p>Загрузка формы…</p>}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
