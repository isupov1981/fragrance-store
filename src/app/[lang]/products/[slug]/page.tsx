import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ProductPurchase } from "@/components/product/product-purchase";
import { SectionHeading } from "@/components/ui/section-heading";
import { LocaleLink } from "@/components/i18n/locale-link";
import { getStoreProduct, listStoreProducts } from "@/lib/db/products";
import { convertCatalogCents, defaultCurrency, formatMoney, FREE_SHIPPING_ILS_CENTS, isCurrency, CURRENCY_COOKIE } from "@/lib/currency";
import { cookies } from "next/headers";
import { localeMeta } from "@/lib/i18n/config";
import { localizedDescription } from "@/lib/catalog";
import { isUnoptimizedCatalogImage } from "@/lib/catalog/image";
import { getDictionary, hasLocale } from "@/lib/i18n/get-dictionary";
import { interpolate } from "@/lib/i18n/interpolate";
import { localizedPath } from "@/lib/i18n/path";
import { productJsonLd, breadcrumbJsonLd } from "@/lib/seo/product-json-ld";

export const revalidate = 60;

const notes: Record<string, Array<keyof ReturnType<typeof getDictionary>["notes"]>> = {
  amber: ["Labdanum", "Vanilla absolute", "Dry cedar"],
  woody: ["Fig leaf", "Sandalwood", "Mineral musk"],
  floral: ["Iris", "Rose petal", "Ambrette"],
  citrus: ["Bergamot", "Neroli", "Vetiver"],
};

const notesBySlug: Record<string, Array<keyof ReturnType<typeof getDictionary>["notes"]>> = {
  "notre-dame": ["Incense", "Galbanum", "Amber"],
};

export async function generateStaticParams() {
  const catalog = await listStoreProducts();
  return catalog.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/products/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return { title: "Not found" };
  const dict = getDictionary(lang);
  const product = await getStoreProduct(slug);
  if (!product) return { title: dict.product.notFound };
  const description = dict.catalog[product.slug as keyof typeof dict.catalog] ?? localizedDescription(product, lang);
  const path = localizedPath(lang, `/products/${product.slug}`);
  return {
    title: product.name,
    description,
    alternates: {
      canonical: path,
      languages: { en: localizedPath("en", `/products/${product.slug}`), he: localizedPath("he", `/products/${product.slug}`) },
    },
    openGraph: {
      type: "website",
      title: `${product.name} — ${product.brand}`,
      description,
      url: path,
      images: [{ url: product.images[0], alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/products/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const product = await getStoreProduct(slug);
  if (!product) notFound();

  const currencyValue = (await cookies()).get(CURRENCY_COOKIE)?.value;
  const currency = isCurrency(currencyValue) ? currencyValue : defaultCurrency;
  const catalog = await listStoreProducts();
  const related = catalog.filter((item) => item.id !== product.id && (item.category === product.category || item.featured)).slice(0, 3);
  const startingPrice = product.variants[0]?.price ?? Math.min(...product.variants.map((variant) => variant.price));
  const category = dict.categories[product.category as keyof typeof dict.categories];
  const description = dict.catalog[product.slug as keyof typeof dict.catalog] ?? localizedDescription(product, lang);
  const priced = formatMoney(convertCatalogCents(startingPrice, currency), currency, localeMeta[lang].intl);
  const freeShip = formatMoney(convertCatalogCents(FREE_SHIPPING_ILS_CENTS, currency), currency, localeMeta[lang].intl);

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(product, currency, lang)).replaceAll("<", "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(lang, [
              { name: dict.product.home, path: "/" },
              { name: category?.name ?? product.category, path: `/collections/${product.category}` },
              { name: product.name },
            ]),
          ).replaceAll("<", "\\u003c"),
        }}
      />
      <div className="shell py-5">
        <nav className="text-[10px] uppercase tracking-[0.14em] text-ink/50" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><LocaleLink href="/">{dict.product.home}</LocaleLink></li><li aria-hidden="true">/</li>
            <li><LocaleLink href={`/collections/${product.category}`}>{category?.name ?? product.category}</LocaleLink></li><li aria-hidden="true">/</li>
            <li className="text-ink" aria-current="page">{product.name}</li>
          </ol>
        </nav>
      </div>

      <div className="shell grid gap-10 pb-20 lg:grid-cols-[1.4fr_.8fr] lg:gap-16 lg:pb-28">
        <div className="grid gap-3 sm:grid-cols-2">
          {product.images.map((image, index) => (
            <div className={`relative aspect-[4/5] overflow-hidden bg-stone ${product.images.length === 1 ? "sm:col-span-2" : ""}`} key={image}>
              <Image
                className="object-cover transition duration-700 hover:scale-[1.015]"
                src={image}
                alt={`${product.name}, ${index + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 36vw"
                priority={index === 0}
                unoptimized={isUnoptimizedCatalogImage(image)}
              />
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-36 lg:self-start">
          <p className="eyebrow text-bronze">{product.brand}</p>
          <h1 className="mt-4 font-display text-5xl leading-none sm:text-6xl">{product.name}</h1>
          <p className="mt-4 text-sm" suppressHydrationWarning>{interpolate(dict.product.from, { price: priced })}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-ink/45">{dict.product.vatInclusive}</p>
          {currency !== "ILS" ? <p className="mt-2 max-w-md text-xs leading-5 text-ink/55">{dict.product.vatFx}</p> : null}
          <p className="mt-2 max-w-md text-xs leading-5 text-ink/55">{dict.product.vatAbroad}</p>
          <p className="mt-7 text-sm leading-7 text-ink/70">{description}</p>
          <section className="mt-8" aria-labelledby="product-labeling">
            <h2 id="product-labeling" className="eyebrow">{dict.product.labeling}</h2>
            <dl className="mt-4 space-y-3 text-xs leading-5 text-ink/70">
              <div>
                <dt className="font-semibold text-ink">{dict.product.manufacturer}</dt>
                <dd>{product.manufacturer?.trim() || dict.product.onPack}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">{dict.product.origin}</dt>
                <dd>{product.originCountry?.trim() || dict.product.onPack}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">{dict.product.ingredients}</dt>
                <dd>{product.inci?.trim() || dict.product.ingredientsOnPack}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">{dict.product.supply}</dt>
                <dd>
                  {product.supplyChannel === "official"
                    ? dict.product.supplyOfficial
                    : product.supplyChannel === "parallel"
                      ? dict.product.supplyParallel
                      : dict.product.supplyUnknown}
                </dd>
              </div>
            </dl>
            <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.13em]">{dict.product.warnings}</h3>
            <ul className="mt-2 list-disc space-y-1 ps-4 text-xs leading-5 text-ink/70">
              <li>{dict.product.warningAlcohol}</li>
              <li>{dict.product.warningChildren}</li>
              <li>{dict.product.warningExternal}</li>
            </ul>
          </section>

          <div className="mt-8 border-y border-ink/10 py-6">
            <p className="eyebrow mb-4">{dict.product.composition}</p>
            <div className="grid grid-cols-3 gap-4">
              {(product.notes?.length
                ? product.notes
                : (notesBySlug[product.slug] ?? notes[product.category] ?? [])
              ).map((note, index) => (
                <div key={note}>
                  <span className="font-display text-lg text-bronze">0{index + 1}</span>
                  <p className="mt-1 text-xs">{dict.notes[note as keyof typeof dict.notes] ?? note}</p>
                </div>
              ))}
            </div>
          </div>

          <ProductPurchase product={product} />

          <div className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
            {[
              [dict.product.wear, product.concentration === "extrait" ? dict.product.wearCopyExtrait : dict.product.wearCopy],
              [dict.product.delivery, interpolate(dict.product.deliveryCopy, { amount: freeShip })],
              [dict.product.returns, dict.product.returnsCopy],
            ].map(([title, copy]) => (
              <details className="group py-4" key={title}>
                <summary className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.13em]">
                  {title}<span className="text-lg font-light group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="pt-3 text-xs leading-6 text-ink/60">{copy}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      <section className="border-t border-ink/10 bg-stone/35 py-20 sm:py-28">
        <div className="shell">
          <SectionHeading eyebrow={dict.product.continue} title={dict.product.also} href={`/collections/${product.category}`} linkLabel={interpolate(dict.product.viewFamily, { name: category?.name ?? product.category })} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
