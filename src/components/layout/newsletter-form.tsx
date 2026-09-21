"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";

export function NewsletterForm() {
  const { locale, dict } = useI18n();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<"consent" | "request" | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("marketingConsent") !== "on") {
      setError("consent");
      return;
    }
    setSubmitting(true);
    setError(null);
    const email = String(data.get("email") ?? "");
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, locale, marketingConsent: true }),
    });
    setSubmitting(false);
    if (response.ok) {
      form.reset();
      setSent(true);
      return;
    }
    setError("request");
  }

  if (sent) {
    return <p role="status" className="mt-8 max-w-md text-sm text-ivory/70">{dict.footer.subscribed}</p>;
  }

  return (
    <form className="mt-8 max-w-md" onSubmit={submit}>
      <div className="flex border-b border-ivory/35">
        <label className="sr-only" htmlFor="newsletter-email">{dict.footer.email}</label>
        <input
          className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-ivory/45"
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={dict.footer.emailPlaceholder}
        />
        <button className="grid size-11 place-items-center transition hover:text-bronze rtl:rotate-180" type="submit" disabled={submitting} aria-label={dict.footer.subscribe}>
          <ArrowRight aria-hidden="true" size={19} />
        </button>
      </div>
      <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-ivory/65">
        <input className="mt-0.5" type="checkbox" name="marketingConsent" required />
        <span>
          {dict.footer.marketingConsent}{" "}
          <LocaleLink className="underline decoration-ivory/35 underline-offset-2 text-inherit" href="/privacy">
            {dict.footer.privacy}
          </LocaleLink>
        </span>
      </label>
      {error ? (
        <p role="alert" className="mt-3 text-xs text-ivory/80">
          {error === "consent" ? dict.footer.consentRequired : dict.footer.subscribe}
        </p>
      ) : null}
    </form>
  );
}
