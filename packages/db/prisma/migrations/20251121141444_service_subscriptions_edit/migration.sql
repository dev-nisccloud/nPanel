-- CreateEnum
CREATE TYPE "ServiceSubscriptionStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'CANCELLED', 'EXPIRED', 'PROCESSING', 'FAILED');

-- CreateTable
CREATE TABLE "service_subscription" (
    "_id" TEXT NOT NULL,
    "niscServicePlanId" TEXT NOT NULL,
    "teamId" TEXT,
    "orderId" TEXT,
    "subscribedBy" TEXT,
    "subscriptionDate" TIMESTAMP(3),
    "billingCycle" "BillingCycle" NOT NULL,
    "nextRenewalDate" TIMESTAMP(3),
    "status" "ServiceSubscriptionStatus" NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "hostingSubscriptionId" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_subscription_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "service_subscription_renewal" (
    "_id" TEXT NOT NULL,
    "serviceSubscriptionId" TEXT NOT NULL,
    "orderId" TEXT,
    "renewedBy" TEXT,
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "nextRenewalDate" TIMESTAMP(3),
    "status" "ServiceSubscriptionStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_subscription_renewal_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "service_subscription_activity_log" (
    "_id" TEXT NOT NULL,
    "serviceSubscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_subscription_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "service_subscription_renewal_activity_log" (
    "_id" TEXT NOT NULL,
    "serviceSubscriptionRenewalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_subscription_renewal_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_subscription_hostingSubscriptionId_key" ON "service_subscription"("hostingSubscriptionId");

-- CreateIndex
CREATE INDEX "service_subscription_niscServicePlanId_idx" ON "service_subscription"("niscServicePlanId");

-- CreateIndex
CREATE INDEX "service_subscription_teamId_idx" ON "service_subscription"("teamId");

-- CreateIndex
CREATE INDEX "service_subscription_orderId_idx" ON "service_subscription"("orderId");

-- CreateIndex
CREATE INDEX "service_subscription_status_idx" ON "service_subscription"("status");

-- CreateIndex
CREATE INDEX "service_subscription_nextRenewalDate_idx" ON "service_subscription"("nextRenewalDate");

-- CreateIndex
CREATE INDEX "service_subscription_subscriptionDate_idx" ON "service_subscription"("subscriptionDate");

-- CreateIndex
CREATE INDEX "service_subscription_hostingSubscriptionId_idx" ON "service_subscription"("hostingSubscriptionId");

-- CreateIndex
CREATE INDEX "service_subscription_renewal_serviceSubscriptionId_idx" ON "service_subscription_renewal"("serviceSubscriptionId");

-- CreateIndex
CREATE INDEX "service_subscription_renewal_orderId_idx" ON "service_subscription_renewal"("orderId");

-- CreateIndex
CREATE INDEX "service_subscription_renewal_renewalDate_idx" ON "service_subscription_renewal"("renewalDate");

-- CreateIndex
CREATE INDEX "service_subscription_renewal_nextRenewalDate_idx" ON "service_subscription_renewal"("nextRenewalDate");

-- CreateIndex
CREATE INDEX "service_subscription_activity_log_serviceSubscriptionId_idx" ON "service_subscription_activity_log"("serviceSubscriptionId");

-- CreateIndex
CREATE INDEX "service_subscription_activity_log_userId_idx" ON "service_subscription_activity_log"("userId");

-- CreateIndex
CREATE INDEX "service_subscription_activity_log_action_idx" ON "service_subscription_activity_log"("action");

-- CreateIndex
CREATE INDEX "service_subscription_activity_log_createdAt_idx" ON "service_subscription_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "service_subscription_renewal_activity_log_serviceSubscripti_idx" ON "service_subscription_renewal_activity_log"("serviceSubscriptionRenewalId");

-- CreateIndex
CREATE INDEX "service_subscription_renewal_activity_log_userId_idx" ON "service_subscription_renewal_activity_log"("userId");

-- CreateIndex
CREATE INDEX "service_subscription_renewal_activity_log_action_idx" ON "service_subscription_renewal_activity_log"("action");

-- CreateIndex
CREATE INDEX "service_subscription_renewal_activity_log_createdAt_idx" ON "service_subscription_renewal_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "service_subscription" ADD CONSTRAINT "service_subscription_niscServicePlanId_fkey" FOREIGN KEY ("niscServicePlanId") REFERENCES "nisc_service_plan"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_subscription" ADD CONSTRAINT "service_subscription_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_subscription" ADD CONSTRAINT "service_subscription_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_subscription" ADD CONSTRAINT "service_subscription_hostingSubscriptionId_fkey" FOREIGN KEY ("hostingSubscriptionId") REFERENCES "hosting_subscription"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_subscription_renewal" ADD CONSTRAINT "service_subscription_renewal_serviceSubscriptionId_fkey" FOREIGN KEY ("serviceSubscriptionId") REFERENCES "service_subscription"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_subscription_renewal" ADD CONSTRAINT "service_subscription_renewal_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_subscription_activity_log" ADD CONSTRAINT "service_subscription_activity_log_serviceSubscriptionId_fkey" FOREIGN KEY ("serviceSubscriptionId") REFERENCES "service_subscription"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_subscription_renewal_activity_log" ADD CONSTRAINT "service_subscription_renewal_activity_log_serviceSubscript_fkey" FOREIGN KEY ("serviceSubscriptionRenewalId") REFERENCES "service_subscription_renewal"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
