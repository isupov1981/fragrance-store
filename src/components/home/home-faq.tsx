"use client";

import { LocaleLink } from "@/components/i18n/locale-link";
import { useCurrency } from "@/components/i18n/currency-provider";
import { useI18n } from "@/components/i18n/i18n-provider";
import { FREE_SHIPPING_ILS_CENTS } from "@/lib/currency";
import { interpolate } from "@/lib/i18n/interpolate";

export function HomeFaq() {
  const { dict } = useI18n();
  const { format } = useCurrency();
  const amount = format(FREE_SHIPPING_ILS_CENTS);

  return (
    <section className="shell py-16 sm:py-24" aria-labelledby="home-faq-title">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <p className="eyebrow">{dict.home.faqEyebrow}</p>
        <h2 id="home-faq-title" className="mt-3 font-display text-4xl sm:text-5xl">
          {dict.home.faqTitle}
        </h2>
      </header>
      <div className="mx-auto max-w-3xl divide-y divide-ink/10 border-y border-ink/10">
        {dict.home.faqItems.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              {item.question}
              <span className="text-lg font-light group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="pt-3 text-sm leading-7 text-ink/65">{interpolate(item.answer, { amount })}</p>
          </details>
        ))}
      </div>
      <p className="mt-8 text-center">
        <LocaleLink className="text-[11px] font-semibold uppercase tracking-[0.16em] underline underline-offset-4" href="/faq">
          {dict.home.faqMore}
        </LocaleLink>
      </p>
    </section>
  );
}
