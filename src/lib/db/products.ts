import { prisma } from "@/lib/db/prisma";

export async function findPublishedProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      brand: true,
      images: { orderBy: { position: "asc" } },
      variants: true,
      categories: { include: { category: true } },
    },
  });
}

export async function listPublishedProducts(options?: {
  category?: string;
  take?: number;
  skip?: number;
}) {
  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
      categories: options?.category
        ? { some: { category: { slug: options.category } } }
        : undefined,
    },
    include: {
      brand: true,
      images: { orderBy: { position: "asc" } },
      variants: true,
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(options?.take ?? 24, 100),
    skip: options?.skip ?? 0,
  });
}
