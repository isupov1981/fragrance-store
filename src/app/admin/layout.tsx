import { AdminI18nProvider } from "@/components/admin/admin-i18n-provider";
import { DocumentLocale } from "@/components/i18n/document-locale";
import { getAdminLocale } from "@/lib/admin/get-locale";

export default async function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getAdminLocale();
  return (
    <AdminI18nProvider initialLocale={locale}>
      <DocumentLocale locale={locale} />
      {children}
    </AdminI18nProvider>
  );
}
