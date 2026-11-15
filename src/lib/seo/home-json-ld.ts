import type { StoreProduct } from "@/lib/catalog";
import { convertCatalogCents, defaultCurrency, isCurrency, type Currency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import {
  organizationDescription,
  SITE_EMAIL,
  SITE_LEGAL_NAME,
  SITE_NAME,
  SITE_PHONE_E164,
  siteBaseUrl,
  siteSameAs,
} from "@/lib/seo/site";

function storeCurrency(): Currency {
  const configured = process.env.NEXT_PUBLIC_STORE_CURRENCY;
  return isCurrency(configured) ? configured : defaultCurrency;
}

function offerPrice(centsIls: number, currency: Currency) {
  return (convertCatalogCents(centsIls, currency) / 100).toFixed(currency === "ILS" ? 2 : 0);
}

export function organizationJsonLd() {
  const baseUrl = siteBaseUrl();
  const sameAs = siteSameAs();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: SITE_NAME,
    legalName: SITE_LEGAL_NAME,
    url: baseUrl,
    email: SITE_EMAIL,
    telephone: SITE_PHONE_E164,
    description: organizationDescription(),
    logo: `${baseUrl}/favicon.ico`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: SITE_EMAIL,
        telephone: SITE_PHONE_E164,
        availableLanguage: ["en", "he", "ru"],
      },
    ],
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd(locale: Locale) {
  const baseUrl = siteBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: SITE_NAME,
    url: baseUrl,
    inLanguage: locale,
    publisher: { "@id": `${baseUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}${localizedPath(locale, "/collections/all")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function homeItemListJsonLd(locale: Locale, products: StoreProduct[]) {
  const baseUrl = siteBaseUrl();
  const currency = storeCurrency();
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}${localizedPath(locale, "/")}#featured`,
    name: "Featured fragrances",
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => {
      const variant = product.variants[0];
      return {
        "@type": "ListItem",
        position: index + 1,
        url: `${baseUrl}${localizedPath(locale, `/products/${product.slug}`)}`,
        item: {
          "@type": "Product",
          name: product.name,
          brand: { "@type": "Brand", name: product.brand },
          url: `${baseUrl}${localizedPath(locale, `/products/${product.slug}`)}`,
          image: product.images.slice(0, 1),
          ...(variant
            ? {
                offers: {
                  "@type": "Offer",
                  priceCurrency: currency,
                  price: offerPrice(variant.price, currency),
                  url: `${baseUrl}${localizedPath(locale, `/products/${product.slug}`)}`,
                  availability:
                    variant.stock > 0
                      ? "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock",
                },
              }
            : {}),
        },
      };
    }),
  };
}

export function homeJsonLdGraph(locale: Locale, products: StoreProduct[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationJsonLd(), websiteJsonLd(locale), homeItemListJsonLd(locale, products)],
  };
}
