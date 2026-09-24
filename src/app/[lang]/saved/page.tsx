import type { Metadata } from "next";
import { SavedView } from "@/components/favorites/saved-view";
import { listStoreProducts } from "@/lib/db/products";
import { getDictionary, hasLocale } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/[lang]/saved">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.favorites.title,
    alternates: { canonical: localizedPath(lang, "/saved") },
  };
}

export default async function SavedPage({ params }: PageProps<"/[lang]/saved">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const catalog = await listStoreProducts();

  return (
    <main id="main-content">
      <header className="border-b border-ink/10 bg-stone/40">
        <div className="shell py-14 text-center sm:py-20">
          <p className="eyebrow text-bronze">{dict.favorites.eyebrow}</p>
          <h1 className="mt-4 font-display text-5xl sm:text-7xl">{dict.favorites.title}</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-ink/65">{dict.favorites.intro}</p>
        </div>
      </header>
      <div className="shell py-12 sm:py-16">
        <SavedView catalog={catalog} />
      </div>
    </main>
  );
}
