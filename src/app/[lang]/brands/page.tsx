import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleLink } from "@/components/i18n/locale-link";
import { groupBrandsByLetter, listStoreBrands } from "@/lib/catalog/brands";
import { getDictionary, hasLocale } from "@/lib/i18n/get-dictionary";
import { interpolate } from "@/lib/i18n/interpolate";
import { localizedPath } from "@/lib/i18n/path";

export const revalidate = 60;

type BrandsIndexParams = { lang: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<BrandsIndexParams>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.brands.title,
    description: dict.brands.intro,
    alternates: { canonical: localizedPath(lang, "/brands") },
  };
}

export default async function BrandsIndexPage({ params }: { params: Promise<BrandsIndexParams> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const brands = await listStoreBrands();
  const groups = groupBrandsByLetter(brands);

  return (
    <main id="main-content">
      <header className="border-b border-ink/10 bg-stone/40">
        <div className="shell py-14 text-center sm:py-20">
          <p className="eyebrow text-bronze">{dict.nav.brands}</p>
          <h1 className="mt-4 font-display text-5xl sm:text-7xl">{dict.brands.title}</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-ink/65">{dict.brands.intro}</p>
        </div>
      </header>
      <div className="shell py-12 sm:py-16">
        {groups.length ? (
          <div className="space-y-12">
            {groups.map((group) => (
              <section key={group.letter} id={`letter-${group.letter}`}>
                <h2 className="mb-5 border-b border-ink/10 pb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55">
                  {group.letter === "0-9" || group.letter === "#"
                    ? group.letter
                    : interpolate(dict.brands.letterBrands, { letter: group.letter })}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.brands.map((brand) => (
                    <li key={brand.slug}>
                      <LocaleLink
                        className="block border border-ink/10 px-5 py-4 text-sm transition hover:border-bronze hover:text-bronze"
                        href={`/brands/${brand.slug}`}
                      >
                        {brand.name}
                      </LocaleLink>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-ink/60">{dict.brands.empty}</p>
        )}
      </div>
    </main>
  );
}
