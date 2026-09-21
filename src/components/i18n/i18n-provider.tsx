"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { localeMeta, type Locale } from "@/lib/i18n/config";
import type { ClientDictionary } from "@/lib/i18n/get-dictionary";

type I18nValue = {
  locale: Locale;
  dict: ClientDictionary;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, dict, children }: I18nValue & { children: ReactNode }) {
  useEffect(() => {
    const meta = localeMeta[locale];
    document.documentElement.lang = meta.html;
    document.documentElement.dir = meta.dir;
  }, [locale]);

  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return value;
}
