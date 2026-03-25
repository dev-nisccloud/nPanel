-- CreateEnum
CREATE TYPE "NiscUsageOveruse" AS ENUM ('HARD', 'SOFT');

-- CreateTable
CREATE TABLE "nisc_product_plan_usage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productPlanId" TEXT NOT NULL,
    "userId" TEXT,
    "teamId" TEXT,
    "usageKind" TEXT NOT NULL,
    "limitValue" TEXT NOT NULL,
    "overuse" "NiscUsageOveruse" NOT NULL,
    "period" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nisc_product_plan_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nisc_client_subscription_usage" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "usageKind" TEXT NOT NULL,
    "credits" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nisc_client_subscription_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nisc_client_subscription_usage_activity_log" (
    "id" TEXT NOT NULL,
    "subscriptionUsageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nisc_client_subscription_usage_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nisc_product_plan_usage_productId_idx" ON "nisc_product_plan_usage"("productId");

-- CreateIndex
CREATE INDEX "nisc_product_plan_usage_productPlanId_idx" ON "nisc_product_plan_usage"("productPlanId");

-- CreateIndex
CREATE INDEX "nisc_product_plan_usage_usageKind_idx" ON "nisc_product_plan_usage"("usageKind");

-- CreateIndex
CREATE INDEX "nisc_product_plan_usage_userId_idx" ON "nisc_product_plan_usage"("userId");

-- CreateIndex
CREATE INDEX "nisc_product_plan_usage_teamId_idx" ON "nisc_product_plan_usage"("teamId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_usage_subscriptionId_idx" ON "nisc_client_subscription_usage"("subscriptionId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_usage_usageKind_idx" ON "nisc_client_subscription_usage"("usageKind");

-- CreateIndex
CREATE UNIQUE INDEX "nisc_client_subscription_usage_subscriptionId_usageKind_key" ON "nisc_client_subscription_usage"("subscriptionId", "usageKind");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_usage_activity_log_subscriptionUsa_idx" ON "nisc_client_subscription_usage_activity_log"("subscriptionUsageId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_usage_activity_log_userId_idx" ON "nisc_client_subscription_usage_activity_log"("userId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_usage_activity_log_action_idx" ON "nisc_client_subscription_usage_activity_log"("action");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_usage_activity_log_createdAt_idx" ON "nisc_client_subscription_usage_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "nisc_product_plan_usage" ADD CONSTRAINT "nisc_product_plan_usage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "nisc_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_product_plan_usage" ADD CONSTRAINT "nisc_product_plan_usage_productPlanId_fkey" FOREIGN KEY ("productPlanId") REFERENCES "nisc_product_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_client_subscription_usage" ADD CONSTRAINT "nisc_client_subscription_usage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "nisc_client_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_client_subscription_usage_activity_log" ADD CONSTRAINT "nisc_client_subscription_usage_activity_log_subscriptionUs_fkey" FOREIGN KEY ("subscriptionUsageId") REFERENCES "nisc_client_subscription_usage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
