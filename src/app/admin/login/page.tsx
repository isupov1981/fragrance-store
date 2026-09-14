import { Suspense } from "react";

import { AdminLocaleSwitcher } from "@/components/admin/admin-locale-switcher";
import { getAdminDictionary } from "@/lib/admin/i18n";
import { getAdminLocale } from "@/lib/admin/get-locale";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const locale = await getAdminLocale();
  const dict = getAdminDictionary(locale);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <section
        aria-labelledby="login-title"
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-500">
              {dict.login.eyebrow}
            </p>
            <h1 id="login-title" className="text-3xl font-bold">
              {dict.login.title}
            </h1>
          </div>
          <AdminLocaleSwitcher />
        </div>
        <p className="mb-6 text-slate-600">{dict.login.copy}</p>
        <Suspense fallback={<p>{dict.login.loading}</p>}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
