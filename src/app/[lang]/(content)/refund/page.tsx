import type { Metadata } from "next";
import { ContentPage, ProseSection } from "@/components/ui/content-page";
import { LocaleLink } from "@/components/i18n/locale-link";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/refund">): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDictionary(lang).refund.title };
}

export default async function RefundPage({ params }: PageProps<"/[lang]/refund">) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return (
    <ContentPage eyebrow={dict.refund.eyebrow} title={dict.refund.heading} intro={dict.refund.intro}>
      <div className="mx-auto max-w-4xl">
        <ProseSection title={dict.refund.conditions}><p>{dict.refund.conditionsCopy}</p></ProseSection>
        <ProseSection title={dict.refund.begin}>
          <p>{dict.refund.beginCopy}</p>
          <LocaleLink className="text-link mt-2" href="/contact">{dict.refund.contact}</LocaleLink>
        </ProseSection>
        <ProseSection title={dict.refund.refunds}><p>{dict.refund.refundsCopy}</p></ProseSection>
        <ProseSection title={dict.refund.damaged}><p>{dict.refund.damagedCopy}</p></ProseSection>
      </div>
    </ContentPage>
  );
}
