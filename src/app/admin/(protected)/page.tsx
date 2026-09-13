import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/server";

const cards = [
  { label: "Товары", value: "128", note: "12 черновиков", href: "/admin/products" },
  { label: "Заказы", value: "24", note: "5 требуют внимания", href: "/admin/orders" },
  { label: "Клиенты", value: "342", note: "+18 за месяц", href: "/admin/customers" },
  { label: "Страницы", value: "9", note: "2 не опубликованы", href: "/admin/content" },
];

export default async function AdminDashboard() {
  await requireAdminPage();
  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">Демонстрационные данные</p>
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
      <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="demo-heading">
        <h2 id="demo-heading" className="font-semibold">Scaffold-режим</h2>
        <p className="mt-1 text-sm text-slate-700">
          Списки и формы ниже демонстрируют архитектуру без запроса к БД при сборке.
          CSV API подключает Prisma только во время подтверждённой операции.
        </p>
      </section>
    </>
  );
}
