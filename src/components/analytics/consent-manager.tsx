"use client";

import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  CONSENT_CHANGE_EVENT,
  CONSENT_KEY,
  CONSENT_OPEN_EVENT,
  parseConsent,
  serializeConsent,
  type ConsentPreferences,
} from "@/lib/consent/preferences";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
  };
}

function getConsent() {
  try {
    return parseConsent(localStorage.getItem(CONSENT_KEY));
  } catch {
    return null;
  }
}

function readNonce() {
  if (typeof document === "undefined") return undefined;
  return document.body.dataset.nonce || undefined;
}

export function ConsentManager() {
  const { dict } = useI18n();
  const consent = useSyncExternalStore(subscribe, getConsent, () => null);
  const [customizing, setCustomizing] = useState(false);
  const [forcedOpen, setForcedOpen] = useState(false);
  const [draft, setDraft] = useState<Pick<ConsentPreferences, "analytics" | "marketing">>({
    analytics: false,
    marketing: false,
  });
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const nonce = readNonce();
  const showBanner = consent === null || forcedOpen;

  useEffect(() => {
    function open() {
      const current = getConsent();
      setDraft({
        analytics: current?.analytics ?? false,
        marketing: current?.marketing ?? false,
      });
      setCustomizing(true);
      setForcedOpen(true);
    }
    window.addEventListener(CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open);
  }, []);

  function persist(prefs: Pick<ConsentPreferences, "analytics" | "marketing">) {
    try {
      localStorage.setItem(CONSENT_KEY, serializeConsent(prefs));
    } catch {
      /* Private mode can block storage; still close the banner for this visit. */
    }
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
    setCustomizing(false);
    setForcedOpen(false);
  }

  return (
    <>
      {consent?.analytics && gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
            nonce={nonce}
          />
          <Script id="ga4" strategy="afterInteractive" nonce={nonce}>
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}
      {consent?.marketing && pixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive" nonce={nonce}>
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
      {showBanner ? (
        <section className="consent-banner" aria-label={dict.consent.label} data-testid="cookie-consent">
          <div>
            <strong>{dict.consent.title}</strong>
            <p>{dict.consent.copy}</p>
            <p>
              <LocaleLink className="underline" href="/cookies">
                {dict.consent.policy}
              </LocaleLink>
            </p>
            {customizing ? (
              <fieldset className="consent-choices">
                <legend className="sr-only">{dict.consent.customize}</legend>
                <label>
                  <input type="checkbox" checked disabled />
                  <span>
                    <strong>{dict.consent.necessary}</strong>
                    <span>{dict.consent.necessaryCopy}</span>
                  </span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.analytics}
                    onChange={(event) => setDraft((current) => ({ ...current, analytics: event.target.checked }))}
                  />
                  <span>
                    <strong>{dict.consent.analytics}</strong>
                    <span>{dict.consent.analyticsCopy}</span>
                  </span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.marketing}
                    onChange={(event) => setDraft((current) => ({ ...current, marketing: event.target.checked }))}
                  />
                  <span>
                    <strong>{dict.consent.marketing}</strong>
                    <span>{dict.consent.marketingCopy}</span>
                  </span>
                </label>
              </fieldset>
            ) : null}
          </div>
          <div className="consent-actions">
            {customizing ? (
              <button type="button" className="button-dark" onClick={() => persist(draft)}>
                {dict.consent.save}
              </button>
            ) : (
              <>
                <button type="button" onClick={() => setCustomizing(true)}>
                  {dict.consent.customize}
                </button>
                <button type="button" onClick={() => persist({ analytics: false, marketing: false })}>
                  {dict.consent.decline}
                </button>
                <button
                  type="button"
                  className="button-dark"
                  onClick={() => persist({ analytics: true, marketing: true })}
                >
                  {dict.consent.accept}
                </button>
              </>
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}

export function trackCommerceEvent(
  event: "view_item" | "add_to_cart" | "begin_checkout" | "purchase",
  payload: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  let consent;
  try {
    consent = parseConsent(localStorage.getItem(CONSENT_KEY));
  } catch {
    return;
  }
  if (!consent) return;
  const analyticsWindow = window as typeof window & {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  };
  if (consent.analytics) analyticsWindow.gtag?.("event", event, payload);
  if (consent.marketing) analyticsWindow.fbq?.("track", event, payload);
}
