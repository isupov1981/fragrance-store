import { notFound } from "next/navigation";

import { getAdminDictionary } from "@/lib/admin/i18n";
import { getAdminLocale } from "@/lib/admin/get-locale";
import { requireAdminPage } from "@/lib/auth/server";
import { getInventoryOverview } from "@/lib/inventory/service";

import { InventoryPanel } from "./inventory-panel";

export default async function InventoryPage() {
  const session = await requireAdminPage();
  if (session.role !== "ADMIN") notFound();

  const [locale, data] = await Promise.all([
    getAdminLocale(),
    getInventoryOverview(),
  ]);
  const dict = getAdminDictionary(locale);

  return (
    <>
      <p className="text-sm font-medium text-slate-500">{dict.inventory.eyebrow}</p>
      <h1 className="text-3xl font-bold">{dict.inventory.title}</h1>
      <p className="mt-2 text-sm text-slate-600">{dict.inventory.copy}</p>
      <InventoryPanel
        initialData={data}
        labels={dict.inventory}
        tableLabels={dict.section}
        locale={locale}
      />
    </>
  );
}
