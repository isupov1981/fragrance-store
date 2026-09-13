"use client";

import Image from "next/image";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useCurrency } from "@/components/i18n/currency-provider";
import { useI18n } from "@/components/i18n/i18n-provider";
import { interpolate } from "@/lib/i18n/interpolate";
import type { StoreProduct } from "@/lib/catalog";

export function ProductCard({ product, priority = false }: { product: StoreProduct; priority?: boolean }) {
  const variant = product.variants[0];
  const available = product.variants.some((item) => item.stock > 0);
  const { dict } = useI18n();
  const { format } = useCurrency();
  const category = dict.categories[product.category as keyof typeof dict.categories];

  return (
    <article className="product-card group">
      <LocaleLink className="block" href={`/products/${product.slug}`} aria-label={interpolate(dict.product.view, { name: product.name })}>
        <div className="relative aspect-[4/5] overflow-hidden bg-stone">
          <Image
            className={`h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04] ${product.images[1] ? "group-hover:opacity-0" : ""}`}
            src={product.images[0]}
            alt={`${product.name} ${dict.product.edp}`}
            fill
            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 25vw"
            priority={priority}
          />
          {product.images[1] ? (
            <Image
              className="object-cover opacity-0 transition duration-700 ease-out group-hover:scale-[1.04] group-hover:opacity-100"
              src={product.images[1]}
              alt=""
              fill
              sizes="(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 25vw"
            />
          ) : null}
          <div className="absolute start-3 top-3 flex flex-col items-start gap-1.5">
            {product.newArrival && <span className="badge">{dict.product.new}</span>}
            {!available && <span className="badge bg-ink text-ivory">{dict.product.soldOut}</span>}
          </div>
          <span className="absolute inset-x-4 bottom-4 translate-y-3 bg-ivory/95 px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            {dict.product.discover}
          </span>
        </div>
        <div className="pt-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/55">{product.brand}</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h3 className="font-display text-xl leading-tight">{product.name}</h3>
            <p className="shrink-0 text-xs">{interpolate(dict.product.from, { price: format(variant.price) })}</p>
          </div>
          <p className="mt-2 text-xs text-ink/55">{category?.name} · {dict.product.edp}</p>
        </div>
      </LocaleLink>
    </article>
  );
}
