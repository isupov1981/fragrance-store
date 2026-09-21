export const CONSENT_KEY = "the-perfume-room-cookie-consent";
export const CONSENT_CHANGE_EVENT = "the-perfume-room-consent-change";
export const CONSENT_OPEN_EVENT = "the-perfume-room-consent-open";

export type ConsentPreferences = {
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export function parseConsent(raw: string | null | undefined): ConsentPreferences | null {
  if (!raw) return null;
  if (raw === "accepted") {
    return { analytics: true, marketing: true, updatedAt: new Date(0).toISOString() };
  }
  if (raw === "declined") {
    return { analytics: false, marketing: false, updatedAt: new Date(0).toISOString() };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentPreferences>;
    if (typeof parsed.analytics === "boolean" && typeof parsed.marketing === "boolean") {
      return {
        analytics: parsed.analytics,
        marketing: parsed.marketing,
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function serializeConsent(prefs: Pick<ConsentPreferences, "analytics" | "marketing">): string {
  return JSON.stringify({
    analytics: prefs.analytics,
    marketing: prefs.marketing,
    updatedAt: new Date().toISOString(),
  } satisfies ConsentPreferences);
}

export function openConsentPreferences() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
