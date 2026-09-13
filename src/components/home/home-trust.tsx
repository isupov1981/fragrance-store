"use client";

import { useI18n } from "@/components/i18n/i18n-provider";

export function HomeTrust() {
  const { dict } = useI18n();
  const items = [
    ["01", dict.home.trust1Title, dict.home.trust1Copy],
    ["02", dict.home.trust2Title, dict.home.trust2Copy],
    ["03", dict.home.trust3Title, dict.home.trust3Copy],
  ];

  return (
    <section className="border-y border-ink/10 bg-stone/55">
      <div className="shell grid gap-px py-14 sm:grid-cols-3 sm:py-20">
        {items.map(([number, title, copy]) => (
          <article className="border-ink/10 py-7 sm:border-s sm:px-8 sm:first:border-s-0 sm:first:ps-0" key={number}>
            <span className="font-display text-lg text-bronze">{number}</span>
            <h2 className="mt-4 font-display text-2xl">{title}</h2>
            <p className="mt-3 text-xs leading-6 text-ink/60">{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
