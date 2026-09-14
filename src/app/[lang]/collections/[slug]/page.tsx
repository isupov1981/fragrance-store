import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { LocaleLink } from "@/components/i18n/locale-link";
import { AutoSubmitForm } from "@/components/ui/auto-submit-form";
import { getCategory as getFallbackCategory, localizedDescription } from "@/lib/catalog";
import { listStoreCategories, listStoreProducts } from "@/lib/db/products";
import { isCollectionSort, paginateCollection, sortCollection, type CollectionSort } from "@/lib/catalog/browse";
import { getDictionary, hasLocale } from "@/lib/i18n/get-dictionary";
import { interpolate } from "@/lib/i18n/interpolate";
import { localizedPath } from "@/lib/i18n/path";

export const revalidate = 60;

export async function generateStaticParams() {
  const categories = await listStoreCategories();
  return categories.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/collections/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  const category =
    getFallbackCategory(slug) ?? (await listStoreCategories()).find((item) => item.slug === slug);
  const copy = dict.categories[slug as keyof typeof dict.categories];
  return {
    title: copy?.name ?? dict.collection.prive,
    description: copy?.description ?? category?.description,
    alternates: { canonical: localizedPath(lang, `/collections/${slug}`) },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps<"/[lang]/collections/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const query = await searchParams;
  const dict = getDictionary(lang);
  const categories = await listStoreCategories();
  const catalog = await listStoreProducts();
  const category = categories.find((item) => item.slug === slug) ?? getFallbackCategory(slug);
  if (!category) notFound();
  const copy = dict.categories[slug as keyof typeof dict.categories];

  const search = typeof query.q === "string" ? query.q.trim().toLowerCase() : "";
  const edit = typeof query.edit === "string" ? query.edit : "";
  const sortParam = typeof query.sort === "string" ? query.sort : "";
  const sort: CollectionSort = isCollectionSort(sortParam) ? sortParam : "featured";
  const inStock = query.stock === "1";
  const page = Number.parseInt(typeof query.page === "string" ? query.page : "1", 10) || 1;
  const filtered = catalog.filter((product) => {
    const inCategory = slug === "all" || product.category === slug;
    const inEdit = edit === "new" ? product.newArrival : edit === "featured" ? product.featured : true;
    const description = dict.catalog[product.slug as keyof typeof dict.catalog] ?? localizedDescription(product, lang);
    const inSearch = !search || `${product.name} ${product.brand} ${description}`.toLowerCase().includes(search);
    const available = !inStock || product.variants.some((variant) => variant.stock > 0);
    return inCategory && inEdit && inSearch && available;
  });
  const sorted = sortCollection(filtered, sort);
  const paged = paginateCollection(sorted, page);
  const title =
    edit === "new" ? dict.collection.arrivals : edit === "featured" ? dict.collection.featured : (copy?.name ?? category.name);

  function hrefFor(next: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = {
      q: search || undefined,
      edit: edit || undefined,
      sort: sort === "featured" ? undefined : sort,
      stock: inStock ? "1" : undefined,
      page: undefined as string | undefined,
      ...next,
    };
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const queryString = params.toString();
    return queryString ? `/collections/${slug}?${queryString}` : `/collections/${slug}`;
  }

  return (
    <main id="main-content">
      <header className="border-b border-ink/10 bg-stone/40">
        <div className="shell py-14 text-center sm:py-20">
          <p className="eyebrow text-bronze">{dict.collection.prive}</p>
          <h1 className="mt-4 font-display text-5xl sm:text-7xl">{search ? interpolate(dict.collection.searchResults, { query: search }) : title}</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-ink/65">{copy?.description ?? category.description}</p>
        </div>
      </header>

      <div className="shell py-12 sm:py-16">
        <nav className="mb-10 overflow-x-auto border-b border-ink/10" aria-label={dict.collection.families}>
          <ul className="flex min-w-max gap-8">
            {categories.map((item) => (
              <li key={item.slug}>
                <LocaleLink
                  className={`block border-b py-4 text-[10px] font-semibold uppercase tracking-[0.17em] ${
                    slug === item.slug ? "border-ink" : "border-transparent text-ink/50 hover:text-ink"
                  }`}
                  href={`/collections/${item.slug}`}
                  aria-current={slug === item.slug ? "page" : undefined}
                >
                  {dict.categories[item.slug as keyof typeof dict.categories]?.name ?? item.name}
                </LocaleLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mb-8 flex flex-col gap-4 border-b border-ink/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink/60">{paged.total} {paged.total === 1 ? dict.collection.one : dict.collection.many}</p>
          <div className="flex flex-wrap items-center gap-5 text-[10px] font-semibold uppercase tracking-[0.15em]">
            <form className="flex items-center border-b border-ink/25" action={localizedPath(lang, `/collections/${slug}`)}>
              {edit ? <input type="hidden" name="edit" value={edit} /> : null}
              {sort !== "featured" ? <input type="hidden" name="sort" value={sort} /> : null}
              {inStock ? <input type="hidden" name="stock" value="1" /> : null}
              <label className="sr-only" htmlFor="collection-search">{dict.collection.searchThis}</label>
              <input className="w-32 bg-transparent py-2 text-xs normal-case tracking-normal outline-none sm:w-44" id="collection-search" name="q" type="search" defaultValue={search} placeholder={dict.collection.search} />
              <button className="p-2" type="submit" aria-label={dict.collection.search}><Search aria-hidden="true" size={15} /></button>
            </form>
            <AutoSubmitForm action={localizedPath(lang, `/collections/${slug}`)}>
              {search ? <input type="hidden" name="q" value={search} /> : null}
              {edit ? <input type="hidden" name="edit" value={edit} /> : null}
              {inStock ? <input type="hidden" name="stock" value="1" /> : null}
              <label className="sr-only" htmlFor="collection-sort">{dict.collection.sort}</label>
              <select className="bg-transparent py-2 outline-none" id="collection-sort" name="sort" defaultValue={sort}>
                <option value="featured">{dict.collection.sortFeatured}</option>
                <option value="newest">{dict.collection.sortNewest}</option>
                <option value="price-asc">{dict.collection.sortPriceAsc}</option>
                <option value="price-desc">{dict.collection.sortPriceDesc}</option>
                <option value="name">{dict.collection.sortName}</option>
              </select>
            </AutoSubmitForm>
            <LocaleLink className={inStock ? "text-ink" : "text-ink/55"} href={hrefFor({ stock: inStock ? undefined : "1", page: undefined })}>
              {dict.collection.inStock}
            </LocaleLink>
          </div>
        </div>
        <ProductGrid products={paged.items} />
        {paged.totalPages > 1 ? (
          <nav className="mt-12 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em]" aria-label={interpolate(dict.collection.pageOf, { current: paged.page, total: paged.totalPages })}>
            {paged.page > 1 ? (
              <LocaleLink href={hrefFor({ page: String(paged.page - 1) })}>{dict.collection.previous}</LocaleLink>
            ) : <span />}
            <span>{interpolate(dict.collection.pageOf, { current: paged.page, total: paged.totalPages })}</span>
            {paged.page < paged.totalPages ? (
              <LocaleLink href={hrefFor({ page: String(paged.page + 1) })}>{dict.collection.next}</LocaleLink>
            ) : <span />}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
