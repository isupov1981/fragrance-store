"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  convertUsdCents,
  CURRENCY_COOKIE,
  type Currency,
  formatMoney,
  isCurrency,
} from "@/lib/currency";
import { localeMeta, type Locale } from "@/lib/i18n/config";

type CurrencyValue = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convert: (usdCents: number) => number;
  format: (usdCents: number) => string;
};

const CurrencyContext = createContext<CurrencyValue | null>(null);

function persistCurrency(currency: Currency) {
  document.cookie = `${CURRENCY_COOKIE}=${currency}; path=/; max-age=31536000; samesite=lax`;
}

export function CurrencyProvider({
  initialCurrency,
  locale,
  children,
}: {
  initialCurrency: Currency;
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);
  const intlLocale = localeMeta[locale].intl;

  const setCurrency = useCallback(
    (next: Currency) => {
      if (!isCurrency(next)) return;
      setCurrencyState(next);
      persistCurrency(next);
      router.refresh();
    },
    [router],
  );

  const value = useMemo<CurrencyValue>(
    () => ({
      currency,
      setCurrency,
      convert: (usdCents) => convertUsdCents(usdCents, currency),
      format: (usdCents) => formatMoney(convertUsdCents(usdCents, currency), currency, intlLocale),
    }),
    [currency, intlLocale, setCurrency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const value = useContext(CurrencyContext);
  if (!value) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return value;
}
