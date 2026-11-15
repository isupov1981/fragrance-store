import type { StoreProduct } from "@/lib/catalog";
import { listStoreProducts } from "@/lib/db/products";
import { isNewProduct } from "@/lib/catalog/new-arrival";
import { buildLlmsTxt } from "@/lib/seo/llms-txt";

export const runtime = "nodejs";

export async function GET() {
  let products: StoreProduct[] = [];
  try {
    const catalog = await listStoreProducts();
    const arrivals = catalog.filter((product) => isNewProduct(product));
    const featured = [...catalog].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    products = (arrivals.length ? arrivals : featured).slice(0, 12);
  } catch {
    products = [];
  }

  return new Response(buildLlmsTxt(products), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
