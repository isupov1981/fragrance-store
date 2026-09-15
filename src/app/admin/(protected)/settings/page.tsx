import { OrdersEnabledForm } from "@/app/admin/(protected)/orders-enabled-form";
import { getOrdersEnabled } from "@/lib/commerce";
import { getAdminDictionary } from "@/lib/admin/i18n";
import { getAdminLocale } from "@/lib/admin/get-locale";
import { requireAdminPage } from "@/lib/auth/server";

export default async function AdminSettingsPage() {
  await requireAdminPage();
  const locale = await getAdminLocale();
  const dict = getAdminDictionary(locale);
  const ordersEnabled = await getOrdersEnabled();

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">{dict.settings.eyebrow}</p>
        <h1 className="text-3xl font-bold">{dict.nav.settings}</h1>
      </div>
      <OrdersEnabledForm initialEnabled={ordersEnabled} />
    </>
  );
}
