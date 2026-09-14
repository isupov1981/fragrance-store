import { cookies } from "next/headers";

import { ADMIN_LOCALE_COOKIE, defaultAdminLocale, isAdminLocale } from "@/lib/admin/locale";
import type { Locale } from "@/lib/i18n/config";

export async function getAdminLocale(): Promise<Locale> {
  const value = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  return isAdminLocale(value) ? value : defaultAdminLocale;
}
