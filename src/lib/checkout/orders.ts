import type { CheckoutInput } from "@/lib/checkout/schema";
import type { PricedCart } from "@/lib/checkout/pricing";

export type OrderStatus = "pending" | "paid" | "payment_failed";

export type Order = {
  id: string;
  idempotencyKey: string;
  status: OrderStatus;
  customer: CheckoutInput["customer"];
  cart: PricedCart;
  paymentProvider: "stripe" | "demo";
  paymentReference?: string;
  paymentUrl?: string;
  createdAt: string;
  locale?: "en" | "he";
};

type OrderRegistry = {
  byId: Map<string, Order>;
  byIdempotencyKey: Map<string, string>;
  processedWebhookEvents: Set<string>;
};

const globalOrders = globalThis as typeof globalThis & {
  __commerceOrders?: OrderRegistry;
};

const registry: OrderRegistry = (globalOrders.__commerceOrders ??= {
  byId: new Map(),
  byIdempotencyKey: new Map(),
  processedWebhookEvents: new Set(),
});

function databaseEnabled() {
  return Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("placeholder"));
}

export async function findOrder(id: string) {
  if (databaseEnabled()) {
    const { prisma } = await import("@/lib/db/prisma");
    const record = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (record) return fromDatabase(record);
  }
  return registry.byId.get(id);
}

export async function findOrderByIdempotencyKey(key: string) {
  if (databaseEnabled()) {
    const { prisma } = await import("@/lib/db/prisma");
    const record = await prisma.order.findUnique({
      where: { idempotencyKey: key },
      include: { items: true },
    });
    if (record) return fromDatabase(record);
  }
  const id = registry.byIdempotencyKey.get(key);
  return id ? registry.byId.get(id) : undefined;
}

export async function saveOrder(order: Order) {
  if (databaseEnabled()) {
    const { prisma } = await import("@/lib/db/prisma");
    const customer = await prisma.customer.upsert({
      where: { email: order.customer.email },
      update: {
        name: order.customer.name,
        phone: order.customer.phone,
      },
      create: {
        email: order.customer.email,
        name: order.customer.name,
        phone: order.customer.phone,
      },
    });
    const shipping = await prisma.shippingMethod.findUnique({
      where: { code: order.cart.shippingMethod },
    });
    await prisma.order.create({
      data: {
        id: order.id,
        idempotencyKey: order.idempotencyKey,
        status: toDatabaseStatus(order.status),
        customerId: customer.id,
        email: order.customer.email,
        fullName: order.customer.name,
        phone: order.customer.phone,
        address: {
          line1: order.customer.addressLine1,
          line2: order.customer.addressLine2,
          city: order.customer.city,
          postalCode: order.customer.postalCode,
          country: order.customer.country,
        },
        currency: order.cart.currency.toUpperCase(),
        subtotal: order.cart.subtotal,
        shippingTotal: order.cart.shippingTotal,
        total: order.cart.total,
        shippingMethodId: shipping?.id,
        paymentProvider: order.paymentProvider,
        paymentReference: order.paymentReference,
        items: {
          create: order.cart.lines.map((line) => ({
            productId: line.productId || undefined,
            sku: line.sku,
            name: `${line.productName} — ${line.variantName}`,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            total: line.unitPrice * line.quantity,
          })),
        },
      },
    });
  }
  registry.byId.set(order.id, order);
  registry.byIdempotencyKey.set(order.idempotencyKey, order.id);
  return order;
}

export async function updateOrder(
  id: string,
  update: Partial<Pick<Order, "status" | "paymentReference" | "paymentUrl">>,
) {
  if (databaseEnabled()) {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.order.update({
      where: { id },
      data: {
        status: update.status ? toDatabaseStatus(update.status) : undefined,
        paymentReference: update.paymentReference,
      },
    });
  }
  const order = registry.byId.get(id);
  if (!order) return undefined;
  Object.assign(order, update);
  return order;
}

export async function hasProcessedWebhookEvent(id: string) {
  if (databaseEnabled()) {
    const { prisma } = await import("@/lib/db/prisma");
    return Boolean(await prisma.webhookEvent.findUnique({ where: { id } }));
  }
  return registry.processedWebhookEvents.has(id);
}

export async function markWebhookEventProcessed(id: string) {
  if (databaseEnabled()) {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.webhookEvent.create({ data: { id, provider: "stripe" } });
  }
  registry.processedWebhookEvents.add(id);
}

function toDatabaseStatus(status: OrderStatus) {
  if (status === "paid") return "PAID" as const;
  if (status === "payment_failed") return "CANCELLED" as const;
  return "PENDING" as const;
}

type DatabaseOrder = {
  id: string;
  idempotencyKey: string;
  status: string;
  email: string;
  fullName: string;
  phone: string | null;
  address: unknown;
  currency: string;
  subtotal: number;
  shippingTotal: number;
  total: number;
  paymentProvider: string | null;
  paymentReference: string | null;
  createdAt: Date;
  items: Array<{
    productId: string | null;
    variantId: string | null;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
};

function fromDatabase(record: DatabaseOrder): Order {
  const address = record.address as Record<string, string | undefined>;
  return {
    id: record.id,
    idempotencyKey: record.idempotencyKey,
    status: record.status === "PAID" ? "paid" : record.status === "CANCELLED" ? "payment_failed" : "pending",
    customer: {
      email: record.email,
      name: record.fullName,
      phone: record.phone ?? undefined,
      addressLine1: address.line1 ?? "",
      addressLine2: address.line2,
      city: address.city ?? "",
      postalCode: address.postalCode ?? "",
      country: address.country ?? "",
    },
    cart: {
      lines: record.items.map((item) => {
        const [productName, variantName = "Default"] = item.name.split(" — ");
        return {
          productId: item.productId ?? "",
          variantId: item.variantId ?? "",
          productName,
          variantName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        };
      }),
      subtotal: record.subtotal,
      shippingTotal: record.shippingTotal,
      total: record.total,
      currency: record.currency.toLowerCase() as PricedCart["currency"],
      shippingMethod: "standard",
    },
    paymentProvider: record.paymentProvider === "stripe" ? "stripe" : "demo",
    paymentReference: record.paymentReference ?? undefined,
    createdAt: record.createdAt.toISOString(),
  };
}
