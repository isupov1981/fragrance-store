import type { MetadataRoute } from "next";
import { listStoreCategories, listStoreProducts } from "@/lib/db/products";
import { locales } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();
  const [catalog, categories] = await Promise.all([listStoreProducts(), listStoreCategories()]);
  const paths = [
    "/",
    ...catalog.map((product) => `/products/${product.slug}`),
    ...categories.map((category) => `/collections/${category.slug}`),
    "/faq",
    "/contact",
    "/shipping",
    "/refund",
    "/about",
    "/account",
  ];

  return locales.flatMap((locale) =>
    paths.map((path, index) => ({
      url: `${baseUrl}${localizedPath(locale, path)}`,
      lastModified: now,
      changeFrequency: (index === 0 ? "daily" : "weekly") as "daily" | "weekly",
      priority: index === 0 ? 1 : 0.7,
    })),
  );
}
