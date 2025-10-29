/*
  Warnings:

  - You are about to drop the `cloud_services` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('YEARLY', 'MONTHLY', 'BIENNIALLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "HostingStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED', 'PENDING', 'PROCESSING', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "HostingType" AS ENUM ('WEB_HOSTING', 'EMAIL_HOSTING', 'RESELLER_HOSTING', 'VPS_HOSTING', 'DEDICATED_HOSTING');

-- CreateEnum
CREATE TYPE "HostingOperation" AS ENUM ('PROVISION', 'RENEWAL', 'UPGRADE', 'DOWNGRADE', 'SUSPEND', 'UNSUSPEND', 'TERMINATE');

-- CreateEnum
CREATE TYPE "ProvisioningMethod" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "PromoType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "PromoScope" AS ENUM ('PUBLIC', 'USER_SPECIFIC');

-- CreateEnum
CREATE TYPE "PromoTarget" AS ENUM ('HOSTING_PLAN', 'DOMAIN_REGISTRATION', 'DOMAIN_RENEWAL', 'DOMAIN_TRANSFER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DOMAIN_REGISTRATION', 'DOMAIN_RENEWAL', 'DOMAIN_TRANSFER', 'HOSTING_SUBSCRIPTION', 'HOSTING_RENEWAL', 'HOSTING_UPGRADE', 'EMAIL_HOSTING', 'SSL_CERTIFICATE', 'BACKUP_SERVICE', 'CUSTOM_SERVICE');

-- CreateEnum
CREATE TYPE "CustomerPlatform" AS ENUM ('PLESK', 'OPENPROVIDER');

-- CreateEnum
CREATE TYPE "MarginType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('ACTIVE', 'PENDING', 'INACTIVE', 'PROCESSING', 'EXPIRED', 'TRANSFERRING', 'REQUESTED', 'FAILED', 'PENDING_TRANSFER', 'CLIENT_TRANSFER_PROHIBITED');

-- CreateEnum
CREATE TYPE "DomainCycle" AS ENUM ('ANNUAL', 'BIENNIALLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DomainOperation" AS ENUM ('REGISTRATION', 'RENEWAL', 'TRANSFER', 'RESTORATION');

-- DropForeignKey
ALTER TABLE "public"."cloud_services" DROP CONSTRAINT "cloud_services_teamId_fkey";

-- AlterTable
ALTER TABLE "team" ALTER COLUMN "baseCurrency" SET DEFAULT 'KES';

-- DropTable
DROP TABLE "public"."cloud_services";

-- CreateTable
CREATE TABLE "customer_integration" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "CustomerPlatform" NOT NULL,
    "platformCustomerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCreated" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "platformData" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_integration_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "wordpress_instance" (
    "_id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "hostingSubscriptionId" TEXT,
    "installationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wordpress_instance_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "order" (
    "_id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdBy" TEXT,
    "type" "OrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "domainRegistrationId" TEXT,
    "domainRenewalId" TEXT,
    "domainTransferId" TEXT,
    "hostingSubscriptionId" TEXT,
    "hostingRenewalId" TEXT,
    "subtotal" TEXT,
    "discount" TEXT,
    "total" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "promoCode" TEXT,
    "promoId" TEXT,
    "invoiceNumber" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "promo" (
    "_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "PromoType" NOT NULL,
    "scope" "PromoScope" NOT NULL,
    "target" "PromoTarget" NOT NULL,
    "discountValue" TEXT NOT NULL,
    "currency" TEXT DEFAULT 'KES',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "minOrderValue" TEXT,
    "hostingPlanId" TEXT,
    "userId" TEXT,
    "teamId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "hosting_plan" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hostingType" "HostingType" NOT NULL,
    "pleskServicePlanId" TEXT,
    "pleskFilterId" TEXT,
    "pleskIpAddress" TEXT,
    "features" TEXT[],
    "highlights" TEXT[],
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "niscPrice" TEXT,
    "niscCurrency" TEXT DEFAULT 'KES',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "setupFee" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hosting_plan_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "hosting_subscription" (
    "_id" TEXT NOT NULL,
    "hostingPlanId" TEXT NOT NULL,
    "teamId" TEXT,
    "provisionedBy" TEXT,
    "pleskFilterId" TEXT NOT NULL,
    "pleskOwnerId" TEXT,
    "pleskServiceId" TEXT,
    "pleskName" TEXT,
    "pleskStatus" INTEGER,
    "pleskDescription" TEXT,
    "pleskAdminDescription" TEXT,
    "pleskFtpLogin" TEXT,
    "pleskFtpPassword" TEXT,
    "primaryDomain" TEXT,
    "domainRegistrationId" TEXT,
    "operation" "HostingOperation" NOT NULL DEFAULT 'PROVISION',
    "provisioningMethod" "ProvisioningMethod" NOT NULL DEFAULT 'AUTOMATIC',
    "status" "HostingStatus" NOT NULL DEFAULT 'PENDING',
    "hostingType" "HostingType" NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "nextRenewalDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "niscPrice" TEXT,
    "niscCurrency" TEXT DEFAULT 'KES',
    "invoiceNumber" TEXT,
    "customerIntegrationId" TEXT,
    "notes" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hosting_subscription_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "hosting_renewal" (
    "_id" TEXT NOT NULL,
    "hostingSubscriptionId" TEXT NOT NULL,
    "renewedBy" TEXT,
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "status" "HostingStatus" NOT NULL DEFAULT 'ACTIVE',
    "niscPrice" TEXT,
    "niscCurrency" TEXT DEFAULT 'KES',
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hosting_renewal_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "hosting_plan_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hostingPlanId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hosting_plan_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "hosting_subscription_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hostingSubscriptionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hosting_subscription_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "hosting_renewal_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hostingRenewalId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hosting_renewal_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "promo_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "order_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "customer_integration_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerIntegrationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_integration_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "wordpress_instance_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordpressInstanceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wordpress_instance_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "nameserver_group" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "nameservers" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nameserver_group_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "TldSettings" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nameserverGroupId" TEXT,
    "marginType" "MarginType",
    "profitMargin" TEXT,
    "costMargin" TEXT,
    "roundOff" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "TldSettings_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "tld_settings_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tldSettingId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tld_settings_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "nameserver_group_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nameserverGroupId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nameserver_group_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "domain_registration" (
    "_id" TEXT NOT NULL,
    "domainName" TEXT NOT NULL,
    "teamId" TEXT,
    "registeredBy" TEXT,
    "openProviderId" INTEGER,
    "operation" "DomainOperation" NOT NULL DEFAULT 'REGISTRATION',
    "authCode" TEXT,
    "activationDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "ownerHandle" TEXT,
    "adminHandle" TEXT,
    "techHandle" TEXT,
    "billingHandle" TEXT,
    "resellerHandle" TEXT,
    "registrationDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "nextRenewalDate" TIMESTAMP(3),
    "renewalCycle" "DomainCycle" NOT NULL DEFAULT 'ANNUAL',
    "period" INTEGER,
    "status" "DomainStatus" NOT NULL DEFAULT 'PENDING',
    "openProviderPrice" TEXT,
    "openProviderCurrency" TEXT DEFAULT 'USD',
    "niscPrice" TEXT,
    "niscCurrency" TEXT DEFAULT 'KES',
    "invoiceNumber" TEXT,
    "customerIntegrationId" TEXT,
    "tldSettingId" TEXT,
    "nameservers" TEXT[],
    "dnsRecords" JSONB,
    "autoRenew" TEXT,
    "transferRequestedAt" TIMESTAMP(3),
    "transferCompletedAt" TIMESTAMP(3),
    "previousRegistrar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_registration_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "domain_renewal" (
    "_id" TEXT NOT NULL,
    "domainRegistrationId" TEXT NOT NULL,
    "renewedBy" TEXT,
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "renewalCycle" "DomainCycle" NOT NULL,
    "status" "DomainStatus" NOT NULL DEFAULT 'ACTIVE',
    "openProviderPrice" TEXT NOT NULL,
    "openProviderCurrency" TEXT NOT NULL DEFAULT 'USD',
    "niscPrice" TEXT NOT NULL,
    "niscCurrency" TEXT NOT NULL DEFAULT 'KES',
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_renewal_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "domain_transfer" (
    "_id" TEXT NOT NULL,
    "domainRegistrationId" TEXT NOT NULL,
    "transferredBy" TEXT,
    "authCode" TEXT NOT NULL,
    "status" "DomainStatus" NOT NULL DEFAULT 'PENDING_TRANSFER',
    "transferRequestedAt" TIMESTAMP(3) NOT NULL,
    "transferCompletedAt" TIMESTAMP(3),
    "previousRegistrar" TEXT,
    "previousExpiryDate" TIMESTAMP(3),
    "ownerHandle" TEXT,
    "adminHandle" TEXT,
    "techHandle" TEXT,
    "billingHandle" TEXT,
    "nameservers" TEXT[],
    "autoRenew" TEXT,
    "openProviderPrice" TEXT,
    "openProviderCurrency" TEXT DEFAULT 'USD',
    "niscPrice" TEXT,
    "niscCurrency" TEXT DEFAULT 'KES',
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_transfer_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "domain_registration_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainRegistrationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_registration_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "domain_renewal_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainRenewalId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_renewal_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "domain_transfer_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainTransferId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_transfer_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "customer_integration_userId_idx" ON "customer_integration"("userId");

-- CreateIndex
CREATE INDEX "customer_integration_platform_idx" ON "customer_integration"("platform");

-- CreateIndex
CREATE INDEX "customer_integration_platformCustomerId_idx" ON "customer_integration"("platformCustomerId");

-- CreateIndex
CREATE INDEX "customer_integration_isActive_idx" ON "customer_integration"("isActive");

-- CreateIndex
CREATE INDEX "customer_integration_isCreated_idx" ON "customer_integration"("isCreated");

-- CreateIndex
CREATE UNIQUE INDEX "customer_integration_userId_platform_key" ON "customer_integration"("userId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "wordpress_instance_installationId_key" ON "wordpress_instance"("installationId");

-- CreateIndex
CREATE INDEX "wordpress_instance_teamId_idx" ON "wordpress_instance"("teamId");

-- CreateIndex
CREATE INDEX "wordpress_instance_installationId_idx" ON "wordpress_instance"("installationId");

-- CreateIndex
CREATE UNIQUE INDEX "order_orderNumber_key" ON "order"("orderNumber");

-- CreateIndex
CREATE INDEX "order_orderNumber_idx" ON "order"("orderNumber");

-- CreateIndex
CREATE INDEX "order_teamId_idx" ON "order"("teamId");

-- CreateIndex
CREATE INDEX "order_type_idx" ON "order"("type");

-- CreateIndex
CREATE INDEX "order_status_idx" ON "order"("status");

-- CreateIndex
CREATE INDEX "order_createdAt_idx" ON "order"("createdAt");

-- CreateIndex
CREATE INDEX "order_processedAt_idx" ON "order"("processedAt");

-- CreateIndex
CREATE INDEX "order_completedAt_idx" ON "order"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "promo_code_key" ON "promo"("code");

-- CreateIndex
CREATE INDEX "promo_code_idx" ON "promo"("code");

-- CreateIndex
CREATE INDEX "promo_target_idx" ON "promo"("target");

-- CreateIndex
CREATE INDEX "promo_scope_idx" ON "promo"("scope");

-- CreateIndex
CREATE INDEX "promo_isActive_idx" ON "promo"("isActive");

-- CreateIndex
CREATE INDEX "promo_startDate_idx" ON "promo"("startDate");

-- CreateIndex
CREATE INDEX "promo_endDate_idx" ON "promo"("endDate");

-- CreateIndex
CREATE INDEX "promo_hostingPlanId_idx" ON "promo"("hostingPlanId");

-- CreateIndex
CREATE INDEX "promo_userId_idx" ON "promo"("userId");

-- CreateIndex
CREATE INDEX "hosting_plan_hostingType_idx" ON "hosting_plan"("hostingType");

-- CreateIndex
CREATE INDEX "hosting_plan_isActive_idx" ON "hosting_plan"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "hosting_subscription_pleskFilterId_key" ON "hosting_subscription"("pleskFilterId");

-- CreateIndex
CREATE INDEX "hosting_subscription_hostingPlanId_idx" ON "hosting_subscription"("hostingPlanId");

-- CreateIndex
CREATE INDEX "hosting_subscription_teamId_idx" ON "hosting_subscription"("teamId");

-- CreateIndex
CREATE INDEX "hosting_subscription_pleskFilterId_idx" ON "hosting_subscription"("pleskFilterId");

-- CreateIndex
CREATE INDEX "hosting_subscription_status_idx" ON "hosting_subscription"("status");

-- CreateIndex
CREATE INDEX "hosting_subscription_nextRenewalDate_idx" ON "hosting_subscription"("nextRenewalDate");

-- CreateIndex
CREATE INDEX "hosting_subscription_expiryDate_idx" ON "hosting_subscription"("expiryDate");

-- CreateIndex
CREATE INDEX "hosting_subscription_primaryDomain_idx" ON "hosting_subscription"("primaryDomain");

-- CreateIndex
CREATE INDEX "hosting_renewal_hostingSubscriptionId_idx" ON "hosting_renewal"("hostingSubscriptionId");

-- CreateIndex
CREATE INDEX "hosting_renewal_renewalDate_idx" ON "hosting_renewal"("renewalDate");

-- CreateIndex
CREATE INDEX "hosting_renewal_expiryDate_idx" ON "hosting_renewal"("expiryDate");

-- CreateIndex
CREATE INDEX "hosting_renewal_renewedBy_idx" ON "hosting_renewal"("renewedBy");

-- CreateIndex
CREATE INDEX "hosting_plan_activity_log_userId_idx" ON "hosting_plan_activity_log"("userId");

-- CreateIndex
CREATE INDEX "hosting_plan_activity_log_hostingPlanId_idx" ON "hosting_plan_activity_log"("hostingPlanId");

-- CreateIndex
CREATE INDEX "hosting_plan_activity_log_action_idx" ON "hosting_plan_activity_log"("action");

-- CreateIndex
CREATE INDEX "hosting_plan_activity_log_createdAt_idx" ON "hosting_plan_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "hosting_subscription_activity_log_userId_idx" ON "hosting_subscription_activity_log"("userId");

-- CreateIndex
CREATE INDEX "hosting_subscription_activity_log_hostingSubscriptionId_idx" ON "hosting_subscription_activity_log"("hostingSubscriptionId");

-- CreateIndex
CREATE INDEX "hosting_subscription_activity_log_action_idx" ON "hosting_subscription_activity_log"("action");

-- CreateIndex
CREATE INDEX "hosting_subscription_activity_log_createdAt_idx" ON "hosting_subscription_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "hosting_renewal_activity_log_userId_idx" ON "hosting_renewal_activity_log"("userId");

-- CreateIndex
CREATE INDEX "hosting_renewal_activity_log_hostingRenewalId_idx" ON "hosting_renewal_activity_log"("hostingRenewalId");

-- CreateIndex
CREATE INDEX "hosting_renewal_activity_log_action_idx" ON "hosting_renewal_activity_log"("action");

-- CreateIndex
CREATE INDEX "hosting_renewal_activity_log_createdAt_idx" ON "hosting_renewal_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "promo_activity_log_userId_idx" ON "promo_activity_log"("userId");

-- CreateIndex
CREATE INDEX "promo_activity_log_promoId_idx" ON "promo_activity_log"("promoId");

-- CreateIndex
CREATE INDEX "promo_activity_log_action_idx" ON "promo_activity_log"("action");

-- CreateIndex
CREATE INDEX "promo_activity_log_createdAt_idx" ON "promo_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "order_activity_log_userId_idx" ON "order_activity_log"("userId");

-- CreateIndex
CREATE INDEX "order_activity_log_orderId_idx" ON "order_activity_log"("orderId");

-- CreateIndex
CREATE INDEX "order_activity_log_action_idx" ON "order_activity_log"("action");

-- CreateIndex
CREATE INDEX "order_activity_log_createdAt_idx" ON "order_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "customer_integration_activity_log_userId_idx" ON "customer_integration_activity_log"("userId");

-- CreateIndex
CREATE INDEX "customer_integration_activity_log_customerIntegrationId_idx" ON "customer_integration_activity_log"("customerIntegrationId");

-- CreateIndex
CREATE INDEX "customer_integration_activity_log_action_idx" ON "customer_integration_activity_log"("action");

-- CreateIndex
CREATE INDEX "customer_integration_activity_log_createdAt_idx" ON "customer_integration_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "wordpress_instance_activity_log_userId_idx" ON "wordpress_instance_activity_log"("userId");

-- CreateIndex
CREATE INDEX "wordpress_instance_activity_log_wordpressInstanceId_idx" ON "wordpress_instance_activity_log"("wordpressInstanceId");

-- CreateIndex
CREATE INDEX "wordpress_instance_activity_log_action_idx" ON "wordpress_instance_activity_log"("action");

-- CreateIndex
CREATE INDEX "wordpress_instance_activity_log_createdAt_idx" ON "wordpress_instance_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "nameserver_group_userId_idx" ON "nameserver_group"("userId");

-- CreateIndex
CREATE INDEX "nameserver_group_isDefault_idx" ON "nameserver_group"("isDefault");

-- CreateIndex
CREATE INDEX "tld_settings_activity_log_userId_idx" ON "tld_settings_activity_log"("userId");

-- CreateIndex
CREATE INDEX "tld_settings_activity_log_tldSettingId_idx" ON "tld_settings_activity_log"("tldSettingId");

-- CreateIndex
CREATE INDEX "tld_settings_activity_log_action_idx" ON "tld_settings_activity_log"("action");

-- CreateIndex
CREATE INDEX "tld_settings_activity_log_createdAt_idx" ON "tld_settings_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "nameserver_group_activity_log_userId_idx" ON "nameserver_group_activity_log"("userId");

-- CreateIndex
CREATE INDEX "nameserver_group_activity_log_nameserverGroupId_idx" ON "nameserver_group_activity_log"("nameserverGroupId");

-- CreateIndex
CREATE INDEX "nameserver_group_activity_log_action_idx" ON "nameserver_group_activity_log"("action");

-- CreateIndex
CREATE INDEX "nameserver_group_activity_log_createdAt_idx" ON "nameserver_group_activity_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "domain_registration_domainName_key" ON "domain_registration"("domainName");

-- CreateIndex
CREATE INDEX "domain_registration_domainName_idx" ON "domain_registration"("domainName");

-- CreateIndex
CREATE INDEX "domain_registration_teamId_idx" ON "domain_registration"("teamId");

-- CreateIndex
CREATE INDEX "domain_registration_status_idx" ON "domain_registration"("status");

-- CreateIndex
CREATE INDEX "domain_registration_expiryDate_idx" ON "domain_registration"("expiryDate");

-- CreateIndex
CREATE INDEX "domain_registration_nextRenewalDate_idx" ON "domain_registration"("nextRenewalDate");

-- CreateIndex
CREATE INDEX "domain_registration_registeredBy_idx" ON "domain_registration"("registeredBy");

-- CreateIndex
CREATE INDEX "domain_registration_openProviderId_idx" ON "domain_registration"("openProviderId");

-- CreateIndex
CREATE INDEX "domain_registration_operation_idx" ON "domain_registration"("operation");

-- CreateIndex
CREATE INDEX "domain_renewal_domainRegistrationId_idx" ON "domain_renewal"("domainRegistrationId");

-- CreateIndex
CREATE INDEX "domain_renewal_renewalDate_idx" ON "domain_renewal"("renewalDate");

-- CreateIndex
CREATE INDEX "domain_renewal_expiryDate_idx" ON "domain_renewal"("expiryDate");

-- CreateIndex
CREATE INDEX "domain_renewal_renewedBy_idx" ON "domain_renewal"("renewedBy");

-- CreateIndex
CREATE INDEX "domain_transfer_domainRegistrationId_idx" ON "domain_transfer"("domainRegistrationId");

-- CreateIndex
CREATE INDEX "domain_transfer_status_idx" ON "domain_transfer"("status");

-- CreateIndex
CREATE INDEX "domain_transfer_transferRequestedAt_idx" ON "domain_transfer"("transferRequestedAt");

-- CreateIndex
CREATE INDEX "domain_transfer_transferredBy_idx" ON "domain_transfer"("transferredBy");

-- CreateIndex
CREATE INDEX "domain_registration_activity_log_userId_idx" ON "domain_registration_activity_log"("userId");

-- CreateIndex
CREATE INDEX "domain_registration_activity_log_domainRegistrationId_idx" ON "domain_registration_activity_log"("domainRegistrationId");

-- CreateIndex
CREATE INDEX "domain_registration_activity_log_action_idx" ON "domain_registration_activity_log"("action");

-- CreateIndex
CREATE INDEX "domain_registration_activity_log_createdAt_idx" ON "domain_registration_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "domain_renewal_activity_log_userId_idx" ON "domain_renewal_activity_log"("userId");

-- CreateIndex
CREATE INDEX "domain_renewal_activity_log_domainRenewalId_idx" ON "domain_renewal_activity_log"("domainRenewalId");

-- CreateIndex
CREATE INDEX "domain_renewal_activity_log_action_idx" ON "domain_renewal_activity_log"("action");

-- CreateIndex
CREATE INDEX "domain_renewal_activity_log_createdAt_idx" ON "domain_renewal_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "domain_transfer_activity_log_userId_idx" ON "domain_transfer_activity_log"("userId");

-- CreateIndex
CREATE INDEX "domain_transfer_activity_log_domainTransferId_idx" ON "domain_transfer_activity_log"("domainTransferId");

-- CreateIndex
CREATE INDEX "domain_transfer_activity_log_action_idx" ON "domain_transfer_activity_log"("action");

-- CreateIndex
CREATE INDEX "domain_transfer_activity_log_createdAt_idx" ON "domain_transfer_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "customer_integration" ADD CONSTRAINT "customer_integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordpress_instance" ADD CONSTRAINT "wordpress_instance_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordpress_instance" ADD CONSTRAINT "wordpress_instance_hostingSubscriptionId_fkey" FOREIGN KEY ("hostingSubscriptionId") REFERENCES "hosting_subscription"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_domainRegistrationId_fkey" FOREIGN KEY ("domainRegistrationId") REFERENCES "domain_registration"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_domainRenewalId_fkey" FOREIGN KEY ("domainRenewalId") REFERENCES "domain_renewal"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_domainTransferId_fkey" FOREIGN KEY ("domainTransferId") REFERENCES "domain_transfer"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_hostingSubscriptionId_fkey" FOREIGN KEY ("hostingSubscriptionId") REFERENCES "hosting_subscription"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_hostingRenewalId_fkey" FOREIGN KEY ("hostingRenewalId") REFERENCES "hosting_renewal"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "promo"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo" ADD CONSTRAINT "promo_hostingPlanId_fkey" FOREIGN KEY ("hostingPlanId") REFERENCES "hosting_plan"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo" ADD CONSTRAINT "promo_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosting_subscription" ADD CONSTRAINT "hosting_subscription_hostingPlanId_fkey" FOREIGN KEY ("hostingPlanId") REFERENCES "hosting_plan"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosting_subscription" ADD CONSTRAINT "hosting_subscription_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosting_subscription" ADD CONSTRAINT "hosting_subscription_domainRegistrationId_fkey" FOREIGN KEY ("domainRegistrationId") REFERENCES "domain_registration"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosting_subscription" ADD CONSTRAINT "hosting_subscription_customerIntegrationId_fkey" FOREIGN KEY ("customerIntegrationId") REFERENCES "customer_integration"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosting_renewal" ADD CONSTRAINT "hosting_renewal_hostingSubscriptionId_fkey" FOREIGN KEY ("hostingSubscriptionId") REFERENCES "hosting_subscription"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosting_plan_activity_log" ADD CONSTRAINT "hosting_plan_activity_log_hostingPlanId_fkey" FOREIGN KEY ("hostingPlanId") REFERENCES "hosting_plan"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosting_subscription_activity_log" ADD CONSTRAINT "hosting_subscription_activity_log_hostingSubscriptionId_fkey" FOREIGN KEY ("hostingSubscriptionId") REFERENCES "hosting_subscription"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosting_renewal_activity_log" ADD CONSTRAINT "hosting_renewal_activity_log_hostingRenewalId_fkey" FOREIGN KEY ("hostingRenewalId") REFERENCES "hosting_renewal"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_activity_log" ADD CONSTRAINT "promo_activity_log_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "promo"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_activity_log" ADD CONSTRAINT "order_activity_log_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_integration_activity_log" ADD CONSTRAINT "customer_integration_activity_log_customerIntegrationId_fkey" FOREIGN KEY ("customerIntegrationId") REFERENCES "customer_integration"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordpress_instance_activity_log" ADD CONSTRAINT "wordpress_instance_activity_log_wordpressInstanceId_fkey" FOREIGN KEY ("wordpressInstanceId") REFERENCES "wordpress_instance"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TldSettings" ADD CONSTRAINT "TldSettings_nameserverGroupId_fkey" FOREIGN KEY ("nameserverGroupId") REFERENCES "nameserver_group"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tld_settings_activity_log" ADD CONSTRAINT "tld_settings_activity_log_tldSettingId_fkey" FOREIGN KEY ("tldSettingId") REFERENCES "TldSettings"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nameserver_group_activity_log" ADD CONSTRAINT "nameserver_group_activity_log_nameserverGroupId_fkey" FOREIGN KEY ("nameserverGroupId") REFERENCES "nameserver_group"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_registration" ADD CONSTRAINT "domain_registration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_registration" ADD CONSTRAINT "domain_registration_customerIntegrationId_fkey" FOREIGN KEY ("customerIntegrationId") REFERENCES "customer_integration"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_renewal" ADD CONSTRAINT "domain_renewal_domainRegistrationId_fkey" FOREIGN KEY ("domainRegistrationId") REFERENCES "domain_registration"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_transfer" ADD CONSTRAINT "domain_transfer_domainRegistrationId_fkey" FOREIGN KEY ("domainRegistrationId") REFERENCES "domain_registration"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_registration_activity_log" ADD CONSTRAINT "domain_registration_activity_log_domainRegistrationId_fkey" FOREIGN KEY ("domainRegistrationId") REFERENCES "domain_registration"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_renewal_activity_log" ADD CONSTRAINT "domain_renewal_activity_log_domainRenewalId_fkey" FOREIGN KEY ("domainRenewalId") REFERENCES "domain_renewal"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_transfer_activity_log" ADD CONSTRAINT "domain_transfer_activity_log_domainTransferId_fkey" FOREIGN KEY ("domainTransferId") REFERENCES "domain_transfer"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
