import { Prisma, type InventoryMovementReason, type OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { revalidateStoreCatalog } from "@/lib/db/store-cache";

export const LOW_STOCK_THRESHOLD = 5;
export const RESERVATION_MINUTES = 30;

export class InventoryConflictError extends Error {}
export class InsufficientStockError extends Error {}

export type ReservationLine = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  quantity: number;
};

export type InventoryActor = {
  id: string;
  name: string;
};

export type InventoryChange = {
  variantId: string;
  mode: "set" | "adjust";
  value: number;
  expectedUpdatedAt?: string;
};

function movementData(
  line: ReservationLine,
  orderId: string,
  delta: number,
  reason: InventoryMovementReason,
) {
  return {
    variantId: line.variantId,
    sku: line.sku,
    productName: line.productName,
    variantName: line.variantName,
    delta,
    reason,
    orderId,
    reference: `${reason.toLowerCase()}:${orderId}:${line.variantId}`,
  };
}

export async function reserveInventory(
  tx: Prisma.TransactionClient,
  orderId: string,
  lines: ReservationLine[],
  reservedAt = new Date(),
) {
  for (const line of lines) {
    const changed = await tx.productVariant.updateMany({
      where: { id: line.variantId, stock: { gte: line.quantity } },
      data: { stock: { decrement: line.quantity } },
    });
    if (changed.count !== 1) {
      throw new InsufficientStockError(
        `${line.productName} (${line.variantName}) no longer has enough stock`,
      );
    }
    await tx.inventoryMovement.create({
      data: movementData(line, orderId, -line.quantity, "RESERVATION"),
    });
  }

  await tx.order.update({
    where: { id: orderId },
    data: { inventoryReservedAt: reservedAt, inventoryReleasedAt: null },
  });
}

export async function releaseOrderReservation(
  orderId: string,
  options: {
    status?: OrderStatus;
    note?: string;
  } = {},
) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: {
        id: orderId,
        inventoryReservedAt: { not: null },
        inventoryReleasedAt: null,
      },
      data: {
        inventoryReleasedAt: new Date(),
        status: options.status,
      },
    });
    if (claimed.count !== 1) return false;

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new InventoryConflictError("Order disappeared while releasing stock");

    for (const item of order.items) {
      const variant = item.variantId
        ? await tx.productVariant.findUnique({
            where: { id: item.variantId },
            include: { product: true },
          })
        : null;
      const fallback = variant
        ? null
        : await tx.productVariant.findUnique({
            where: { sku: item.sku },
            include: { product: true },
          });
      const target = variant ?? fallback;
      if (!target) {
        throw new InventoryConflictError(`Cannot return stock for missing SKU ${item.sku}`);
      }
      await tx.productVariant.update({
        where: { id: target.id },
        data: { stock: { increment: item.quantity } },
      });
      const [productName, variantName = target.name] = item.name.split(" — ");
      await tx.inventoryMovement.create({
        data: {
          variantId: target.id,
          sku: target.sku,
          productName: productName || target.product.name,
          variantName,
          delta: item.quantity,
          reason: "RELEASE",
          orderId,
          note: options.note,
          reference: `release:${orderId}:${target.id}`,
        },
      });
    }
    return true;
  });
}

export async function expireStaleReservations(now = new Date()) {
  const cutoff = new Date(now.getTime() - RESERVATION_MINUTES * 60_000);
  const stale = await prisma.order.findMany({
    where: {
      status: "PENDING",
      inventoryReservedAt: { lt: cutoff },
      inventoryReleasedAt: null,
    },
    select: { id: true },
    take: 100,
  });
  let released = 0;
  for (const order of stale) {
    if (
      await releaseOrderReservation(order.id, {
        status: "CANCELLED",
        note: "Payment reservation expired",
      })
    ) {
      released += 1;
    }
  }
  return released;
}

export async function applyInventoryChanges(
  changes: InventoryChange[],
  actor: InventoryActor,
  note?: string,
) {
  const updated = await prisma.$transaction(async (tx) => {
    const saved = [];
    for (const change of changes) {
      const before = await tx.productVariant.findUnique({
        where: { id: change.variantId },
        include: { product: true },
      });
      if (!before) throw new InventoryConflictError("Variant no longer exists");

      let nextStock: number;
      if (change.mode === "set") {
        nextStock = change.value;
        const expected = change.expectedUpdatedAt
          ? new Date(change.expectedUpdatedAt)
          : before.updatedAt;
        const result = await tx.productVariant.updateMany({
          where: { id: before.id, updatedAt: expected },
          data: { stock: nextStock },
        });
        if (result.count !== 1) {
          throw new InventoryConflictError(`${before.sku} was changed by another operation`);
        }
      } else {
        nextStock = before.stock + change.value;
        if (nextStock < 0) {
          throw new InsufficientStockError(`${before.sku} cannot have negative stock`);
        }
        const result = await tx.productVariant.updateMany({
          where: {
            id: before.id,
            ...(change.value < 0 ? { stock: { gte: -change.value } } : {}),
          },
          data: { stock: { increment: change.value } },
        });
        if (result.count !== 1) {
          throw new InventoryConflictError(`${before.sku} changed while saving`);
        }
      }

      const delta = nextStock - before.stock;
      const variant = await tx.productVariant.findUniqueOrThrow({
        where: { id: before.id },
      });
      if (delta !== 0) {
        await tx.inventoryMovement.create({
          data: {
            variantId: before.id,
            sku: before.sku,
            productName: before.product.name,
            variantName: before.name,
            delta,
            reason: change.mode === "set" ? "CORRECTION" : "RESTOCK",
            actorId: actor.id,
            actorName: actor.name,
            note,
          },
        });
      }
      saved.push(variant);
    }
    return saved;
  });
  revalidateStoreCatalog();
  return updated;
}

export async function getInventoryOverview() {
  const [products, movements, activeReservations] = await Promise.all([
    prisma.product.findMany({
      include: { variants: { orderBy: { price: "asc" } }, brand: true },
      orderBy: [{ name: "asc" }],
    }),
    prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.order.count({
      where: {
        status: "PENDING",
        inventoryReservedAt: { not: null },
        inventoryReleasedAt: null,
      },
    }),
  ]);

  const variants = products.flatMap((product) =>
    product.variants.map((variant) => ({
      id: variant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productStatus: product.status,
      brand: product.brand?.name ?? "",
      name: variant.name,
      sku: variant.sku,
      stock: variant.stock,
      updatedAt: variant.updatedAt.toISOString(),
    })),
  );

  return {
    variants,
    movements: movements.map((movement) => ({
      ...movement,
      createdAt: movement.createdAt.toISOString(),
    })),
    summary: {
      totalUnits: variants.reduce((sum, variant) => sum + variant.stock, 0),
      lowStock: variants.filter(
        (variant) => variant.stock > 0 && variant.stock <= LOW_STOCK_THRESHOLD,
      ).length,
      outOfStock: variants.filter((variant) => variant.stock === 0).length,
      activeReservations,
    },
  };
}
