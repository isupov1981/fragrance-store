import type { Metadata } from "next";
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
      <div className="mx-auto max-w-3xl divide-y divide-ink/10 border-y border-ink/10">
        {dict.faq.items.map(([question, answer], index) => (
          <details className="group py-6" key={question} open={index === 0}>
            <summary className="flex items-start justify-between gap-6 font-display text-xl sm:text-2xl">
              {question}<span className="mt-1 shrink-0 font-sans text-xl font-light transition group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="max-w-2xl pt-4 text-sm leading-7 text-ink/65">{answer}</p>
          </details>
        ))}
      </div>
    </ContentPage>
  );
}
