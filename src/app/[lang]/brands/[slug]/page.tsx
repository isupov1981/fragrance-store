import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/product-grid";
import { LocaleLink } from "@/components/i18n/locale-link";
import { getStoreBrand, listStoreBrands } from "@/lib/catalog/brands";
import { listStoreProducts } from "@/lib/db/products";
import { getDictionary, hasLocale } from "@/lib/i18n/get-dictionary";
import { interpolate } from "@/lib/i18n/interpolate";
import { localizedPath } from "@/lib/i18n/path";

export const revalidate = 60;

type BrandPageParams = { lang: string; slug: string };

export async function generateStaticParams() {
  const brands = await listStoreBrands();
  return brands.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<BrandPageParams>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const brand = await getStoreBrand(slug);
  if (!brand) return {};
  const dict = getDictionary(lang);
  return {
    title: brand.name,
    description: interpolate(dict.brands.brandDescription, { brand: brand.name }),
    alternates: { canonical: localizedPath(lang, `/brands/${slug}`) },
  };
}

export default async function BrandPage({ params }: { params: Promise<BrandPageParams> }) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const brand = await getStoreBrand(slug);
  if (!brand) notFound();

  const catalog = await listStoreProducts();
  const products = catalog.filter((product) => product.brand.trim().toLowerCase() === brand.name.toLowerCase());

  return (
    <main id="main-content">
      <header className="border-b border-ink/10 bg-stone/40">
        <div className="shell py-14 text-center sm:py-20">
          <p className="eyebrow text-bronze">{dict.nav.brands}</p>
          <h1 className="mt-4 font-display text-5xl sm:text-7xl">{brand.name}</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-ink/65">
            {interpolate(dict.brands.brandDescription, { brand: brand.name })}
          </p>
          <LocaleLink className="mt-6 inline-block text-sm underline underline-offset-4" href="/brands">
            {dict.brands.viewAll}
          </LocaleLink>
        </div>
      </header>
      <div className="shell py-12 sm:py-16">
        {products.length ? (
          <ProductGrid products={products} />
        ) : (
          <p className="text-center text-sm text-ink/60">{dict.brands.emptyBrand}</p>
        )}
      </div>
    </main>
  );
}
