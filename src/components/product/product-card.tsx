import Image from "next/image";
import Link from "next/link";
import { formatMoney, type StoreProduct } from "@/lib/catalog";

export function ProductCard({ product, priority = false }: { product: StoreProduct; priority?: boolean }) {
  const variant = product.variants[0];
  const available = product.variants.some((item) => item.stock > 0);

  return (
    <article className="product-card group">
      <Link className="block" href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-stone">
          <Image
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.025]"
            src={product.images[0]}
            alt={`${product.name} eau de parfum bottle`}
            fill
            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 25vw"
            priority={priority}
          />
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.newArrival && <span className="badge">New</span>}
            {!available && <span className="badge bg-ink text-ivory">Sold out</span>}
          </div>
          <span className="absolute inset-x-4 bottom-4 translate-y-3 bg-ivory/95 px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            Discover fragrance
          </span>
        </div>
        <div className="pt-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/55">{product.brand}</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h3 className="font-display text-xl leading-tight">{product.name}</h3>
            <p className="shrink-0 text-xs">From {formatMoney(variant.price)}</p>
          </div>
          <p className="mt-2 text-xs capitalize text-ink/55">{product.category} · Eau de parfum</p>
        </div>
      </Link>
    </article>
  );
}
