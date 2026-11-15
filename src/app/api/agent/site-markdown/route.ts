import { NextResponse } from "next/server";

import type { StoreProduct } from "@/lib/catalog";
import { isNewProduct } from "@/lib/catalog/new-arrival";
import { listStoreProducts } from "@/lib/db/products";
import { isLocale } from "@/lib/i18n/config";
import { buildHomeMarkdown } from "@/lib/seo/llms-txt";

export const runtime = "nodejs";

/** Markdown homepage for agents that send Accept: text/markdown. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const langParam = url.searchParams.get("lang") || "en";
  const lang = isLocale(langParam) ? langParam : "en";

  let products: StoreProduct[] = [];
  try {
    const catalog = await listStoreProducts();
    const featured = [...catalog].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    products = featured.filter((product) => isNewProduct(product) || product.featured).slice(0, 12);
    if (!products.length) products = featured.slice(0, 12);
  } catch {
    products = [];
  }

  return new NextResponse(buildHomeMarkdown(lang, products), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      Vary: "Accept",
    },
  });
}
