import { unstable_cache } from "next/cache";

import type { StoreBrand } from "@/lib/catalog/brand-groups";
import { toSlug } from "@/lib/catalog/slug";
import { fallbackProducts } from "@/lib/catalog";
import { databaseEnabled } from "@/lib/db/enabled";
import { STORE_CATALOG_REVALIDATE_SECONDS, STORE_CATALOG_TAG } from "@/lib/db/store-cache";

export {
  brandIndexLetter,
  groupBrandsByLetter,
  type BrandLetterGroup,
  type StoreBrand,
} from "@/lib/catalog/brand-groups";

function brandsFromProducts(products: { brand: string }[]): StoreBrand[] {
  const bySlug = new Map<string, StoreBrand>();
  for (const product of products) {
    const name = product.brand.trim();
    if (!name) continue;
    const slug = toSlug(name);
    if (!bySlug.has(slug)) bySlug.set(slug, { name, slug });
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

const cachedListStoreBrands = unstable_cache(
  async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const rows = await prisma.brand.findMany({
      where: { products: { some: { status: "ACTIVE" } } },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    });
    if (rows.length) return rows;
    const { listStoreProducts } = await import("@/lib/db/products");
    return brandsFromProducts(await listStoreProducts());
  },
  ["store-brands"],
  { revalidate: STORE_CATALOG_REVALIDATE_SECONDS, tags: [STORE_CATALOG_TAG] },
);

export async function listStoreBrands(): Promise<StoreBrand[]> {
  if (!databaseEnabled()) return brandsFromProducts(fallbackProducts);
  try {
    return await cachedListStoreBrands();
  } catch (error) {
    console.error("Failed to load brands from database", error);
    return brandsFromProducts([]);
  }
}

export async function getStoreBrand(slug: string): Promise<StoreBrand | undefined> {
  const brands = await listStoreBrands();
  return brands.find((brand) => brand.slug === slug);
}
