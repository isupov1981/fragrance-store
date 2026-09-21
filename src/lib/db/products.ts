import type { Prisma } from "@prisma/client";

import type { StoreCategory, StoreProduct } from "@/lib/catalog";
import { categories as fallbackCategories, fallbackProducts, getProduct } from "@/lib/catalog";
import { isMerchCategorySlug } from "@/lib/catalog/merchandising";
import { databaseEnabled } from "@/lib/db/enabled";

const publishedInclude = {
  brand: true,
  images: { orderBy: { position: "asc" as const } },
  variants: { orderBy: { price: "asc" as const } },
  categories: { include: { category: true } },
} satisfies Prisma.ProductInclude;

export type PublishedProduct = Prisma.ProductGetPayload<{ include: typeof publishedInclude }>;

export function toStoreProduct(record: PublishedProduct): StoreProduct | null {
  if (!record.variants.length) return null;
  const categorySlugs = record.categories.map((item) => item.category.slug);
  const category =
    categorySlugs.find((slug) => !isMerchCategorySlug(slug)) ?? categorySlugs[0] ?? "all";
  const concentration =
    record.concentration === "extrait" || record.concentration === "edp"
      ? record.concentration
      : undefined;
  const notes = Array.isArray(record.notes)
    ? record.notes.filter((note): note is string => typeof note === "string")
    : undefined;
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    brand: record.brand?.name ?? "",
    description: record.description,
    descriptionHe: record.descriptionHe ?? undefined,
    category,
    categorySlugs: categorySlugs.length ? categorySlugs : [category],
    concentration,
    manufacturer: record.manufacturer ?? undefined,
    originCountry: record.originCountry ?? undefined,
    inci: record.inci ?? undefined,
    supplyChannel:
      record.supplyChannel === "official" || record.supplyChannel === "parallel"
        ? record.supplyChannel
        : undefined,
    featured: record.featured,
    newArrival: record.newArrival,
    createdAt: record.createdAt.toISOString(),
    notes,
    images: record.images.map((image) => image.url).filter(Boolean),
    variants: record.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      price: variant.price,
      compareAt: variant.compareAt ?? undefined,
      stock: variant.stock,
    })),
  };
}

async function loadPublishedProducts(where: Prisma.ProductWhereInput = {}) {
  const { prisma } = await import("@/lib/db/prisma");
  return prisma.product.findMany({
    where: { status: "ACTIVE", ...where },
    include: publishedInclude,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
}

export async function listStoreProducts(): Promise<StoreProduct[]> {
  if (!databaseEnabled()) return fallbackProducts;
  try {
    const records = await loadPublishedProducts();
    const mapped = records.map(toStoreProduct).filter((item): item is StoreProduct => Boolean(item?.images.length));
    return mapped.length ? mapped : fallbackProducts;
  } catch (error) {
    console.error("Failed to load catalogue from database", error);
    return fallbackProducts;
  }
}

export async function getStoreProduct(slug: string): Promise<StoreProduct | undefined> {
  if (!databaseEnabled()) return getProduct(slug);
  try {
    const { prisma } = await import("@/lib/db/prisma");
    const record = await prisma.product.findFirst({
      where: { slug, status: "ACTIVE" },
      include: publishedInclude,
    });
    if (!record) {
      const published = await loadPublishedProducts();
      if (!published.length) return getProduct(slug);
      return undefined;
    }
    const mapped = toStoreProduct(record);
    return mapped?.images.length ? mapped : undefined;
  } catch (error) {
    console.error("Failed to load product from database", error);
    return getProduct(slug);
  }
}

export async function listStoreCategories(): Promise<StoreCategory[]> {
  if (!databaseEnabled()) return fallbackCategories;
  try {
    const { prisma } = await import("@/lib/db/prisma");
    const rows = await prisma.category.findMany({ orderBy: { name: "asc" } });
    if (!rows.length) return fallbackCategories;
    const extras = rows.filter((row) => !fallbackCategories.some((item) => item.slug === row.slug));
    return [
      ...fallbackCategories,
      ...extras.map((row) => ({
        slug: row.slug,
        name: row.name,
        description: row.description ?? "",
      })),
    ];
  } catch (error) {
    console.error("Failed to load categories from database", error);
    return fallbackCategories;
  }
}

export async function findPublishedProduct(slug: string) {
  const { prisma } = await import("@/lib/db/prisma");
  return prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: publishedInclude,
  });
}

export async function listPublishedProducts(options?: {
  category?: string;
  take?: number;
  skip?: number;
}) {
  const { prisma } = await import("@/lib/db/prisma");
  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
      categories: options?.category
        ? { some: { category: { slug: options.category } } }
        : undefined,
    },
    include: publishedInclude,
    orderBy: { createdAt: "desc" },
    take: Math.min(options?.take ?? 24, 100),
    skip: options?.skip ?? 0,
  });
}
