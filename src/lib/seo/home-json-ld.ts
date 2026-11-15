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
  siteAddress,
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
  const address = siteAddress();
  return {
    "@type": ["Organization", "OnlineStore"],
    "@id": `${baseUrl}/#organization`,
    name: SITE_NAME,
    legalName: SITE_LEGAL_NAME,
    url: baseUrl,
    email: SITE_EMAIL,
    telephone: SITE_PHONE_E164,
    description: organizationDescription(),
    logo: `${baseUrl}/favicon.ico`,
    address: {
      "@type": "PostalAddress",
      streetAddress: address.streetAddress,
      addressLocality: address.addressLocality,
      postalCode: address.postalCode,
      addressCountry: address.addressCountry,
    },
    areaServed: ["IL", "Worldwide"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: SITE_EMAIL,
        telephone: SITE_PHONE_E164,
        areaServed: "IL",
        availableLanguage: ["en", "he", "ru"],
      },
    ],
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd(locale: Locale) {
  const baseUrl = siteBaseUrl();
  return {
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

export function productOfferJsonLd(locale: Locale, product: StoreProduct) {
  const baseUrl = siteBaseUrl();
  const currency = storeCurrency();
  const variant = product.variants[0];
  const url = `${baseUrl}${localizedPath(locale, `/products/${product.slug}`)}`;
  return {
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.description || `${product.brand} — ${product.name}`,
    brand: { "@type": "Brand", name: product.brand },
    sku: variant?.sku,
    url,
    image: product.images.slice(0, 3),
    ...(variant
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: currency,
            price: offerPrice(variant.price, currency),
            availability:
              variant.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            seller: { "@id": `${baseUrl}/#organization` },
          },
        }
      : {}),
  };
}

export function homeItemListJsonLd(locale: Locale, products: StoreProduct[]) {
  const baseUrl = siteBaseUrl();
  return {
    "@type": "ItemList",
    "@id": `${baseUrl}${localizedPath(locale, "/")}#featured`,
    name: "Featured fragrances",
    numberOfItems: products.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${baseUrl}${localizedPath(locale, `/products/${product.slug}`)}`,
      item: { "@id": `${baseUrl}${localizedPath(locale, `/products/${product.slug}`)}#product` },
    })),
  };
}

export function homeJsonLdGraph(locale: Locale, products: StoreProduct[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(),
      websiteJsonLd(locale),
      ...products.map((product) => productOfferJsonLd(locale, product)),
      homeItemListJsonLd(locale, products),
    ],
  };
}
