import { Prisma } from "@prisma/client";

import {
  adminSimpleProductSchema,
  createProductInputSchema,
  listProductsInputSchema,
  productLookupSchema,
  updateProductInputSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/lib/agent/schema";
import { toSlug } from "@/lib/catalog/slug";
import { databaseEnabled } from "@/lib/db/enabled";

export class AgentCatalogError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

function assertDatabase() {
  if (!databaseEnabled()) {
    throw new AgentCatalogError("Database is not configured", 503);
  }
}

async function db() {
  assertDatabase();
  return (await import("@/lib/db/prisma")).prisma;
}

const productInclude = {
  brand: true,
  images: { orderBy: { position: "asc" as const } },
  variants: { orderBy: { price: "asc" as const } },
  categories: { include: { category: true } },
} satisfies Prisma.ProductInclude;

async function upsertBrand(tx: Prisma.TransactionClient, name?: string | null) {
  if (!name) return null;
  const slug = toSlug(name);
  return tx.brand.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
}

async function upsertCategory(tx: Prisma.TransactionClient, name?: string | null) {
  if (!name) return null;
  const slug = toSlug(name);
  return tx.category.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
}

function serializeProduct(
  product: Prisma.ProductGetPayload<{ include: typeof productInclude }>,
) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    status: product.status,
    description: product.description,
    descriptionHe: product.descriptionHe,
    brand: product.brand?.name ?? null,
    category: product.categories[0]?.category.slug ?? null,
    featured: product.featured,
    newArrival: product.newArrival,
    concentration: product.concentration,
    notes: product.notes,
    images: product.images,
    variants: product.variants,
    adminUrl: `/admin/products`,
    storeUrl: product.status === "ACTIVE" ? `/products/${product.slug}` : null,
  };
}

export function parseAdminProductInput(input: unknown): CreateProductInput {
  const data = adminSimpleProductSchema.parse(input);
  return createProductInputSchema.parse({
    name: data.name,
    slug: data.slug,
    description: data.description,
    descriptionHe: data.descriptionHe,
    brand: data.brand || undefined,
    category: data.category || undefined,
    images: data.imageUrl ? [{ url: data.imageUrl, alt: data.name }] : [],
    variants: [
      {
        name: "Default",
        sku: data.sku,
        price: data.price,
        stock: data.stock,
      },
    ],
  });
}

export async function createDraftProduct(input: CreateProductInput) {
  const prisma = await db();
  return prisma.$transaction(async (tx) => {
    const brand = await upsertBrand(tx, input.brand);
    const category = await upsertCategory(tx, input.category);
    const created = await tx.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        descriptionHe: input.descriptionHe,
        status: "DRAFT",
        featured: input.featured ?? false,
        newArrival: input.newArrival ?? false,
        concentration: input.concentration,
        notes: input.notes,
        brandId: brand?.id,
        images: input.images?.length
          ? {
              create: input.images.map((image, position) => ({
                url: image.url,
                alt: image.alt || input.name,
                position,
              })),
            }
          : undefined,
        variants: {
          create: input.variants.map((variant) => ({
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,
            compareAt: variant.compareAt,
          })),
        },
        categories: category ? { create: { categoryId: category.id } } : undefined,
      },
      include: productInclude,
    });
    return serializeProduct(created);
  });
}

export async function updateProduct(input: UpdateProductInput) {
  const prisma = await db();
  const lookup = productLookupSchema.parse({ id: input.id, slug: input.slug });
  return prisma.$transaction(async (tx) => {
    const existing = await tx.product.findFirst({
      where: lookup.id ? { id: lookup.id } : { slug: lookup.slug },
      include: productInclude,
    });
    if (!existing) throw new AgentCatalogError("Product not found", 404);

    const brand =
      input.brand === undefined ? existing.brand : await upsertBrand(tx, input.brand);
    const category =
      input.category === undefined
        ? existing.categories[0]?.category
        : await upsertCategory(tx, input.category);

    if (input.variants) {
      await tx.productVariant.deleteMany({ where: { productId: existing.id } });
    }
    if (input.images) {
      await tx.productImage.deleteMany({ where: { productId: existing.id } });
    }
    if (input.category !== undefined) {
      await tx.productCategory.deleteMany({ where: { productId: existing.id } });
    }

    const updated = await tx.product.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        description: input.description,
        descriptionHe: input.descriptionHe === undefined ? undefined : input.descriptionHe,
        featured: input.featured,
        newArrival: input.newArrival,
        concentration: input.concentration === undefined ? undefined : input.concentration,
        notes:
          input.notes === undefined
            ? undefined
            : input.notes === null
              ? Prisma.JsonNull
              : input.notes,
        status: input.status,
        brandId: input.brand === undefined ? undefined : (brand?.id ?? null),
        images: input.images
          ? {
              create: input.images.map((image, position) => ({
                url: image.url,
                alt: image.alt || input.name || existing.name,
                position,
              })),
            }
          : undefined,
        variants: input.variants
          ? {
              create: input.variants.map((variant) => ({
                name: variant.name,
                sku: variant.sku,
                price: variant.price,
                stock: variant.stock,
                compareAt: variant.compareAt,
              })),
            }
          : undefined,
        categories:
          input.category !== undefined && category
            ? { create: { categoryId: category.id } }
            : undefined,
      },
      include: productInclude,
    });
    return serializeProduct(updated);
  });
}

export async function publishProduct(input: { id?: string; slug?: string }) {
  const prisma = await db();
  const lookup = productLookupSchema.parse(input);
  const existing = await prisma.product.findFirst({
    where: lookup.id ? { id: lookup.id } : { slug: lookup.slug },
    include: productInclude,
  });
  if (!existing) throw new AgentCatalogError("Product not found", 404);
  if (!existing.variants.length) {
    throw new AgentCatalogError("Cannot publish a product without variants", 409);
  }
  if (!existing.images.length) {
    throw new AgentCatalogError("Cannot publish a product without images", 409);
  }
  const updated = await prisma.product.update({
    where: { id: existing.id },
    data: { status: "ACTIVE" },
    include: productInclude,
  });
  return serializeProduct(updated);
}

export async function listAgentProducts(input: unknown) {
  const prisma = await db();
  const query = listProductsInputSchema.parse(input ?? {});
  const products = await prisma.product.findMany({
    where: {
      status: query.status,
      OR: query.q
        ? [
            { name: { contains: query.q, mode: "insensitive" } },
            { slug: { contains: query.q, mode: "insensitive" } },
            { variants: { some: { sku: { contains: query.q, mode: "insensitive" } } } },
          ]
        : undefined,
    },
    include: productInclude,
    orderBy: { updatedAt: "desc" },
    take: query.take,
  });
  return products.map(serializeProduct);
}

export { createProductInputSchema, updateProductInputSchema, listProductsInputSchema, productLookupSchema };
