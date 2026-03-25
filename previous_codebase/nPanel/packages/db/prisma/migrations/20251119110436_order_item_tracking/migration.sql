-- CreateEnum
CREATE TYPE "OrderItemStatus" AS ENUM ('PENDING', 'PROVISIONING', 'PROVISIONED', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "order_item" ADD COLUMN     "provisioningError" TEXT,
ADD COLUMN     "status" "OrderItemStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "order_item_status_idx" ON "order_item"("status");
