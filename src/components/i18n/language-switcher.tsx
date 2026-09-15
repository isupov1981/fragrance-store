"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LOCALE_COOKIE, locales } from "@/lib/i18n/config";
import { replaceLocaleInPath } from "@/lib/i18n/path";
import { useI18n } from "./i18n-provider";

export function LanguageSwitcher() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  return (
    <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em]" role="group" aria-label={dict.nav.language}>
      {locales.map((item) => {
        const href = `${replaceLocaleInPath(pathname, item)}${search ? `?${search}` : ""}`;
        const active = item === locale;
        return (
          <Link
            key={item}
            className={`px-1.5 py-1 transition ${active ? "text-current" : "opacity-45 hover:opacity-100"}`}
            href={href}
            hrefLang={item}
            lang={item}
            onClick={() => {
              document.cookie = `${LOCALE_COOKIE}=${item}; path=/; max-age=31536000; samesite=lax`;
            }}
            aria-current={active ? "true" : undefined}
          >
            {item === "he" ? "עב" : item === "ru" ? "RU" : "EN"}
          </Link>
        );
      })}
    </div>
  );
}
