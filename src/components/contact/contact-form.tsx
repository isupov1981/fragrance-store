"use client";

import { FormEvent, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";

export function ContactForm() {
  const { dict } = useI18n();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSubmitting(true);
    const form = event.currentTarget;
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    setSubmitting(false);
    if (!response.ok) {
      setError(dict.checkout.error);
      return;
    }
    form.reset();
    setSent(true);
  }

  if (sent) {
    return <p role="status" className="max-w-xl text-sm leading-7 text-ink/70">{dict.contact.sent}</p>;
  }

  return (
    <form className="grid gap-6 sm:grid-cols-2" onSubmit={submit}>
      <Field label={dict.contact.name} name="name" autoComplete="name" />
      <Field label={dict.contact.email} name="email" type="email" autoComplete="email" />
      <div className="sm:col-span-2">
        <label className="eyebrow" htmlFor="subject">{dict.contact.subject}</label>
        <select className="mt-2 w-full border-b border-ink/25 bg-transparent py-3 text-sm outline-none" id="subject" name="subject">
          <option>{dict.contact.s1}</option>
          <option>{dict.contact.s2}</option>
          <option>{dict.contact.s3}</option>
          <option>{dict.contact.s4}</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="eyebrow" htmlFor="message">{dict.contact.message}</label>
        <textarea className="mt-2 min-h-36 w-full resize-y border-b border-ink/25 bg-transparent py-3 text-sm outline-none" id="message" name="message" required />
      </div>
      <button className="button-primary h-13 sm:col-span-2 sm:w-max" type="submit" disabled={submitting}>
        {dict.contact.send}
      </button>
      {error ? <p role="alert" className="sm:col-span-2 text-sm">{error}</p> : null}
    </form>
  );
}

function Field({ label, name, type = "text", autoComplete }: { label: string; name: string; type?: string; autoComplete?: string }) {
  return (
    <div>
      <label className="eyebrow" htmlFor={name}>{label}</label>
      <input className="mt-2 w-full border-b border-ink/25 bg-transparent py-3 text-sm outline-none" id={name} name={name} type={type} autoComplete={autoComplete} required />
    </div>
  );
}
