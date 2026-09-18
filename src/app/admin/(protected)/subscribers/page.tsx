import { SubscribersPanel } from "@/app/admin/(protected)/subscribers/subscribers-panel";
import { getAdminDictionary } from "@/lib/admin/i18n";
import { getAdminLocale } from "@/lib/admin/get-locale";
import { requireAdminPage } from "@/lib/auth/server";
import { listAllSubscribers } from "@/lib/newsletter/subscribers";

export default async function AdminSubscribersPage() {
  await requireAdminPage();
  const locale = await getAdminLocale();
  const dict = getAdminDictionary(locale);
  const subscribers = await listAllSubscribers();

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">{dict.subscribers.eyebrow}</p>
        <h1 className="text-3xl font-bold">{dict.nav.subscribers}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{dict.subscribers.copy}</p>
      </div>
      <SubscribersPanel initialSubscribers={subscribers} />
    </>
  );
}
