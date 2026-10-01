import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShippingRates } from "@/components/content/shipping-rates";
import { ContentPage } from "@/components/ui/content-page";
import { getDictionary, hasLocale } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/shipping">): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDictionary(lang).shipping.title };
}

export default async function ShippingPage({ params }: PageProps<"/[lang]/shipping">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  return (
    <ContentPage eyebrow={dict.shipping.eyebrow} title={dict.shipping.heading} intro={dict.shipping.intro}>
      <div className="mx-auto max-w-5xl">
        <ShippingRates dict={dict.shipping} locale={lang} />
      </div>
    </ContentPage>
  );
}
