import { WebMcpTools } from "@/components/agent/webmcp-tools";
import { CinematicBand } from "@/components/home/cinematic-band";
import { EditorialTrio } from "@/components/home/editorial-trio";
import { FeaturedStory } from "@/components/home/featured-story";
import { HomeFaq } from "@/components/home/home-faq";
import { HomeHero } from "@/components/home/home-hero";
import { HomeTrust } from "@/components/home/home-trust";
import { ProductCarousel } from "@/components/home/product-carousel";
import { Reveal } from "@/components/home/reveal";
import { CustomerReviews } from "@/components/reviews/customer-reviews";
import { JsonLd } from "@/components/seo/json-ld";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveScent } from "@/lib/catalog/scent";
import { publishedReviews } from "@/lib/content/reviews";
import { listStoreProducts } from "@/lib/db/products";
import { isNewProduct } from "@/lib/catalog/new-arrival";
import type { StoreProduct } from "@/lib/catalog";
import { convertCatalogCents, formatMoney, defaultCurrency, isCurrency } from "@/lib/currency";
import { getDictionary, hasLocale } from "@/lib/i18n/get-dictionary";
import { interpolate } from "@/lib/i18n/interpolate";
import { localizedPath } from "@/lib/i18n/path";
import { homeJsonLdGraph } from "@/lib/seo/home-json-ld";
import { siteBaseUrl } from "@/lib/seo/site";

const HOME_CAROUSEL_LIMIT = 12;

function toCardProduct(product: StoreProduct): StoreProduct {
  return {
    ...product,
    description: "",
    descriptionHe: undefined,
    notes: undefined,
    images: product.images.slice(0, 2),
  };
}

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: { absolute: dict.meta.title },
    description: dict.meta.description,
    alternates: {
      canonical: localizedPath(lang, "/"),
      languages: {
        en: localizedPath("en", "/"),
        he: localizedPath("he", "/"),
        ru: localizedPath("ru", "/"),
        "x-default": localizedPath("en", "/"),
      },
    },
  };
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const catalog = await listStoreProducts();
  const arrivals = catalog.filter((product) => isNewProduct(product)).slice(0, HOME_CAROUSEL_LIMIT).map(toCardProduct);
  const featuredSorted = [...catalog].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  const cabinet = featuredSorted.slice(0, HOME_CAROUSEL_LIMIT).map(toCardProduct);
  const featured = featuredSorted[0];
  const trio = catalog.slice(0, 3).map((product) => ({
    slug: product.slug,
    name: product.name,
    images: product.images.slice(0, 1),
    notes: resolveScent(product).notes.slice(0, 3),
  }));
  const pricedProducts = (cabinet.length ? cabinet : arrivals).slice(0, 8);
  const currency = isCurrency(process.env.NEXT_PUBLIC_STORE_CURRENCY)
    ? process.env.NEXT_PUBLIC_STORE_CURRENCY
    : defaultCurrency;
  const baseUrl = siteBaseUrl();
  const webmcpProducts = pricedProducts.map((product) => {
    const variant = product.variants[0];
    return {
      name: product.name,
      brand: product.brand,
      slug: product.slug,
      priceLabel: variant ? formatMoney(variant.price, currency) : "",
      url: `${baseUrl}${localizedPath(lang, `/products/${product.slug}`)}`,
    };
  });

  return (
    <main id="main-content">
      <JsonLd data={homeJsonLdGraph(lang, pricedProducts)} />
      <WebMcpTools locale={lang} products={webmcpProducts} />
      <HomeHero />

      <section className="shell border-b border-ink/10 py-8" aria-label={dict.pricing.title}>
        <h2 className="font-display text-2xl">{dict.pricing.heading}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/65">{dict.pricing.intro}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pricedProducts.map((product) => {
            const variant = product.variants[0];
            const href = localizedPath(lang, `/products/${product.slug}`);
            const metaPrice = variant
              ? (convertCatalogCents(variant.price, currency) / 100).toFixed(currency === "ILS" ? 2 : 0)
              : "";
            return (
              <li key={product.id} className="text-sm" itemScope itemType="https://schema.org/Product">
                <meta itemProp="brand" content={product.brand} />
                <a className="font-medium underline-offset-2 hover:underline" href={href} itemProp="url">
                  <span itemProp="name">
                    {product.brand} — {product.name}
                  </span>
                </a>
                {variant ? (
                  <p
                    className="mt-1 text-ink/70"
                    itemProp="offers"
                    itemScope
                    itemType="https://schema.org/Offer"
                  >
                    <meta itemProp="priceCurrency" content={currency} />
                    <meta itemProp="price" content={metaPrice} />
                    <link itemProp="url" href={`${baseUrl}${href}`} />
                    <link
                      itemProp="availability"
                      href={
                        variant.stock > 0
                          ? "https://schema.org/InStock"
                          : "https://schema.org/OutOfStock"
                      }
                    />
                    {interpolate(dict.product.from, { price: formatMoney(variant.price, currency) })}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
        <p className="mt-6 flex flex-wrap gap-4 text-sm">
          <a className="underline-offset-2 hover:underline" href={localizedPath(lang, "/pricing")}>
            {dict.pricing.homeLink}
          </a>
          <a className="underline-offset-2 hover:underline" href={localizedPath(lang, "/collections/all")}>
            {dict.home.viewCollection}
          </a>
        </p>
      </section>

      <Reveal>
        <ProductCarousel
          eyebrow={dict.home.newEyebrow}
          title={dict.home.newTitle}
          description={dict.home.newCopy}
          href="/collections/all?edit=new"
          linkLabel={dict.home.newLink}
          products={cabinet}
        />
      </Reveal>

      <Reveal>
        <EditorialTrio products={trio} />
      </Reveal>

      <Reveal>
        <ProductCarousel
          eyebrow={dict.home.curatorEyebrow}
          title={dict.home.curatorTitle}
          description={dict.home.curatorCopy}
          href="/collections/all?edit=featured"
          linkLabel={dict.home.curatorLink}
          products={arrivals}
        />
      </Reveal>

      <Reveal>
        <FeaturedStory
          product={
            featured
              ? {
                  slug: featured.slug,
                  name: featured.name,
                  brand: featured.brand,
                  description: featured.description,
                  images: featured.images.slice(0, 4),
                }
              : undefined
          }
        />
      </Reveal>

      <CinematicBand />
      <CustomerReviews
        reviews={publishedReviews()}
        locale={lang}
        eyebrow={dict.reviews.eyebrow}
        title={dict.reviews.title}
        countLabel={dict.reviews.count}
        ratingLabel={dict.reviews.rating}
      />
      <HomeFaq />
      <HomeTrust />
    </main>
  );
}
