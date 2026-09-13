import type { StoreProduct } from "@/lib/catalog";

export function productJsonLd(product: StoreProduct) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const variant = product.variants[0];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    sku: variant.sku,
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/products/${product.slug}`,
      priceCurrency: process.env.NEXT_PUBLIC_STORE_CURRENCY ?? "USD",
      price: (variant.price / 100).toFixed(2),
      availability:
        variant.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };
}
