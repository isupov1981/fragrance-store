"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { ADMIN_LOCALE_COOKIE } from "@/lib/admin/locale";
import { adminDictionaries, type AdminDictionary } from "@/lib/admin/i18n";
import { localeMeta, type Locale } from "@/lib/i18n/config";

type AdminI18nValue = {
  locale: Locale;
  dict: AdminDictionary;
  setLocale: (locale: Locale) => void;
};

const AdminI18nContext = createContext<AdminI18nValue | null>(null);

function persistAdminLocale(locale: Locale) {
  document.cookie = `${ADMIN_LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function AdminI18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const dict = adminDictionaries[locale];
  const meta = localeMeta[locale];

  const setLocale = useCallback(
    (next: Locale) => {
      if (next !== "en" && next !== "he") return;
      setLocaleState(next);
      persistAdminLocale(next);
      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ locale, dict, setLocale }), [dict, locale, setLocale]);

  return (
    <AdminI18nContext.Provider value={value}>
      <div lang={meta.html} dir={meta.dir} className="min-h-screen">
        {children}
      </div>
    </AdminI18nContext.Provider>
  );
}

export function useAdminI18n() {
  const value = useContext(AdminI18nContext);
  if (!value) {
    throw new Error("useAdminI18n must be used within AdminI18nProvider");
  }
  return value;
}
