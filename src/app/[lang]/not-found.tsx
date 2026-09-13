"use client";

import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";

export default function NotFound() {
  const { dict } = useI18n();
  return (
    <main id="main-content" className="shell grid min-h-[65vh] place-items-center py-20 text-center">
      <div>
        <p className="font-display text-8xl leading-none text-sand sm:text-9xl">404</p>
        <p className="eyebrow mt-7 text-bronze">{dict.notFound.eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">{dict.notFound.title}</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-ink/60">{dict.notFound.copy}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LocaleLink className="button-primary h-13" href="/">{dict.notFound.home}</LocaleLink>
          <LocaleLink className="button-secondary h-13" href="/collections/all">{dict.notFound.explore}</LocaleLink>
        </div>
      </div>
    </main>
  );
}
