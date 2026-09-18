import { Prisma } from "@prisma/client";

import {
  adminSimpleProductSchema,
  createProductInputSchema,
  listProductsInputSchema,
  merchandisingTagSchema,
  productLookupSchema,
  updateProductInputSchema,
  type CreateProductInput,
  type MerchandisingTag,
  type UpdateProductInput,
} from "@/lib/agent/schema";
import { merchandisingCategoryDefs, isMerchCategorySlug } from "@/lib/catalog/merchandising";
import { inferFamilyCategory } from "@/lib/catalog/family";
import { toSlug } from "@/lib/catalog/slug";
import { databaseEnabled } from "@/lib/db/enabled";
import { announceNewArrivalIfNeeded } from "@/lib/email/new-arrivals";

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

async function upsertFamilyCategory(tx: Prisma.TransactionClient, name?: string | null) {
  if (!name) return null;
  const slug = toSlug(name);
  if (isMerchCategorySlug(slug)) {
    throw new AgentCatalogError(
      `Use merchandising for ${slug}; category is for olfactive family (amber=gourmand / woody=clean / floral / citrus=dominant).`,
      400,
    );
  }
  return tx.category.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
}

async function ensureMerchandisingCategory(tx: Prisma.TransactionClient, tag: MerchandisingTag) {
  const def = merchandisingCategoryDefs.find((item) => item.slug === tag);
  if (!def) throw new AgentCatalogError(`Unknown merchandising tag: ${tag}`, 400);
  return tx.category.upsert({
    where: { slug: def.slug },
    update: { name: def.name, description: def.description },
    create: { slug: def.slug, name: def.name, description: def.description },
  });
}

function serializeProduct(product: Prisma.ProductGetPayload<{ include: typeof productInclude }>) {
  const categorySlugs = product.categories.map((item) => item.category.slug);
  const family = categorySlugs.find((slug) => !isMerchCategorySlug(slug)) ?? null;
  const merchandising = categorySlugs.filter((slug): slug is MerchandisingTag =>
    merchandisingTagSchema.safeParse(slug).success,
  );
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    status: product.status,
    description: product.description,
    descriptionHe: product.descriptionHe,
    brand: product.brand?.name ?? null,
    category: family,
    categories: categorySlugs,
    merchandising,
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

async function linkCategories(
  tx: Prisma.TransactionClient,
  productId: string,
  categoryIds: string[],
) {
  const unique = [...new Set(categoryIds.filter(Boolean))];
  await tx.productCategory.deleteMany({ where: { productId } });
  if (!unique.length) return;
  await tx.productCategory.createMany({
    data: unique.map((categoryId) => ({ productId, categoryId })),
  });
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
    newArrival: data.newArrival,
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
  const familySlug = inferFamilyCategory({
    category: input.category,
    name: input.name,
    description: input.description,
    descriptionHe: input.descriptionHe,
    notes: input.notes,
  });
  return prisma.$transaction(async (tx) => {
    const brand = await upsertBrand(tx, input.brand);
    const family = await upsertFamilyCategory(tx, familySlug);
    const merch = await Promise.all(
      (input.merchandising ?? []).map((tag) => ensureMerchandisingCategory(tx, tag)),
    );
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
      },
      include: productInclude,
    });

    const categoryIds = [...(family ? [family.id] : []), ...merch.map((item) => item.id)];
    if (categoryIds.length) {
      await linkCategories(tx, created.id, categoryIds);
    }

    const full = await tx.product.findUniqueOrThrow({
      where: { id: created.id },
      include: productInclude,
    });
    return serializeProduct(full);
  }).then(async (serialized) => {
    await announceNewArrivalIfNeeded(serialized.id).catch(console.error);
    return serialized;
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

    if (input.variants) {
      await tx.productVariant.deleteMany({ where: { productId: existing.id } });
    }
    if (input.images) {
      await tx.productImage.deleteMany({ where: { productId: existing.id } });
    }

    await tx.product.update({
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
      },
    });

    if (input.category !== undefined || input.merchandising !== undefined) {
      const existingLinks = existing.categories;
      const existingFamily = existingLinks.find((item) => !isMerchCategorySlug(item.category.slug));
      const existingMerch = existingLinks
        .map((item) => item.category.slug)
        .filter((slug): slug is MerchandisingTag => merchandisingTagSchema.safeParse(slug).success);

      let familyId = existingFamily?.categoryId ?? null;
      if (input.category !== undefined) {
        if (input.category === null) {
          familyId = null;
        } else {
          const family = await upsertFamilyCategory(tx, input.category);
          familyId = family?.id ?? null;
        }
      }

      let merchTags = existingMerch;
      if (input.merchandising !== undefined) {
        merchTags = input.merchandising ?? [];
      }
      const merchRows = await Promise.all(merchTags.map((tag) => ensureMerchandisingCategory(tx, tag)));

      await linkCategories(tx, existing.id, [
        ...(familyId ? [familyId] : []),
        ...merchRows.map((row) => row.id),
      ]);
    }

    const full = await tx.product.findUniqueOrThrow({
      where: { id: existing.id },
      include: productInclude,
    });
    return serializeProduct(full);
  }).then(async (serialized) => {
    await announceNewArrivalIfNeeded(serialized.id).catch(console.error);
    return serialized;
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
  await announceNewArrivalIfNeeded(updated.id).catch(console.error);
  return serializeProduct(updated);
}

export async function listAgentProducts(input: unknown) {
  const prisma = await db();
  const query = listProductsInputSchema.parse(input ?? {});
  const products = await prisma.product.findMany({
    where: {
      status: query.status,
      categories: query.merchandising
        ? { some: { category: { slug: query.merchandising } } }
        : undefined,
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
