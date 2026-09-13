"use client";

import { currencies, currencyMeta } from "@/lib/currency";
import { useCurrency } from "./currency-provider";
import { useI18n } from "./i18n-provider";

export function CurrencySwitcher() {
  const { dict } = useI18n();
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em]" role="group" aria-label={dict.nav.currency}>
      {currencies.map((item) => {
        const active = item === currency;
        return (
          <button
            key={item}
            className={`px-1.5 py-1 transition ${active ? "text-current" : "opacity-45 hover:opacity-100"}`}
            type="button"
            onClick={() => setCurrency(item)}
            aria-pressed={active}
          >
            {currencyMeta[item].symbol}
            <span className="sr-only">{currencyMeta[item].label}</span>
          </button>
        );
      })}
    </div>
  );
}
