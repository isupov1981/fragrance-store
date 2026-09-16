import { hash } from "bcryptjs";
import { PrismaClient, ProductStatus } from "@prisma/client";
import { atelierProducts, categories, demoProducts } from "../src/lib/catalog";

const prisma = new PrismaClient();
const atelierSlugs = atelierProducts.map((item) => item.slug);
const demoSlugs = demoProducts.map((item) => item.slug);

async function syncProductImages(
  productId: string,
  name: string,
  images: string[],
) {
  await prisma.productImage.deleteMany({
    where: { productId, url: { notIn: images } },
  });
  for (const [position, url] of images.entries()) {
    const existing = await prisma.productImage.findFirst({ where: { productId, url } });
    if (existing) {
      await prisma.productImage.update({
        where: { id: existing.id },
        data: { alt: name, position },
      });
    } else {
      await prisma.productImage.create({
        data: { productId, url, alt: name, position },
      });
    }
  }
}

async function main() {
  for (const category of categories.filter(({ slug }) => slug !== "all")) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category,
    });
  }

  for (const item of atelierProducts) {
    const category = await prisma.category.findUnique({ where: { slug: item.category } });
    const brand = await prisma.brand.upsert({
      where: { slug: item.brand.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") },
      update: { name: item.brand },
      create: {
        name: item.brand,
        slug: item.brand.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"),
      },
    });

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        descriptionHe: item.descriptionHe,
        status: ProductStatus.ACTIVE,
        featured: item.featured ?? false,
        newArrival: item.newArrival ?? false,
        concentration: item.concentration,
        notes: item.notes,
        brandId: brand.id,
      },
      create: {
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        descriptionHe: item.descriptionHe,
        status: ProductStatus.ACTIVE,
        featured: item.featured ?? false,
        newArrival: item.newArrival ?? false,
        concentration: item.concentration,
        notes: item.notes,
        brandId: brand.id,
      },
    });

    for (const variant of item.variants) {
      await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: {
          productId: product.id,
          name: variant.name,
          price: variant.price,
          compareAt: variant.compareAt,
          stock: variant.stock,
        },
        create: {
          id: variant.id,
          productId: product.id,
          sku: variant.sku,
          name: variant.name,
          price: variant.price,
          compareAt: variant.compareAt,
          stock: variant.stock,
        },
      });
    }

    await syncProductImages(product.id, item.name, item.images);

    if (category) {
      await prisma.productCategory.upsert({
        where: {
          productId_categoryId: { productId: product.id, categoryId: category.id },
        },
        update: {},
        create: { productId: product.id, categoryId: category.id },
      });
    }
  }

  // Drop fixture demos from the live catalogue (keep real atelier SKUs only).
  const demoRows = await prisma.product.findMany({
    where: { slug: { in: demoSlugs } },
    select: { id: true, slug: true },
  });
  if (demoRows.length) {
    const ids = demoRows.map((row) => row.id);
    await prisma.orderItem.updateMany({ where: { productId: { in: ids } }, data: { productId: null } });
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    console.log(`Removed ${demoRows.length} demo product(s): ${demoRows.map((r) => r.slug).join(", ")}`);
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    await prisma.adminUser.upsert({
      where: { email },
      update: {
        name: process.env.ADMIN_NAME?.trim() || "Store administrator",
        passwordHash: await hash(password, 12),
        role: process.env.ADMIN_ROLE === "EDITOR" ? "EDITOR" : "ADMIN",
      },
      create: {
        email,
        name: process.env.ADMIN_NAME?.trim() || "Store administrator",
        passwordHash: await hash(password, 12),
        role: process.env.ADMIN_ROLE === "EDITOR" ? "EDITOR" : "ADMIN",
      },
    });
  }

  for (const method of [
    {
      code: "standard",
      name: "Standard delivery",
      description: "Complimentary over ₪499 (unopened original packaging), otherwise ₪45.",
      price: 4500,
    },
    {
      code: "express",
      name: "Express delivery",
      description: "Priority dispatch in 1–2 business days.",
      price: 9300,
    },
  ]) {
    await prisma.shippingMethod.upsert({
      where: { code: method.code },
      update: method,
      create: method,
    });
  }

  for (const page of [
    { slug: "faq", title: "Frequently asked questions" },
    { slug: "shipping", title: "Shipping" },
    { slug: "refund", title: "Returns & refunds" },
    { slug: "contact", title: "Contact us" },
    { slug: "about", title: "Our atelier" },
  ]) {
    await prisma.contentPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        ...page,
        content: `${page.title} content can be managed from the administration area.`,
        published: true,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
