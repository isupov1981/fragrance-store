import { toSlug } from "@/lib/catalog/slug";
import { fallbackProducts } from "@/lib/catalog";
import { databaseEnabled } from "@/lib/db/enabled";

export type StoreBrand = {
  name: string;
  slug: string;
};

export type BrandLetterGroup = {
  letter: string;
  label: string;
  brands: StoreBrand[];
};

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

export function brandIndexLetter(name: string): string {
  const ch = name.trim().charAt(0).toLocaleUpperCase("en-US");
  if (ch >= "0" && ch <= "9") return "0-9";
  if (ch >= "A" && ch <= "Z") return ch;
  return "#";
}

export function groupBrandsByLetter(brands: StoreBrand[]): BrandLetterGroup[] {
  const groups = new Map<string, StoreBrand[]>();
  for (const brand of brands) {
    const letter = brandIndexLetter(brand.name);
    const bucket = groups.get(letter) ?? [];
    bucket.push(brand);
    groups.set(letter, bucket);
  }

  const order = (letter: string) => {
    if (letter === "0-9") return 0;
    if (letter === "#") return 1000;
    return letter.charCodeAt(0);
  };

  return [...groups.entries()]
    .sort(([a], [b]) => order(a) - order(b))
    .map(([letter, items]) => ({
      letter,
      label: letter === "0-9" || letter === "#" ? letter : `${letter} — Brands`,
      brands: items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    }));
}

export async function listStoreBrands(): Promise<StoreBrand[]> {
  if (!databaseEnabled()) return brandsFromProducts(fallbackProducts);
  try {
    const { prisma } = await import("@/lib/db/prisma");
    const rows = await prisma.brand.findMany({
      where: { products: { some: { status: "ACTIVE" } } },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    });
    if (rows.length) return rows;
    const { listStoreProducts } = await import("@/lib/db/products");
    return brandsFromProducts(await listStoreProducts());
  } catch (error) {
    console.error("Failed to load brands from database", error);
    return brandsFromProducts([]);
  }
}

export async function getStoreBrand(slug: string): Promise<StoreBrand | undefined> {
  const brands = await listStoreBrands();
  return brands.find((brand) => brand.slug === slug);
}
