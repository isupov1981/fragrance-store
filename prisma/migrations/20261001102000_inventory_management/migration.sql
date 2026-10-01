-- CreateEnum
CREATE TYPE "InventoryMovementReason" AS ENUM ('RESERVATION', 'RELEASE', 'RESTOCK', 'CORRECTION');

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "paymentUrl" TEXT,
ADD COLUMN "inventoryReservedAt" TIMESTAMP(3),
ADD COLUMN "inventoryReleasedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "variantId" TEXT,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "InventoryMovementReason" NOT NULL,
    "orderId" TEXT,
    "actorId" TEXT,
    "actorName" TEXT,
    "note" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_reference_key" ON "InventoryMovement"("reference");
CREATE INDEX "InventoryMovement_createdAt_idx" ON "InventoryMovement"("createdAt");
CREATE INDEX "InventoryMovement_sku_createdAt_idx" ON "InventoryMovement"("sku", "createdAt");
CREATE INDEX "InventoryMovement_orderId_idx" ON "InventoryMovement"("orderId");
