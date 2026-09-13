import type { Prisma } from "@prisma/client";
import type { ProductImportRepository, ProductImportRow } from "./products";

export async function createPrismaProductRepository(): Promise<ProductImportRepository> {
  const { prisma } = await import("../db/prisma");

  return {
    async upsert(row: ProductImportRow) {
      return prisma.$transaction(async (tx: Prisma.TransactionClient): Promise<"created" | "updated"> => {
        const existing = await tx.productVariant.findUnique({
          where: { sku: row.sku },
          select: { productId: true },
        });
        const brand = row.brand
          ? await tx.brand.upsert({
              where: { slug: toSlug(row.brand) },
              update: { name: row.brand },
              create: { name: row.brand, slug: toSlug(row.brand) },
            })
          : null;
        const category = row.category
          ? await tx.category.upsert({
              where: { slug: toSlug(row.category) },
              update: { name: row.category },
              create: { name: row.category, slug: toSlug(row.category) },
            })
          : null;

        const product = await tx.product.upsert({
          where: { slug: row.slug },
          update: {
            name: row.name,
            description: row.description,
            status: row.status,
            featured: row.featured,
            brandId: brand?.id ?? null,
          },
          create: {
            name: row.name,
            slug: row.slug,
            description: row.description,
            status: row.status,
            featured: row.featured,
            brandId: brand?.id,
          },
        });
        await tx.productVariant.upsert({
          where: { sku: row.sku },
          update: {
            productId: product.id,
            name: row.variantName,
            price: row.price,
            stock: row.stock,
          },
          create: {
            productId: product.id,
            sku: row.sku,
            name: row.variantName,
            price: row.price,
            stock: row.stock,
          },
        });
        if (row.imageUrl) {
          const image = await tx.productImage.findFirst({
            where: { productId: product.id, url: row.imageUrl },
          });
          if (!image) {
            await tx.productImage.create({
              data: {
                productId: product.id,
                url: row.imageUrl,
                alt: row.name,
                position: 0,
              },
            });
          }
        }
        if (category) {
          await tx.productCategory.upsert({
            where: {
              productId_categoryId: {
                productId: product.id,
                categoryId: category.id,
              },
            },
            update: {},
            create: { productId: product.id, categoryId: category.id },
          });
        }
        return existing ? "updated" : "created";
      });
    },
  };
}

function toSlug(value: string) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `item-${Array.from(value, (char) => char.codePointAt(0)?.toString(16)).join("-")}`;
}
