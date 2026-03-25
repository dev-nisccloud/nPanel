-- CreateEnum
CREATE TYPE "NiscServicePlanType" AS ENUM ('HOSTING', 'SEO', 'VIDEOGRAPHY', 'VISUAL_CREATIVE', 'SOCIAL_MEDIA_MARKETING', 'PAY_PER_CLICK_ADVERTISING');

-- CreateTable
CREATE TABLE "nisc_service_plan" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "planType" "NiscServicePlanType" NOT NULL,
    "hostingSubType" "HostingType",
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

    CONSTRAINT "nisc_service_plan_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "nisc_service_plan_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "niscServicePlanId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nisc_service_plan_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "nisc_service_plan_planType_idx" ON "nisc_service_plan"("planType");

-- CreateIndex
CREATE INDEX "nisc_service_plan_hostingSubType_idx" ON "nisc_service_plan"("hostingSubType");

-- CreateIndex
CREATE INDEX "nisc_service_plan_isActive_idx" ON "nisc_service_plan"("isActive");

-- CreateIndex
CREATE INDEX "nisc_service_plan_isDefault_idx" ON "nisc_service_plan"("isDefault");

-- CreateIndex
CREATE INDEX "nisc_service_plan_activity_log_userId_idx" ON "nisc_service_plan_activity_log"("userId");

-- CreateIndex
CREATE INDEX "nisc_service_plan_activity_log_niscServicePlanId_idx" ON "nisc_service_plan_activity_log"("niscServicePlanId");

-- CreateIndex
CREATE INDEX "nisc_service_plan_activity_log_action_idx" ON "nisc_service_plan_activity_log"("action");

-- CreateIndex
CREATE INDEX "nisc_service_plan_activity_log_createdAt_idx" ON "nisc_service_plan_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "nisc_service_plan_activity_log" ADD CONSTRAINT "nisc_service_plan_activity_log_niscServicePlanId_fkey" FOREIGN KEY ("niscServicePlanId") REFERENCES "nisc_service_plan"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
