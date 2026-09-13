export const locales = ["en", "he"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeMeta: Record<Locale, { html: string; dir: "ltr" | "rtl"; intl: string; label: string }> = {
  en: { html: "en", dir: "ltr", intl: "en-US", label: "English" },
  he: { html: "he", dir: "rtl", intl: "he-IL", label: "עברית" },
};

export const LOCALE_COOKIE = "fragrance_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "he";
}

export function negotiateLocale(acceptLanguage: string | null, cookie?: string | null): Locale {
  if (isLocale(cookie)) return cookie;
  const header = acceptLanguage?.toLowerCase() ?? "";
  if (header.includes("he") || header.includes("iw")) return "he";
  return defaultLocale;
}
