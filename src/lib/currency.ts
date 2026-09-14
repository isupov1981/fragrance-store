export const currencies = ["ILS", "USD", "EUR"] as const;

export type Currency = (typeof currencies)[number];

/** Catalog and cart prices are stored in ILS agorot (minor units). */
export const defaultCurrency: Currency = "ILS";

export const CURRENCY_COOKIE = "fragrance_currency";

export const currencyMeta: Record<Currency, { label: string; symbol: string }> = {
  ILS: { label: "ILS", symbol: "₪" },
  USD: { label: "USD", symbol: "$" },
  EUR: { label: "EUR", symbol: "€" },
};

/** How many shekels equal one US dollar. */
export const ILS_PER_USD = Number(process.env.NEXT_PUBLIC_FX_ILS ?? 3.72);

/** How many euros equal one US dollar. */
export const EUR_PER_USD = Number(process.env.NEXT_PUBLIC_FX_EUR ?? 0.92);

export const FREE_SHIPPING_ILS_CENTS = 93000;
export const STANDARD_SHIPPING_ILS_CENTS = 4500;
export const EXPRESS_SHIPPING_ILS_CENTS = 9300;

/** @deprecated Use FREE_SHIPPING_ILS_CENTS — catalog base is ILS. */
export const FREE_SHIPPING_USD_CENTS = FREE_SHIPPING_ILS_CENTS;
/** @deprecated Use STANDARD_SHIPPING_ILS_CENTS */
export const STANDARD_SHIPPING_USD_CENTS = STANDARD_SHIPPING_ILS_CENTS;
/** @deprecated Use EXPRESS_SHIPPING_ILS_CENTS */
export const EXPRESS_SHIPPING_USD_CENTS = EXPRESS_SHIPPING_ILS_CENTS;

export function isCurrency(value: string | undefined | null): value is Currency {
  return value === "USD" || value === "EUR" || value === "ILS";
}

/**
 * Convert catalog amounts (ILS agorot) into the display/checkout currency.
 * USD and EUR are rounded to whole major units (no cents).
 */
export function convertCatalogCents(ilsCents: number, currency: Currency) {
  if (currency === "ILS") return ilsCents;
  const usdMajor = ilsCents / 100 / ILS_PER_USD;
  if (currency === "USD") return Math.round(usdMajor) * 100;
  return Math.round(usdMajor * EUR_PER_USD) * 100;
}

/** @deprecated Prefer convertCatalogCents — amounts are ILS-based. */
export const convertUsdCents = convertCatalogCents;

export function formatMoney(amountCents: number, currency: Currency = "ILS", locale = "en-US") {
  void locale;
  const amount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency === "ILS" ? 2 : 0,
    maximumFractionDigits: currency === "ILS" ? 2 : 0,
    numberingSystem: "latn",
  }).format(amountCents / 100);
  return `${currencyMeta[currency].symbol}${amount}`;
}
