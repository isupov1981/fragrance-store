import { ProductCard } from "./product-card";
import type { StoreProduct } from "@/lib/catalog";

export function ProductGrid({
  products,
  emptyLabel = "No fragrances found.",
}: {
  products: StoreProduct[];
  emptyLabel?: string;
}) {
  if (!products.length) {
    return <p className="border-y border-ink/10 py-16 text-center text-sm text-ink/60">{emptyLabel}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
