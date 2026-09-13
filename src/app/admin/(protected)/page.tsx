import Link from "next/link";
import { getAdminDashboard } from "@/lib/admin/queries";
import { requireAdminPage } from "@/lib/auth/server";

export default async function AdminDashboard() {
  await requireAdminPage();
  const cards = await getAdminDashboard();
  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">Данные из PostgreSQL</p>
        <h1 className="text-3xl font-bold">Обзор магазина</h1>
      </div>
      <section aria-label="Показатели" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-xl bg-white p-5 shadow-sm focus:ring-2 focus:ring-slate-900">
            <p className="text-sm text-slate-600">{card.label}</p>
            <p className="my-2 text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-slate-500">{card.note}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
