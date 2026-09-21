import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ConsentManager } from "@/components/analytics/consent-manager";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { StoreProviders } from "@/components/i18n/store-providers";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { AccessibilityWidget } from "@/components/layout/accessibility-widget";
import { listStoreBrands } from "@/lib/catalog/brands";
import { getOrdersEnabled } from "@/lib/commerce";
import { defaultCurrency, isCurrency, CURRENCY_COOKIE } from "@/lib/currency";
import { locales } from "@/lib/i18n/config";
import { getClientDictionary, getDictionary, hasLocale } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: {
      default: dict.meta.title,
      template: "%s — The Perfume Room",
    },
    description: dict.meta.description,
    alternates: {
      languages: {
        en: localizedPath("en", "/"),
        he: localizedPath("he", "/"),
        ru: localizedPath("ru", "/"),
        "x-default": localizedPath("en", "/"),
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const clientDict = getClientDictionary(lang);
  const currencyValue = (await cookies()).get(CURRENCY_COOKIE)?.value;
  const currency = isCurrency(currencyValue) ? currencyValue : defaultCurrency;
  const [ordersEnabled, brands] = await Promise.all([getOrdersEnabled(), listStoreBrands()]);

  return (
    <StoreProviders locale={lang} dict={clientDict} currency={currency} ordersEnabled={ordersEnabled}>
      <Header brands={brands} />
      {children}
      <Footer locale={lang} />
      {ordersEnabled ? <CartDrawer /> : null}
      <WhatsAppButton label={dict.whatsapp.label} message={dict.whatsapp.message} />
      <AccessibilityWidget />
      <ConsentManager />
    </StoreProviders>
  );
}
