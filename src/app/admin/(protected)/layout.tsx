import Link from "next/link";

import { AdminLocaleSwitcher } from "@/components/admin/admin-locale-switcher";
import { getAdminDictionary } from "@/lib/admin/i18n";
import { getAdminLocale } from "@/lib/admin/get-locale";
import { requireAdminPage } from "@/lib/auth/server";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdminPage();
  const locale = await getAdminLocale();
  const dict = getAdminDictionary(locale);
  const navigation = [
    [dict.nav.overview, "/admin"],
    [dict.nav.products, "/admin/products"],
    [dict.nav.categories, "/admin/categories"],
    [dict.nav.brands, "/admin/brands"],
    [dict.nav.orders, "/admin/orders"],
    [dict.nav.customers, "/admin/customers"],
    [dict.nav.content, "/admin/content"],
    [dict.nav.shipping, "/admin/shipping"],
    [dict.nav.settings, "/admin/settings"],
  ] as const;

  return (
    <div className="bg-slate-100 text-slate-950">
      <a
        href="#admin-content"
        className="sr-only z-50 rounded bg-white p-3 focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        {dict.skipToContent}
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/admin" className="text-xl font-bold">
            {dict.brand}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <AdminLocaleSwitcher />
            <span className="text-sm text-slate-600">
              {session.name} · {session.role}
            </span>
            <form action="/api/admin/auth/logout" method="post">
              <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {dict.logout}
              </button>
            </form>
          </div>
        </div>
        <nav aria-label={dict.navAria} className="mx-auto max-w-7xl overflow-x-auto px-4">
          <ul className="flex min-w-max gap-1 pb-3">
            {navigation.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="block rounded-lg px-3 py-2 hover:bg-slate-100 focus:bg-slate-100">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="admin-content" className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
