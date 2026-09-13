import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/server";

const navigation = [
  ["Обзор", "/admin"],
  ["Товары", "/admin/products"],
  ["Категории", "/admin/categories"],
  ["Бренды", "/admin/brands"],
  ["Заказы", "/admin/orders"],
  ["Клиенты", "/admin/customers"],
  ["Контент", "/admin/content"],
  ["Доставка", "/admin/shipping"],
] as const;

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdminPage();
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <a
        href="#admin-content"
        className="sr-only z-50 rounded bg-white p-3 focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        К содержимому
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/admin" className="text-xl font-bold">Fragrance Admin</Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              {session.name} · {session.role}
            </span>
            <form action="/api/admin/auth/logout" method="post">
              <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                Выйти
              </button>
            </form>
          </div>
        </div>
        <nav aria-label="Разделы админ-панели" className="mx-auto max-w-7xl overflow-x-auto px-4">
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
