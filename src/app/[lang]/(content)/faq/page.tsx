import type { Metadata } from "next";
import { LocaleLink } from "@/components/i18n/locale-link";
import { ContentPage } from "@/components/ui/content-page";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/faq">): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDictionary(lang).faq.title };
}

export default async function FaqPage({ params }: PageProps<"/[lang]/faq">) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return (
    <ContentPage eyebrow={dict.faq.eyebrow} title={dict.faq.heading} intro={dict.faq.intro}>
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        {dict.faq.sections.map((section) => (
          <section key={section.title} className="rounded-2xl border border-ink/12 p-5 sm:p-6">
            <h2 className="text-sm font-medium text-ink/55">{section.title}</h2>
            <ul className="mt-4 space-y-3">
              {section.items.map((item) => (
                <li key={item.question} className="rounded-xl border border-ink/10 bg-ivory px-4 py-4 sm:px-5">
                  <h3 className="text-sm font-semibold leading-6 text-ink">
                    <span className="me-2 text-ink/35" aria-hidden="true">
                      –
                    </span>
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-ink/65">{item.answer}</p>
                  {item.note ? (
                    <p className="mt-3 rounded-lg border border-dashed border-ink/20 bg-stone/40 px-3 py-2 text-sm leading-6 text-ink/70">
                      {item.note}
                    </p>
                  ) : null}
                  {item.bullets?.length ? (
                    <ul className="mt-3 list-disc space-y-1 ps-5 text-sm leading-6 text-ink/65">
                      {item.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                  {item.footer ? <p className="mt-3 text-sm leading-6 text-ink/65">{item.footer}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="flex flex-col items-stretch gap-3 sm:items-center">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <LocaleLink
              className="inline-flex h-12 items-center justify-center border border-ink px-6 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:bg-ink hover:text-ivory"
              href="/terms"
            >
              {dict.faq.actions.terms}
            </LocaleLink>
            <LocaleLink
              className="inline-flex h-12 items-center justify-center border border-ink px-6 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:bg-ink hover:text-ivory"
              href="/refund"
            >
              {dict.faq.actions.returns}
            </LocaleLink>
          </div>
          <LocaleLink
            className="inline-flex h-12 items-center justify-center bg-ink px-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory transition hover:bg-bronze"
            href="/contact"
          >
            {dict.faq.actions.contact}
          </LocaleLink>
        </div>
      </div>
    </ContentPage>
  );
}
