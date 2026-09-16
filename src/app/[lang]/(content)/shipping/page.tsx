import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { WorldwideDeliveries } from "@/components/content/worldwide-deliveries";
import { ContentPage, ProseSection } from "@/components/ui/content-page";
import { convertCatalogCents, CURRENCY_COOKIE, defaultCurrency, formatMoney, FREE_SHIPPING_ILS_CENTS, isCurrency } from "@/lib/currency";
import { localeMeta } from "@/lib/i18n/config";
import { getDictionary, hasLocale } from "@/lib/i18n/get-dictionary";
import { interpolate } from "@/lib/i18n/interpolate";
import {
  INTL_FREE_SHIPPING_ILS_CENTS,
  INTL_ZONE1_SHIPPING_ILS_CENTS,
  INTL_ZONE2_SHIPPING_ILS_CENTS,
  SHIPPING_CANCELLATION_FEE_CAP_ILS_CENTS,
} from "@/lib/shipping/international";

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
  const intl = localeMeta[lang].intl;
  const format = (amount: number) => formatMoney(convertCatalogCents(amount, currency), currency, intl);
  const amount = format(FREE_SHIPPING_ILS_CENTS);
  return (
    <ContentPage eyebrow={dict.shipping.eyebrow} title={dict.shipping.heading} intro={dict.shipping.intro}>
      <div className="mx-auto max-w-5xl">
        <ProseSection title={dict.shipping.us}><p>{interpolate(dict.shipping.usCopy, { amount })}</p></ProseSection>
        <WorldwideDeliveries
          dict={dict.shipping}
          locale={lang}
          zone1Price={format(INTL_ZONE1_SHIPPING_ILS_CENTS)}
          zone2Price={format(INTL_ZONE2_SHIPPING_ILS_CENTS)}
          freeThreshold={format(INTL_FREE_SHIPPING_ILS_CENTS)}
          cancelCap={format(SHIPPING_CANCELLATION_FEE_CAP_ILS_CENTS)}
        />
        <ProseSection title={dict.shipping.transit}><p>{dict.shipping.transitCopy}</p></ProseSection>
        <ProseSection title={dict.shipping.tracking}><p>{dict.shipping.trackingCopy}</p></ProseSection>
      </div>
    </ContentPage>
  );
}
