import { isLocale, type Locale } from "@/lib/i18n/config";

export const ADMIN_LOCALE_COOKIE = "fragrance_admin_locale";
export const defaultAdminLocale: Locale = "en";

export function isAdminLocale(value: string | undefined | null): value is Locale {
  return isLocale(value);
}
