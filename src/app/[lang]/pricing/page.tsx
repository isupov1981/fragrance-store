import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { ContentPage } from "@/components/ui/content-page";
import { isNewProduct } from "@/lib/catalog/new-arrival";
import { convertCatalogCents, formatMoney, defaultCurrency, isCurrency } from "@/lib/currency";
import { listStoreProducts } from "@/lib/db/products";
import { getDictionary, hasLocale } from "@/lib/i18n/get-dictionary";
import { interpolate } from "@/lib/i18n/interpolate";
import { localizedPath } from "@/lib/i18n/path";
import { homeJsonLdGraph } from "@/lib/seo/home-json-ld";
import { siteBaseUrl } from "@/lib/seo/site";

type PricingPageParams = { lang: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PricingPageParams>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.pricing.title,
    description: dict.pricing.intro,
    alternates: {
      canonical: localizedPath(lang, "/pricing"),
    },
  };
}

export default async function PricingPage({ params }: { params: Promise<PricingPageParams> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const catalog = await listStoreProducts();
  const currency = isCurrency(process.env.NEXT_PUBLIC_STORE_CURRENCY)
    ? process.env.NEXT_PUBLIC_STORE_CURRENCY
    : defaultCurrency;
  const products = [...catalog]
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .slice(0, 48);
  const baseUrl = siteBaseUrl();

  return (
    <>
      <JsonLd data={homeJsonLdGraph(lang, products.slice(0, 24))} />
      <ContentPage eyebrow={dict.pricing.eyebrow} title={dict.pricing.heading} intro={dict.pricing.intro}>
        <p className="mb-8 text-sm text-ink/65">
          <a className="underline-offset-2 hover:underline" href={localizedPath(lang, "/collections/all")}>
            {dict.pricing.catalogueLink}
          </a>
        </p>
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {products.map((product) => {
            const variant = product.variants[0];
            const href = localizedPath(lang, `/products/${product.slug}`);
            return (
              <li
                key={product.id}
                className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                itemScope
                itemType="https://schema.org/Product"
              >
                <div>
                  <meta itemProp="brand" content={product.brand} />
                  {isNewProduct(product) ? (
                    <p className="text-[10px] uppercase tracking-[0.18em] text-ink/45">{dict.product.new}</p>
                  ) : null}
                  <a className="font-medium underline-offset-2 hover:underline" href={href} itemProp="url">
                    <span itemProp="name">
                      {product.brand} — {product.name}
                    </span>
                  </a>
                  <link itemProp="image" href={product.images[0] || `${baseUrl}/favicon.ico`} />
                </div>
                {variant ? (
                  <div
                    className="text-sm tabular-nums text-ink/80"
                    itemProp="offers"
                    itemScope
                    itemType="https://schema.org/Offer"
                  >
                    <meta itemProp="priceCurrency" content={currency} />
                    <meta
                      itemProp="price"
                      content={(convertCatalogCents(variant.price, currency) / 100).toFixed(
                        currency === "ILS" ? 2 : 0,
                      )}
                    />
                    <link
                      itemProp="availability"
                      href={
                        variant.stock > 0
                          ? "https://schema.org/InStock"
                          : "https://schema.org/OutOfStock"
                      }
                    />
                    <link itemProp="url" href={`${baseUrl}${href}`} />
                    <span>
                      {interpolate(dict.product.from, {
                        price: formatMoney(variant.price, currency),
                      })}
                    </span>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </ContentPage>
    </>
  );
}
