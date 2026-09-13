export const currencies = ["USD", "EUR", "ILS"] as const;

export type Currency = (typeof currencies)[number];

export const defaultCurrency: Currency = "USD";

export const CURRENCY_COOKIE = "fragrance_currency";

export const currencyMeta: Record<Currency, { label: string; symbol: string }> = {
  USD: { label: "USD", symbol: "$" },
  EUR: { label: "EUR", symbol: "€" },
  ILS: { label: "ILS", symbol: "₪" },
};

/** Catalog prices are stored in USD cents. */
export const usdRates: Record<Currency, number> = {
  USD: 1,
  EUR: Number(process.env.NEXT_PUBLIC_FX_EUR ?? 0.92),
  ILS: Number(process.env.NEXT_PUBLIC_FX_ILS ?? 3.72),
};

export const FREE_SHIPPING_USD_CENTS = 25000;
export const STANDARD_SHIPPING_USD_CENTS = 1200;
export const EXPRESS_SHIPPING_USD_CENTS = 2500;

export function isCurrency(value: string | undefined | null): value is Currency {
  return value === "USD" || value === "EUR" || value === "ILS";
}

export function convertUsdCents(amountUsdCents: number, currency: Currency) {
  return Math.round(amountUsdCents * usdRates[currency]);
}

export function formatMoney(amountCents: number, currency: Currency = "USD", locale = "en-US") {
  void locale;
  const amount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    numberingSystem: "latn",
  }).format(amountCents / 100);
  return `${currencyMeta[currency].symbol}${amount}`;
}
