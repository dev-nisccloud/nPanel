-- CreateEnum
CREATE TYPE "NiscProductCategory" AS ENUM ('CLOUD', 'MARKETING', 'CONSULTING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NiscPricingModel" AS ENUM ('FIXED', 'COMMISSION');

-- CreateEnum
CREATE TYPE "NiscClientSubscriptionStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'CANCELLED', 'EXPIRED', 'PROCESSING', 'FAILED');

-- CreateEnum
CREATE TYPE "NiscCommissionEntryStatus" AS ENUM ('DRAFT', 'INVOICED', 'PAID', 'WAIVED');

-- CreateEnum
CREATE TYPE "NiscRenewalType" AS ENUM ('FIXED_BILLING', 'DOMAIN', 'HOSTING');

-- CreateTable
CREATE TABLE "nisc_product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "NiscProductCategory" NOT NULL,
    "serviceType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nisc_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nisc_product_plan" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricingModel" "NiscPricingModel" NOT NULL,
    "billingCycle" "BillingCycle",
    "price" TEXT,
    "currency" TEXT DEFAULT 'KES',
    "setupFee" TEXT,
    "commissionRate" DECIMAL(10,4),
    "commissionBase" TEXT,
    "commissionBaseDescription" TEXT,
    "planFeatures" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "pleskServicePlanId" TEXT,
    "pleskFilterId" TEXT,
    "pleskIpAddress" TEXT,
    "hostingType" "HostingType",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nisc_product_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nisc_client_subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "teamId" TEXT,
    "productId" TEXT NOT NULL,
    "productPlanId" TEXT,
    "orderId" TEXT,
    "subscribedBy" TEXT,
    "recordedBy" TEXT,
    "status" "NiscClientSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "subscriptionDate" TIMESTAMP(3),
    "billingCycle" "BillingCycle",
    "nextRenewalDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "pricingModel" "NiscPricingModel" NOT NULL,
    "agreedPrice" TEXT,
    "agreedCurrency" TEXT DEFAULT 'KES',
    "agreedCommissionRate" DECIMAL(10,4),
    "agreedCommissionBase" TEXT,
    "primaryDomain" TEXT,
    "pleskFilterId" TEXT,
    "pleskOwnerId" TEXT,
    "pleskFtpLogin" TEXT,
    "pleskFtpPassword" TEXT,
    "hostingType" "HostingType",
    "openProviderId" INTEGER,
    "domainAuthCode" TEXT,
    "nameserverGroupId" TEXT,
    "wpInstallationId" INTEGER,
    "serviceRefs" JSONB,
    "hostingSubscriptionId" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nisc_client_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nisc_client_subscription_renewal" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "renewalType" "NiscRenewalType" NOT NULL,
    "renewedBy" TEXT,
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "newExpiryDate" TIMESTAMP(3),
    "newNextRenewalDate" TIMESTAMP(3),
    "billingCycle" "BillingCycle",
    "status" "NiscClientSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "renewalPrice" TEXT,
    "renewalCurrency" TEXT DEFAULT 'KES',
    "externalRenewalId" TEXT,
    "orderId" TEXT,
    "invoiceId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nisc_client_subscription_renewal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nisc_commission_entry" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "productPlanId" TEXT NOT NULL,
    "teamId" TEXT,
    "period" TEXT NOT NULL,
    "baseAmount" DECIMAL(20,4) NOT NULL,
    "baseAmountDescription" TEXT,
    "commissionRate" DECIMAL(10,4) NOT NULL,
    "commissionAmount" DECIMAL(20,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" "NiscCommissionEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "invoiceId" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nisc_commission_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nisc_client_subscription_activity_log" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nisc_client_subscription_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nisc_client_subscription_renewal_activity_log" (
    "id" TEXT NOT NULL,
    "renewalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nisc_client_subscription_renewal_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nisc_product_category_idx" ON "nisc_product"("category");

-- CreateIndex
CREATE INDEX "nisc_product_serviceType_idx" ON "nisc_product"("serviceType");

-- CreateIndex
CREATE INDEX "nisc_product_isActive_idx" ON "nisc_product"("isActive");

-- CreateIndex
CREATE INDEX "nisc_product_plan_productId_idx" ON "nisc_product_plan"("productId");

-- CreateIndex
CREATE INDEX "nisc_product_plan_pricingModel_idx" ON "nisc_product_plan"("pricingModel");

-- CreateIndex
CREATE INDEX "nisc_product_plan_isActive_idx" ON "nisc_product_plan"("isActive");

-- CreateIndex
CREATE INDEX "nisc_product_plan_isDefault_idx" ON "nisc_product_plan"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "nisc_client_subscription_hostingSubscriptionId_key" ON "nisc_client_subscription"("hostingSubscriptionId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_userId_idx" ON "nisc_client_subscription"("userId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_teamId_idx" ON "nisc_client_subscription"("teamId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_productId_idx" ON "nisc_client_subscription"("productId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_productPlanId_idx" ON "nisc_client_subscription"("productPlanId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_status_idx" ON "nisc_client_subscription"("status");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_pricingModel_idx" ON "nisc_client_subscription"("pricingModel");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_pleskFilterId_idx" ON "nisc_client_subscription"("pleskFilterId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_openProviderId_idx" ON "nisc_client_subscription"("openProviderId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_primaryDomain_idx" ON "nisc_client_subscription"("primaryDomain");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_nextRenewalDate_idx" ON "nisc_client_subscription"("nextRenewalDate");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_expiryDate_idx" ON "nisc_client_subscription"("expiryDate");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_subscriptionDate_idx" ON "nisc_client_subscription"("subscriptionDate");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_renewal_subscriptionId_idx" ON "nisc_client_subscription_renewal"("subscriptionId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_renewal_renewalType_idx" ON "nisc_client_subscription_renewal"("renewalType");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_renewal_renewalDate_idx" ON "nisc_client_subscription_renewal"("renewalDate");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_renewal_newExpiryDate_idx" ON "nisc_client_subscription_renewal"("newExpiryDate");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_renewal_status_idx" ON "nisc_client_subscription_renewal"("status");

-- CreateIndex
CREATE INDEX "nisc_commission_entry_subscriptionId_idx" ON "nisc_commission_entry"("subscriptionId");

-- CreateIndex
CREATE INDEX "nisc_commission_entry_productPlanId_idx" ON "nisc_commission_entry"("productPlanId");

-- CreateIndex
CREATE INDEX "nisc_commission_entry_teamId_idx" ON "nisc_commission_entry"("teamId");

-- CreateIndex
CREATE INDEX "nisc_commission_entry_status_idx" ON "nisc_commission_entry"("status");

-- CreateIndex
CREATE INDEX "nisc_commission_entry_period_idx" ON "nisc_commission_entry"("period");

-- CreateIndex
CREATE UNIQUE INDEX "nisc_commission_entry_subscriptionId_period_key" ON "nisc_commission_entry"("subscriptionId", "period");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_activity_log_subscriptionId_idx" ON "nisc_client_subscription_activity_log"("subscriptionId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_activity_log_userId_idx" ON "nisc_client_subscription_activity_log"("userId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_activity_log_action_idx" ON "nisc_client_subscription_activity_log"("action");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_activity_log_createdAt_idx" ON "nisc_client_subscription_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_renewal_activity_log_renewalId_idx" ON "nisc_client_subscription_renewal_activity_log"("renewalId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_renewal_activity_log_userId_idx" ON "nisc_client_subscription_renewal_activity_log"("userId");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_renewal_activity_log_action_idx" ON "nisc_client_subscription_renewal_activity_log"("action");

-- CreateIndex
CREATE INDEX "nisc_client_subscription_renewal_activity_log_createdAt_idx" ON "nisc_client_subscription_renewal_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "nisc_product_plan" ADD CONSTRAINT "nisc_product_plan_productId_fkey" FOREIGN KEY ("productId") REFERENCES "nisc_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_client_subscription" ADD CONSTRAINT "nisc_client_subscription_productId_fkey" FOREIGN KEY ("productId") REFERENCES "nisc_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_client_subscription" ADD CONSTRAINT "nisc_client_subscription_productPlanId_fkey" FOREIGN KEY ("productPlanId") REFERENCES "nisc_product_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_client_subscription" ADD CONSTRAINT "nisc_client_subscription_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_client_subscription" ADD CONSTRAINT "nisc_client_subscription_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_client_subscription_renewal" ADD CONSTRAINT "nisc_client_subscription_renewal_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "nisc_client_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_commission_entry" ADD CONSTRAINT "nisc_commission_entry_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "nisc_client_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_commission_entry" ADD CONSTRAINT "nisc_commission_entry_productPlanId_fkey" FOREIGN KEY ("productPlanId") REFERENCES "nisc_product_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_commission_entry" ADD CONSTRAINT "nisc_commission_entry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_client_subscription_activity_log" ADD CONSTRAINT "nisc_client_subscription_activity_log_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "nisc_client_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nisc_client_subscription_renewal_activity_log" ADD CONSTRAINT "nisc_client_subscription_renewal_activity_log_renewalId_fkey" FOREIGN KEY ("renewalId") REFERENCES "nisc_client_subscription_renewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
