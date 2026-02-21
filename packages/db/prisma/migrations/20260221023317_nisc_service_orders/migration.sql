-- CreateEnum
CREATE TYPE "NiscOrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "NiscOrderItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROVISIONED', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "nisc_client_subscription" ADD COLUMN     "niscOrderId" TEXT;

-- CreateTable
CREATE TABLE "nisc_order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "teamId" TEXT,
    "createdBy" TEXT,
    "status" "NiscOrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" TEXT NOT NULL,
    "total" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "notes" TEXT,
    "metadata" JSONB,
    "niscProductPromoId" TEXT,
    "invoiceId" TEXT,
    "invoiceNumber" TEXT,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "qstashMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nisc_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nisc_order_item" (
    "id" TEXT NOT NULL,
    "niscOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productPlanId" TEXT NOT NULL,
    "billingCycle" "BillingCycle",
    "itemPrice" TEXT NOT NULL,
    "itemSubtotal" TEXT NOT NULL,
    "itemCurrency" TEXT NOT NULL DEFAULT 'KES',
    "status" "NiscOrderItemStatus" NOT NULL DEFAULT 'PENDING',
    "provisioningError" TEXT,
    "niscClientSubscriptionId" TEXT,
    "primaryDomain" TEXT,
    "domainSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nisc_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nisc_order_orderNumber_key" ON "nisc_order"("orderNumber");

-- CreateIndex
CREATE INDEX "nisc_order_userId_idx" ON "nisc_order"("userId");

-- CreateIndex
CREATE INDEX "nisc_order_teamId_idx" ON "nisc_order"("teamId");

-- CreateIndex
CREATE INDEX "nisc_order_status_idx" ON "nisc_order"("status");

-- CreateIndex
CREATE INDEX "nisc_order_createdAt_idx" ON "nisc_order"("createdAt");

-- CreateIndex
CREATE INDEX "nisc_order_qstashMessageId_idx" ON "nisc_order"("qstashMessageId");

-- CreateIndex
CREATE INDEX "nisc_order_item_niscOrderId_idx" ON "nisc_order_item"("niscOrderId");

-- CreateIndex
CREATE INDEX "nisc_order_item_productId_idx" ON "nisc_order_item"("productId");

-- CreateIndex
CREATE INDEX "nisc_order_item_productPlanId_idx" ON "nisc_order_item"("productPlanId");

-- CreateIndex
CREATE INDEX "nisc_order_item_status_idx" ON "nisc_order_item"("status");

-- CreateIndex
CREATE INDEX "nisc_order_item_niscClientSubscriptionId_idx" ON "nisc_order_item"("niscClientSubscriptionId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_orderId_idx" ON "nisc_client_subscription"("orderId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_niscOrderId_idx" ON "nisc_client_subscription"("niscOrderId");

-- AddForeignKey
ALTER TABLE "nisc_order" ADD CONSTRAINT "nisc_order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_order" ADD CONSTRAINT "nisc_order_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_order" ADD CONSTRAINT "nisc_order_niscProductPromoId_fkey" FOREIGN KEY ("niscProductPromoId") REFERENCES "nisc_product_promo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_order" ADD CONSTRAINT "nisc_order_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_order_item" ADD CONSTRAINT "nisc_order_item_niscOrderId_fkey" FOREIGN KEY ("niscOrderId") REFERENCES "nisc_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_order_item" ADD CONSTRAINT "nisc_order_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "nisc_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_order_item" ADD CONSTRAINT "nisc_order_item_productPlanId_fkey" FOREIGN KEY ("productPlanId") REFERENCES "nisc_product_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_order_item" ADD CONSTRAINT "nisc_order_item_niscClientSubscriptionId_fkey" FOREIGN KEY ("niscClientSubscriptionId") REFERENCES "nisc_client_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_order_item" ADD CONSTRAINT "nisc_order_item_domainSubscriptionId_fkey" FOREIGN KEY ("domainSubscriptionId") REFERENCES "nisc_client_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_client_subscription" ADD CONSTRAINT "nisc_client_subscription_niscOrderId_fkey" FOREIGN KEY ("niscOrderId") REFERENCES "nisc_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
