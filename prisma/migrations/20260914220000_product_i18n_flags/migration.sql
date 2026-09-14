-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "concentration" TEXT,
ADD COLUMN     "descriptionHe" TEXT,
ADD COLUMN     "newArrival" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" JSONB;
