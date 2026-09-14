import { databaseEnabled } from "@/lib/db/enabled";

const LOW_STOCK = 5;
const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export class AgentReportError extends Error {
  constructor(
    message: string,
    public status = 503,
  ) {
    super(message);
  }
}

async function db() {
  if (!databaseEnabled()) throw new AgentReportError("Database is not configured");
  return (await import("@/lib/db/prisma")).prisma;
}

export async function getDailyReport() {
  const prisma = await db();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [orders, newCustomers, drafts, lowStock, products] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.customer.count({ where: { createdAt: { gte: since } } }),
    prisma.product.findMany({
      where: { status: "DRAFT" },
      include: { images: true, variants: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.productVariant.findMany({
      where: { stock: { lte: LOW_STOCK }, product: { status: "ACTIVE" } },
      include: { product: true },
      take: 30,
    }),
    prisma.product.count(),
  ]);

  const revenueIls = orders
    .filter((order) => (PAID_STATUSES as readonly string[]).includes(order.status))
    .reduce((sum, order) => sum + order.total, 0);

  const byStatus = orders.reduce<Record<string, number>>((counts, order) => {
    counts[order.status] = (counts[order.status] ?? 0) + 1;
    return counts;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    windowHours: 24,
    orders: {
      count: orders.length,
      revenueIls,
      byStatus,
      recent: orders.slice(0, 8).map((order) => ({
        number: order.number,
        status: order.status,
        total: order.total,
        currency: order.currency,
        email: order.email,
      })),
    },
    customers: { new: newCustomers },
    catalog: {
      products,
      drafts: drafts.length,
      draftsWithoutImages: drafts.filter((product) => !product.images.length).map((product) => ({
        slug: product.slug,
        name: product.name,
      })),
      lowStock: lowStock.map((variant) => ({
        sku: variant.sku,
        name: variant.product.name,
        variant: variant.name,
        stock: variant.stock,
      })),
    },
  };
}

export async function getRecommendations() {
  const prisma = await db();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [drafts, lowStock, items, emptyCategories, productsWithoutImages] = await Promise.all([
    prisma.product.findMany({
      where: { status: "DRAFT" },
      include: { images: true, variants: true },
      take: 20,
    }),
    prisma.productVariant.findMany({
      where: { stock: { lte: LOW_STOCK }, product: { status: "ACTIVE" } },
      include: { product: true },
      take: 20,
    }),
    prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: since },
          status: { in: [...PAID_STATUSES] },
        },
      },
      select: { sku: true, name: true, quantity: true, total: true },
    }),
    prisma.category.findMany({
      where: { products: { none: {} } },
      select: { slug: true, name: true },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", images: { none: {} } },
      select: { slug: true, name: true },
      take: 20,
    }),
  ]);

  const sales = new Map<string, { name: string; quantity: number; total: number }>();
  for (const item of items) {
    const current = sales.get(item.sku) ?? { name: item.name, quantity: 0, total: 0 };
    current.quantity += item.quantity;
    current.total += item.total;
    sales.set(item.sku, current);
  }
  const topSellers = [...sales.entries()]
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 5)
    .map(([sku, value]) => ({ sku, ...value }));

  const readyToPublish = drafts
    .filter((product) => product.images.length && product.variants.length)
    .map((product) => ({ slug: product.slug, name: product.name }));

  return {
    generatedAt: new Date().toISOString(),
    publish: readyToPublish,
    restock: lowStock.map((variant) => ({
      sku: variant.sku,
      product: variant.product.name,
      variant: variant.name,
      stock: variant.stock,
    })),
    topSellers,
    missingPhotos: productsWithoutImages,
    emptyCategories,
    incompleteDrafts: drafts
      .filter((product) => !product.images.length || !product.variants.length)
      .map((product) => ({
        slug: product.slug,
        name: product.name,
        missingImages: !product.images.length,
        missingVariants: !product.variants.length,
      })),
  };
}

export function buildDailyBriefing(report: Awaited<ReturnType<typeof getDailyReport>>, recs: Awaited<ReturnType<typeof getRecommendations>>) {
  const lines = [
    `Privé Atelier daily briefing (${report.generatedAt.slice(0, 10)})`,
    `Orders (24h): ${report.orders.count}. Paid revenue: ₪${(report.orders.revenueIls / 100).toFixed(2)}.`,
    `New customers: ${report.customers.new}. Drafts: ${report.catalog.drafts}.`,
  ];
  if (recs.publish.length) {
    lines.push(`Ready to publish: ${recs.publish.map((item) => item.name).join(", ")}.`);
  }
  if (recs.restock.length) {
    lines.push(`Low stock: ${recs.restock.map((item) => `${item.product} ${item.variant} (${item.stock})`).join("; ")}.`);
  }
  if (recs.topSellers.length) {
    lines.push(`Top sellers (7d): ${recs.topSellers.map((item) => item.name).join(", ")}.`);
  }
  if (!recs.publish.length && !recs.restock.length) {
    lines.push("No urgent catalogue actions.");
  }
  return lines.join("\n");
}
