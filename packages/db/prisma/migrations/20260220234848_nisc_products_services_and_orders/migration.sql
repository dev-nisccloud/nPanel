/*
  Warnings:

  - You are about to drop the column `externalRenewalId` on the `nisc_client_subscription_renewal` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceId` on the `nisc_client_subscription_renewal` table. All the data in the column will be lost.
  - You are about to drop the `nisc_commission_entry` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[upgradedToSubscriptionId]` on the table `nisc_client_subscription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[downgradedToSubscriptionId]` on the table `nisc_client_subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NiscPromoDiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NiscClientSubscriptionStatus" ADD VALUE 'UPGRADED';
ALTER TYPE "NiscClientSubscriptionStatus" ADD VALUE 'DOWNGRADED';

-- DropForeignKey
ALTER TABLE "public"."nisc_commission_entry" DROP CONSTRAINT "nisc_commission_entry_productPlanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."nisc_commission_entry" DROP CONSTRAINT "nisc_commission_entry_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."nisc_commission_entry" DROP CONSTRAINT "nisc_commission_entry_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."order" DROP CONSTRAINT "order_teamId_fkey";

-- AlterTable
ALTER TABLE "nisc_client_subscription" ADD COLUMN     "agreedCost" TEXT,
ADD COLUMN     "agreedCostCurrency" TEXT DEFAULT 'KES',
ADD COLUMN     "downgradedAt" TIMESTAMP(3),
ADD COLUMN     "downgradedToSubscriptionId" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "providerCost" TEXT,
ADD COLUMN     "providerCostCurrency" TEXT DEFAULT 'KES',
ADD COLUMN     "upgradedAt" TIMESTAMP(3),
ADD COLUMN     "upgradedToSubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "nisc_client_subscription_renewal" DROP COLUMN "externalRenewalId",
DROP COLUMN "invoiceId",
ADD COLUMN     "providerRenewalCurrency" TEXT DEFAULT 'KES',
ADD COLUMN     "providerRenewalPrice" TEXT;

-- AlterTable
ALTER TABLE "nisc_product" ADD COLUMN     "isAddOn" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "nisc_product_plan" ADD COLUMN     "cost" TEXT,
ADD COLUMN     "costCurrency" TEXT DEFAULT 'KES';

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "niscProductPromoId" TEXT,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "teamId" DROP NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'CUSTOM_SERVICE';

-- DropTable
DROP TABLE "public"."nisc_commission_entry";

-- DropEnum
DROP TYPE "public"."NiscCommissionEntryStatus";

-- CreateTable
CREATE TABLE "nisc_product_add_on" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "baseProductId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nisc_product_add_on_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nisc_product_promo" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "NiscPromoDiscountType" NOT NULL,
    "discountValue" TEXT,
    "discountCurrency" TEXT DEFAULT 'KES',
    "productId" TEXT,
    "productPlanId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minOrderValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nisc_product_promo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nisc_product_promo_redeem" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "teamId" TEXT,
    "orderId" TEXT,
    "subscriptionId" TEXT,
    "renewalId" TEXT,
    "discountApplied" TEXT,
    "orderValue" TEXT,
    "currency" TEXT DEFAULT 'KES',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nisc_product_promo_redeem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nisc_product_add_on_productId_idx" ON "nisc_product_add_on"("productId");

-- CreateIndex
CREATE INDEX "nisc_product_add_on_baseProductId_idx" ON "nisc_product_add_on"("baseProductId");

-- CreateIndex
CREATE UNIQUE INDEX "nisc_product_add_on_productId_baseProductId_key" ON "nisc_product_add_on"("productId", "baseProductId");

-- CreateIndex
CREATE UNIQUE INDEX "nisc_product_promo_code_key" ON "nisc_product_promo"("code");

-- CreateIndex
CREATE INDEX "nisc_product_promo_code_idx" ON "nisc_product_promo"("code");

-- CreateIndex
CREATE INDEX "nisc_product_promo_productId_idx" ON "nisc_product_promo"("productId");

-- CreateIndex
CREATE INDEX "nisc_product_promo_productPlanId_idx" ON "nisc_product_promo"("productPlanId");

-- CreateIndex
CREATE INDEX "nisc_product_promo_isActive_idx" ON "nisc_product_promo"("isActive");

-- CreateIndex
CREATE INDEX "nisc_product_promo_startDate_idx" ON "nisc_product_promo"("startDate");

-- CreateIndex
CREATE INDEX "nisc_product_promo_endDate_idx" ON "nisc_product_promo"("endDate");

-- CreateIndex
CREATE INDEX "nisc_product_promo_redeem_promoId_idx" ON "nisc_product_promo_redeem"("promoId");

-- CreateIndex
CREATE INDEX "nisc_product_promo_redeem_redeemedAt_idx" ON "nisc_product_promo_redeem"("redeemedAt");

-- CreateIndex
CREATE INDEX "nisc_product_promo_redeem_userId_idx" ON "nisc_product_promo_redeem"("userId");

-- CreateIndex
CREATE INDEX "nisc_product_promo_redeem_teamId_idx" ON "nisc_product_promo_redeem"("teamId");

-- CreateIndex
CREATE INDEX "nisc_product_promo_redeem_orderId_idx" ON "nisc_product_promo_redeem"("orderId");

-- CreateIndex
CREATE INDEX "nisc_product_promo_redeem_subscriptionId_idx" ON "nisc_product_promo_redeem"("subscriptionId");

-- CreateIndex
CREATE INDEX "nisc_product_promo_redeem_renewalId_idx" ON "nisc_product_promo_redeem"("renewalId");

-- CreateIndex
CREATE UNIQUE INDEX "nisc_client_subscription_upgradedToSubscriptionId_key" ON "nisc_client_subscription"("upgradedToSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "nisc_client_subscription_downgradedToSubscriptionId_key" ON "nisc_client_subscription"("downgradedToSubscriptionId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_upgradedToSubscriptionId_idx" ON "nisc_client_subscription"("upgradedToSubscriptionId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_downgradedToSubscriptionId_idx" ON "nisc_client_subscription"("downgradedToSubscriptionId");

-- CreateIndex
CREATE INDEX "nisc_product_isAddOn_idx" ON "nisc_product"("isAddOn");

-- CreateIndex
CREATE INDEX "order_niscProductPromoId_idx" ON "order"("niscProductPromoId");

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_niscProductPromoId_fkey" FOREIGN KEY ("niscProductPromoId") REFERENCES "nisc_product_promo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_product_add_on" ADD CONSTRAINT "nisc_product_add_on_productId_fkey" FOREIGN KEY ("productId") REFERENCES "nisc_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_product_add_on" ADD CONSTRAINT "nisc_product_add_on_baseProductId_fkey" FOREIGN KEY ("baseProductId") REFERENCES "nisc_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_client_subscription" ADD CONSTRAINT "nisc_client_subscription_upgradedToSubscriptionId_fkey" FOREIGN KEY ("upgradedToSubscriptionId") REFERENCES "nisc_client_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_client_subscription" ADD CONSTRAINT "nisc_client_subscription_downgradedToSubscriptionId_fkey" FOREIGN KEY ("downgradedToSubscriptionId") REFERENCES "nisc_client_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_product_promo" ADD CONSTRAINT "nisc_product_promo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "nisc_product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_product_promo" ADD CONSTRAINT "nisc_product_promo_productPlanId_fkey" FOREIGN KEY ("productPlanId") REFERENCES "nisc_product_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_product_promo_redeem" ADD CONSTRAINT "nisc_product_promo_redeem_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "nisc_product_promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_product_promo_redeem" ADD CONSTRAINT "nisc_product_promo_redeem_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "nisc_client_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_product_promo_redeem" ADD CONSTRAINT "nisc_product_promo_redeem_renewalId_fkey" FOREIGN KEY ("renewalId") REFERENCES "nisc_client_subscription_renewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
