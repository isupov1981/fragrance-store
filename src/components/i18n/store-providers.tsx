"use client";

import type { ReactNode } from "react";
import type { Currency } from "@/lib/currency";
import type { Dictionary } from "@/lib/i18n/en";
import type { Locale } from "@/lib/i18n/config";
import { CurrencyProvider } from "./currency-provider";
import { I18nProvider } from "./i18n-provider";

export function StoreProviders({
  locale,
  dict,
  currency,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  currency: Currency;
  children: ReactNode;
}) {
  return (
    <I18nProvider locale={locale} dict={dict}>
      <CurrencyProvider initialCurrency={currency} locale={locale}>
        {children}
      </CurrencyProvider>
    </I18nProvider>
  );
}
