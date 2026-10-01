import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
  order: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  product: { findMany: vi.fn() },
  inventoryMovement: { findMany: vi.fn() },
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));

import {
  applyInventoryChanges,
  expireStaleReservations,
  InsufficientStockError,
  InventoryConflictError,
  releaseOrderReservation,
  reserveInventory,
} from "@/lib/inventory/service";

const line = {
  variantId: "variant-1",
  sku: "SKU-1",
  productName: "Product",
  variantName: "1 ml",
  quantity: 2,
};

function reservationTx(stockChanged = 1) {
  return {
    productVariant: { updateMany: vi.fn().mockResolvedValue({ count: stockChanged }) },
    inventoryMovement: { create: vi.fn().mockResolvedValue({}) },
    order: { update: vi.fn().mockResolvedValue({}) },
  };
}

describe("inventory reservations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("atomically decrements stock and records the reservation", async () => {
    const tx = reservationTx();
    await reserveInventory(tx as never, "order-1", [line]);

    expect(tx.productVariant.updateMany).toHaveBeenCalledWith({
      where: { id: "variant-1", stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(tx.inventoryMovement.create).toHaveBeenCalledOnce();
    expect(tx.order.update).toHaveBeenCalledOnce();
  });

  it("rejects a competing reservation when conditional decrement loses", async () => {
    const tx = reservationTx(0);
    await expect(reserveInventory(tx as never, "order-1", [line])).rejects.toBeInstanceOf(
      InsufficientStockError,
    );
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it("does not return an already released reservation twice", async () => {
    const tx = {
      order: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    };
    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(releaseOrderReservation("order-1")).resolves.toBe(false);
    expect(tx.order.updateMany).toHaveBeenCalledOnce();
  });

  it("expires only pending reservations older than 30 minutes", async () => {
    prismaMock.order.findMany.mockResolvedValue([{ id: "old-order" }]);
    const tx = {
      order: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(expireStaleReservations(new Date("2026-10-01T10:00:00Z"))).resolves.toBe(0);
    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PENDING",
          inventoryReservedAt: { lt: new Date("2026-10-01T09:30:00Z") },
        }),
      }),
    );
  });
});

describe("manual inventory changes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an optimistic-lock conflict instead of overwriting stock", async () => {
    const tx = {
      productVariant: {
        findUnique: vi.fn().mockResolvedValue({
          id: "variant-1",
          sku: "SKU-1",
          name: "1 ml",
          stock: 10,
          updatedAt: new Date("2026-10-01T09:00:00Z"),
          product: { name: "Product" },
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      applyInventoryChanges(
        [{
          variantId: "variant-1",
          mode: "set",
          value: 8,
          expectedUpdatedAt: "2026-10-01T09:00:00.000Z",
        }],
        { id: "admin-1", name: "Admin" },
      ),
    ).rejects.toBeInstanceOf(InventoryConflictError);
  });

  it("prevents a manual adjustment from producing negative stock", async () => {
    const tx = {
      productVariant: {
        findUnique: vi.fn().mockResolvedValue({
          id: "variant-1",
          sku: "SKU-1",
          name: "1 ml",
          stock: 1,
          updatedAt: new Date(),
          product: { name: "Product" },
        }),
      },
    };
    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      applyInventoryChanges(
        [{ variantId: "variant-1", mode: "adjust", value: -2 }],
        { id: "admin-1", name: "Admin" },
      ),
    ).rejects.toBeInstanceOf(InsufficientStockError);
  });
});
