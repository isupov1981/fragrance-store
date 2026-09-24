"use client";

import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ProductGrid } from "@/components/product/product-grid";
import { useHydratedFavorites } from "@/lib/favorites/use-hydrated-favorites";
import type { StoreProduct } from "@/lib/catalog";

export function SavedView({ catalog }: { catalog: StoreProduct[] }) {
  const { dict } = useI18n();
  const { productIds, hydrated } = useHydratedFavorites();

  if (!hydrated) {
    return <p className="border-y border-ink/10 py-16 text-center text-sm text-ink/60">{dict.favorites.loading}</p>;
  }

  const products = productIds
    .map((id) => catalog.find((product) => product.id === id))
    .filter((product): product is StoreProduct => Boolean(product));

  if (!products.length) {
    return (
      <div className="border-y border-ink/10 py-16 text-center">
        <p className="text-sm text-ink/60">{dict.favorites.empty}</p>
        <LocaleLink className="mt-6 inline-block text-sm underline underline-offset-4" href="/collections/all">
          {dict.favorites.browse}
        </LocaleLink>
      </div>
    );
  }

  return <ProductGrid products={products} emptyLabel={dict.favorites.empty} />;
}
