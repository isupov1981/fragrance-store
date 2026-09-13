import { hash } from "bcryptjs";
import { PrismaClient, ProductStatus } from "@prisma/client";
import { categories, products } from "../src/lib/catalog";

const prisma = new PrismaClient();

async function main() {
  for (const category of categories.filter(({ slug }) => slug !== "all")) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category,
    });
  }

  for (const item of products) {
    const category = await prisma.category.findUnique({ where: { slug: item.category } });
    const brand = await prisma.brand.upsert({
      where: { slug: item.brand.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") },
      update: { name: item.brand },
      create: {
        name: item.brand,
        slug: item.brand.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"),
      },
    });

    await prisma.product.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        status: ProductStatus.ACTIVE,
        featured: item.featured ?? false,
        brandId: brand.id,
        images: {
          create: item.images.map((url, position) => ({
            url,
            alt: item.name,
            position,
          })),
        },
        variants: {
          create: item.variants.map((variant) => variant),
        },
        categories: category
          ? { create: { category: { connect: { id: category.id } } } }
          : undefined,
      },
    });
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
      description: "Complimentary over $250, otherwise $12.",
      price: 1200,
    },
    {
      code: "express",
      name: "Express delivery",
      description: "Priority dispatch in 1–2 business days.",
      price: 2500,
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
