import { formatMoney } from "@/lib/catalog";
import { prisma } from "@/lib/db/prisma";

export async function getAdminDashboard() {
  const [products, drafts, orders, pending, customers, pages] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "PAID", "PROCESSING"] } } }),
    prisma.customer.count(),
    prisma.contentPage.count(),
  ]);

  return { products, drafts, orders, pending, customers, pages };
}

export async function getAdminSectionRows(section: string) {
  switch (section) {
    case "products": {
      const products = await prisma.product.findMany({
        include: { variants: { orderBy: { price: "asc" } } },
        orderBy: { updatedAt: "desc" },
        take: 100,
      });
      return products.map((product) => [
        product.name,
        product.variants[0]?.sku ?? "—",
        product.variants.length
          ? product.variants
              .map((variant) => `${variant.name}: ${formatMoney(variant.price)}`)
              .join("\n")
          : "—",
        product.createdAt.toISOString().slice(0, 10),
        product.status,
        product.slug,
      ]);
    }
    case "categories": {
      const categories = await prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      });
      return categories.map((category) => [
        category.name,
        category.slug,
        String(category._count.products),
        "ACTIVE",
      ]);
    }
    case "brands": {
      const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
      return brands.map((brand) => [
        brand.name,
        brand.slug,
        brand.description ?? "—",
        "ACTIVE",
      ]);
    }
    case "orders": {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return orders.map((order) => [
        `#${order.number}`,
        order.fullName,
        formatMoney(order.total, order.currency),
        order.status,
        order.id,
      ]);
    }
    case "customers": {
      const customers = await prisma.customer.findMany({
        include: { _count: { select: { orders: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return customers.map((customer) => [
        customer.name,
        customer.email,
        String(customer._count.orders),
        customer.createdAt.toISOString().slice(0, 10),
      ]);
    }
    case "content": {
      const pages = await prisma.contentPage.findMany({
        orderBy: { updatedAt: "desc" },
      });
      return pages.map((page) => [
        page.title,
        page.slug,
        page.updatedAt.toISOString().slice(0, 10),
        page.published ? "PUBLISHED" : "DRAFT",
      ]);
    }
    case "shipping": {
      const methods = await prisma.shippingMethod.findMany({
        orderBy: { name: "asc" },
      });
      return methods.map((method) => [
        method.name,
        method.code,
        formatMoney(method.price),
        method.active ? "ACTIVE" : "INACTIVE",
      ]);
    }
    default:
      return [];
  }
}
