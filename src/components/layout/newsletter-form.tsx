"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";

export function NewsletterForm() {
  const { dict } = useI18n();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "");
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSubmitting(false);
    if (response.ok) {
      form.reset();
      setSent(true);
    }
  }

  if (sent) {
    return <p role="status" className="mt-8 max-w-md text-sm text-ivory/70">{dict.footer.subscribed}</p>;
  }

  return (
    <form className="mt-8 flex max-w-md border-b border-ivory/35" onSubmit={submit}>
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
    </form>
  );
}
