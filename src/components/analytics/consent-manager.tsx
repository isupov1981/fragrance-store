"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";

type Consent = "accepted" | "declined" | null;

const CONSENT_KEY = "prive-atelier-cookie-consent";
const CONSENT_EVENT = "prive-atelier-consent-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CONSENT_EVENT, onChange);
  };
}

function getConsent() {
  return localStorage.getItem(CONSENT_KEY) as Consent;
}

export function ConsentManager() {
  const { dict } = useI18n();
  const consent = useSyncExternalStore(subscribe, getConsent, () => null);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  function choose(value: Exclude<Consent, null>) {
    localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }

  return (
    <>
      {consent === "accepted" && gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}
      {consent === "accepted" && pixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
      {consent === null ? (
        <section className="consent-banner" aria-label={dict.consent.label}>
          <div>
            <strong>{dict.consent.title}</strong>
            <p>{dict.consent.copy}</p>
          </div>
          <div className="consent-actions">
            <button type="button" onClick={() => choose("declined")}>{dict.consent.decline}</button>
            <button type="button" className="button-dark" onClick={() => choose("accepted")}>{dict.consent.accept}</button>
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
  if (typeof window === "undefined" || localStorage.getItem(CONSENT_KEY) !== "accepted") return;
  const analyticsWindow = window as typeof window & {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  };
  analyticsWindow.gtag?.("event", event, payload);
  analyticsWindow.fbq?.("track", event, payload);
}
