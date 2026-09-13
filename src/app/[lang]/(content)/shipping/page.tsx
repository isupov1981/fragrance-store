import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ContentPage, ProseSection } from "@/components/ui/content-page";
import { convertUsdCents, CURRENCY_COOKIE, defaultCurrency, formatMoney, FREE_SHIPPING_USD_CENTS, isCurrency } from "@/lib/currency";
import { localeMeta } from "@/lib/i18n/config";
import { getDictionary, hasLocale } from "@/lib/i18n/get-dictionary";
import { interpolate } from "@/lib/i18n/interpolate";

export async function generateMetadata({ params }: PageProps<"/[lang]/shipping">): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDictionary(lang).shipping.title };
}

export default async function ShippingPage({ params }: PageProps<"/[lang]/shipping">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const currencyValue = (await cookies()).get(CURRENCY_COOKIE)?.value;
  const currency = isCurrency(currencyValue) ? currencyValue : defaultCurrency;
  const amount = formatMoney(convertUsdCents(FREE_SHIPPING_USD_CENTS, currency), currency, localeMeta[lang].intl);
  return (
    <ContentPage eyebrow={dict.shipping.eyebrow} title={dict.shipping.heading} intro={dict.shipping.intro}>
      <div className="mx-auto max-w-4xl">
        <ProseSection title={dict.shipping.us}><p>{interpolate(dict.shipping.usCopy, { amount })}</p></ProseSection>
        <ProseSection title={dict.shipping.intl}><p>{dict.shipping.intlCopy}</p></ProseSection>
        <ProseSection title={dict.shipping.transit}><p>{dict.shipping.transitCopy}</p></ProseSection>
        <ProseSection title={dict.shipping.tracking}><p>{dict.shipping.trackingCopy}</p></ProseSection>
      </div>
    </ContentPage>
  );
}
