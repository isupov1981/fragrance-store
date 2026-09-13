import type { StoreProduct } from "@/lib/catalog";
import { convertUsdCents, type Currency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";

export function productJsonLd(
  product: StoreProduct,
  currency: Currency = "USD",
  locale: Locale = "en",
) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const variant = product.variants[0];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    sku: variant.sku,
    offers: {
      "@type": "Offer",
      url: `${baseUrl}${localizedPath(locale, `/products/${product.slug}`)}`,
      priceCurrency: currency,
      price: (convertUsdCents(variant.price, currency) / 100).toFixed(2),
      availability:
        variant.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };
}

export function breadcrumbJsonLd(
  locale: Locale,
  items: Array<{ name: string; path?: string }>,
) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: `${baseUrl}${localizedPath(locale, item.path)}` } : {}),
    })),
  };
}
