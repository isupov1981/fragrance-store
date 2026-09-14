"use client";

import { useAdminI18n } from "@/components/admin/admin-i18n-provider";
import { localeMeta, type Locale } from "@/lib/i18n/config";

const options: Locale[] = ["en", "he"];

export function AdminLocaleSwitcher() {
  const { locale, setLocale, dict } = useAdminI18n();

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-slate-300 p-1 text-sm" role="group" aria-label={dict.language}>
      {options.map((code) => (
        <button
          key={code}
          type="button"
          className={`rounded-md px-2.5 py-1 ${
            locale === code ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
          aria-pressed={locale === code}
          onClick={() => setLocale(code)}
        >
          {localeMeta[code].label}
        </button>
      ))}
    </div>
  );
}
