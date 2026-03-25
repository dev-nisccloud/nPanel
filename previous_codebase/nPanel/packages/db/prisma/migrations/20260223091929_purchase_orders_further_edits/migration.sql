-- DropForeignKey
ALTER TABLE "public"."nisc_order_item" DROP CONSTRAINT "nisc_order_item_productPlanId_fkey";

-- AlterTable
ALTER TABLE "nisc_client_subscription" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "nisc_order" ADD COLUMN     "paymentTransactionId" TEXT;

-- AlterTable
ALTER TABLE "nisc_order_item" ADD COLUMN     "description" TEXT,
ALTER COLUMN "productPlanId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payment_transaction" ADD COLUMN     "paidAmount" TEXT;

-- CreateIndex
CREATE INDEX "nisc_order_paymentTransactionId_idx" ON "nisc_order"("paymentTransactionId");

-- AddForeignKey
ALTER TABLE "nisc_order_item" ADD CONSTRAINT "nisc_order_item_productPlanId_fkey" FOREIGN KEY ("productPlanId") REFERENCES "nisc_product_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
