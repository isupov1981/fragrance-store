import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { categories, getCategory, products } from "@/lib/catalog";

export const revalidate = 3600;

export function generateStaticParams() {
  return categories.map(({ slug }) => ({ slug }));
}

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Pick<CollectionPageProps, "params">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  return {
    title: category?.name ?? "Collection",
    description: category?.description,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: {
      title: category?.name ?? "Collection",
      description: category?.description,
      url: `/collections/${slug}`,
    },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const category = getCategory(slug);
  if (!category) notFound();

  const search = typeof query.q === "string" ? query.q.trim().toLowerCase() : "";
  const edit = typeof query.edit === "string" ? query.edit : "";
  const visibleProducts = products.filter((product) => {
    const inCategory = slug === "all" || product.category === slug;
    const inEdit = edit === "new" ? product.newArrival : edit === "featured" ? product.featured : true;
    const inSearch = !search || `${product.name} ${product.brand} ${product.description}`.toLowerCase().includes(search);
    return inCategory && inEdit && inSearch;
  });
  const title = edit === "new" ? "New arrivals" : edit === "featured" ? "The curator's edit" : category.name;

  return (
    <main id="main-content">
      <header className="border-b border-ink/10 bg-stone/40">
        <div className="shell py-14 text-center sm:py-20">
          <p className="eyebrow text-bronze">Privé collection</p>
          <h1 className="mt-4 font-display text-5xl sm:text-7xl">{search ? `Search: “${search}”` : title}</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-ink/65">{category.description}</p>
        </div>
      </header>

      <div className="shell py-12 sm:py-16">
        <nav className="mb-10 overflow-x-auto border-b border-ink/10" aria-label="Fragrance families">
          <ul className="flex min-w-max gap-8">
            {categories.map((item) => (
              <li key={item.slug}>
                <Link
                  className={`block border-b py-4 text-[10px] font-semibold uppercase tracking-[0.17em] ${
                    slug === item.slug ? "border-ink" : "border-transparent text-ink/50 hover:text-ink"
                  }`}
                  href={`/collections/${item.slug}`}
                  aria-current={slug === item.slug ? "page" : undefined}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mb-8 flex flex-col gap-4 border-b border-ink/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink/60">{visibleProducts.length} {visibleProducts.length === 1 ? "fragrance" : "fragrances"}</p>
          <div className="flex items-center gap-5 text-[10px] font-semibold uppercase tracking-[0.15em]">
            <form className="flex items-center border-b border-ink/25" action={`/collections/${slug}`}>
              <label className="sr-only" htmlFor="collection-search">Search this collection</label>
              <input className="w-32 bg-transparent py-2 text-xs normal-case tracking-normal outline-none sm:w-44" id="collection-search" name="q" type="search" defaultValue={search} placeholder="Search" />
              <button className="p-2" type="submit" aria-label="Search collection"><Search aria-hidden="true" size={15} /></button>
            </form>
            <span className="flex items-center gap-2 text-ink/55"><SlidersHorizontal aria-hidden="true" size={14} /> Curated order</span>
          </div>
        </div>
        <ProductGrid products={visibleProducts} />
      </div>
    </main>
  );
}
