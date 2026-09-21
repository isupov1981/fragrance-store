"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { openConsentPreferences } from "@/lib/consent/preferences";

export function CookieSettingsButton() {
  const { dict } = useI18n();
  return (
    <button
      className="bg-transparent p-0 text-start text-inherit transition hover:text-white"
      type="button"
      onClick={openConsentPreferences}
    >
      {dict.footer.cookieSettings}
    </button>
  );
}
