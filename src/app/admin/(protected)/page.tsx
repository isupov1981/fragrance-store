import Link from "next/link";

import { formatAdminMessage, getAdminDictionary } from "@/lib/admin/i18n";
import { getAdminLocale } from "@/lib/admin/get-locale";
import { getAdminDashboard } from "@/lib/admin/queries";
import { requireAdminPage } from "@/lib/auth/server";

export default async function AdminDashboard() {
  await requireAdminPage();
  const locale = await getAdminLocale();
  const dict = getAdminDictionary(locale);
  const stats = await getAdminDashboard();
  const cards = [
    {
      label: dict.dashboard.products,
      value: String(stats.products),
      note: formatAdminMessage(dict.dashboard.productsNote, { count: stats.drafts }),
      href: "/admin/products",
    },
    {
      label: dict.dashboard.orders,
      value: String(stats.orders),
      note: formatAdminMessage(dict.dashboard.ordersNote, { count: stats.pending }),
      href: "/admin/orders",
    },
    {
      label: dict.dashboard.customers,
      value: String(stats.customers),
      note: dict.dashboard.customersNote,
      href: "/admin/customers",
    },
    {
      label: dict.dashboard.pages,
      value: String(stats.pages),
      note: dict.dashboard.pagesNote,
      href: "/admin/content",
    },
  ];

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">{dict.dashboard.eyebrow}</p>
        <h1 className="text-3xl font-bold">{dict.dashboard.title}</h1>
      </div>
      <section aria-label={dict.dashboard.metricsAria} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="rounded-xl bg-white p-5 shadow-sm focus:ring-2 focus:ring-slate-900">
            <p className="text-sm text-slate-600">{card.label}</p>
            <p className="my-2 text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-slate-500">{card.note}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
