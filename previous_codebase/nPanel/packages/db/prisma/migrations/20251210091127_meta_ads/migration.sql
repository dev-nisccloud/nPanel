/*
  Warnings:

  - A unique constraint covering the columns `[integrationId,customerId]` on the table `google_ads_account` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MetaAdsAccountStatus" AS ENUM ('ACTIVE', 'DISABLED', 'UNSETTLED', 'PENDING_REVIEW', 'IN_GRACE_PERIOD', 'PENDING_CLOSURE', 'CLOSED');

-- CreateEnum
CREATE TYPE "MetaAdsCampaignStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "MetaAdsAdSetStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "MetaAdsAdStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "MetaAdsCampaignObjective" AS ENUM ('OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS', 'OUTCOME_APP_PROMOTION', 'OUTCOME_SALES', 'OUTCOME_AWARENESS');

-- DropIndex
DROP INDEX "public"."google_ads_account_customerId_key";

-- CreateTable
CREATE TABLE "meta_ads_account" (
    "_id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT,
    "currency" TEXT,
    "timezone" TEXT,
    "status" "MetaAdsAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "spendLimit" TEXT,
    "amountSpent" TEXT,
    "balance" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_ads_account_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "meta_ads_campaign" (
    "_id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campaignName" TEXT,
    "objective" "MetaAdsCampaignObjective",
    "status" "MetaAdsCampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "dailyBudget" TEXT,
    "lifetimeBudget" TEXT,
    "budgetRemaining" TEXT,
    "startTime" TIMESTAMP(3),
    "stopTime" TIMESTAMP(3),
    "createdTime" TIMESTAMP(3),
    "updatedTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_ads_campaign_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "meta_ads_ad_set" (
    "_id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "adSetId" TEXT NOT NULL,
    "adSetName" TEXT,
    "status" "MetaAdsAdSetStatus" NOT NULL DEFAULT 'ACTIVE',
    "dailyBudget" TEXT,
    "lifetimeBudget" TEXT,
    "budgetRemaining" TEXT,
    "bidAmount" TEXT,
    "targeting" JSONB,
    "startTime" TIMESTAMP(3),
    "stopTime" TIMESTAMP(3),
    "createdTime" TIMESTAMP(3),
    "updatedTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_ads_ad_set_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "meta_ads_ad" (
    "_id" TEXT NOT NULL,
    "adSetId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "adName" TEXT,
    "status" "MetaAdsAdStatus" NOT NULL DEFAULT 'ACTIVE',
    "creative" JSONB,
    "createdTime" TIMESTAMP(3),
    "updatedTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_ads_ad_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "meta_ads_insight" (
    "_id" TEXT NOT NULL,
    "accountId" TEXT,
    "campaignId" TEXT,
    "adSetId" TEXT,
    "adId" TEXT,
    "dateStart" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3) NOT NULL,
    "breakdown" JSONB,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_ads_insight_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "meta_ads_account_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_ads_account_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "meta_ads_campaign_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_ads_campaign_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "meta_ads_ad_set_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adSetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_ads_ad_set_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "meta_ads_ad_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_ads_ad_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meta_ads_account_accountId_key" ON "meta_ads_account"("accountId");

-- CreateIndex
CREATE INDEX "meta_ads_account_integrationId_idx" ON "meta_ads_account"("integrationId");

-- CreateIndex
CREATE INDEX "meta_ads_account_accountId_idx" ON "meta_ads_account"("accountId");

-- CreateIndex
CREATE INDEX "meta_ads_account_teamId_idx" ON "meta_ads_account"("teamId");

-- CreateIndex
CREATE INDEX "meta_ads_account_status_idx" ON "meta_ads_account"("status");

-- CreateIndex
CREATE UNIQUE INDEX "meta_ads_account_integrationId_accountId_key" ON "meta_ads_account"("integrationId", "accountId");

-- CreateIndex
CREATE INDEX "meta_ads_campaign_accountId_idx" ON "meta_ads_campaign"("accountId");

-- CreateIndex
CREATE INDEX "meta_ads_campaign_campaignId_idx" ON "meta_ads_campaign"("campaignId");

-- CreateIndex
CREATE INDEX "meta_ads_campaign_status_idx" ON "meta_ads_campaign"("status");

-- CreateIndex
CREATE INDEX "meta_ads_campaign_objective_idx" ON "meta_ads_campaign"("objective");

-- CreateIndex
CREATE UNIQUE INDEX "meta_ads_campaign_accountId_campaignId_key" ON "meta_ads_campaign"("accountId", "campaignId");

-- CreateIndex
CREATE INDEX "meta_ads_ad_set_campaignId_idx" ON "meta_ads_ad_set"("campaignId");

-- CreateIndex
CREATE INDEX "meta_ads_ad_set_accountId_idx" ON "meta_ads_ad_set"("accountId");

-- CreateIndex
CREATE INDEX "meta_ads_ad_set_adSetId_idx" ON "meta_ads_ad_set"("adSetId");

-- CreateIndex
CREATE INDEX "meta_ads_ad_set_status_idx" ON "meta_ads_ad_set"("status");

-- CreateIndex
CREATE UNIQUE INDEX "meta_ads_ad_set_campaignId_adSetId_key" ON "meta_ads_ad_set"("campaignId", "adSetId");

-- CreateIndex
CREATE INDEX "meta_ads_ad_adSetId_idx" ON "meta_ads_ad"("adSetId");

-- CreateIndex
CREATE INDEX "meta_ads_ad_campaignId_idx" ON "meta_ads_ad"("campaignId");

-- CreateIndex
CREATE INDEX "meta_ads_ad_accountId_idx" ON "meta_ads_ad"("accountId");

-- CreateIndex
CREATE INDEX "meta_ads_ad_adId_idx" ON "meta_ads_ad"("adId");

-- CreateIndex
CREATE INDEX "meta_ads_ad_status_idx" ON "meta_ads_ad"("status");

-- CreateIndex
CREATE UNIQUE INDEX "meta_ads_ad_adSetId_adId_key" ON "meta_ads_ad"("adSetId", "adId");

-- CreateIndex
CREATE INDEX "meta_ads_insight_accountId_idx" ON "meta_ads_insight"("accountId");

-- CreateIndex
CREATE INDEX "meta_ads_insight_campaignId_idx" ON "meta_ads_insight"("campaignId");

-- CreateIndex
CREATE INDEX "meta_ads_insight_adSetId_idx" ON "meta_ads_insight"("adSetId");

-- CreateIndex
CREATE INDEX "meta_ads_insight_adId_idx" ON "meta_ads_insight"("adId");

-- CreateIndex
CREATE INDEX "meta_ads_insight_dateStart_idx" ON "meta_ads_insight"("dateStart");

-- CreateIndex
CREATE INDEX "meta_ads_insight_dateEnd_idx" ON "meta_ads_insight"("dateEnd");

-- CreateIndex
CREATE INDEX "meta_ads_account_activity_log_userId_idx" ON "meta_ads_account_activity_log"("userId");

-- CreateIndex
CREATE INDEX "meta_ads_account_activity_log_accountId_idx" ON "meta_ads_account_activity_log"("accountId");

-- CreateIndex
CREATE INDEX "meta_ads_account_activity_log_action_idx" ON "meta_ads_account_activity_log"("action");

-- CreateIndex
CREATE INDEX "meta_ads_account_activity_log_createdAt_idx" ON "meta_ads_account_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "meta_ads_campaign_activity_log_userId_idx" ON "meta_ads_campaign_activity_log"("userId");

-- CreateIndex
CREATE INDEX "meta_ads_campaign_activity_log_campaignId_idx" ON "meta_ads_campaign_activity_log"("campaignId");

-- CreateIndex
CREATE INDEX "meta_ads_campaign_activity_log_action_idx" ON "meta_ads_campaign_activity_log"("action");

-- CreateIndex
CREATE INDEX "meta_ads_campaign_activity_log_createdAt_idx" ON "meta_ads_campaign_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "meta_ads_ad_set_activity_log_userId_idx" ON "meta_ads_ad_set_activity_log"("userId");

-- CreateIndex
CREATE INDEX "meta_ads_ad_set_activity_log_adSetId_idx" ON "meta_ads_ad_set_activity_log"("adSetId");

-- CreateIndex
CREATE INDEX "meta_ads_ad_set_activity_log_action_idx" ON "meta_ads_ad_set_activity_log"("action");

-- CreateIndex
CREATE INDEX "meta_ads_ad_set_activity_log_createdAt_idx" ON "meta_ads_ad_set_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "meta_ads_ad_activity_log_userId_idx" ON "meta_ads_ad_activity_log"("userId");

-- CreateIndex
CREATE INDEX "meta_ads_ad_activity_log_adId_idx" ON "meta_ads_ad_activity_log"("adId");

-- CreateIndex
CREATE INDEX "meta_ads_ad_activity_log_action_idx" ON "meta_ads_ad_activity_log"("action");

-- CreateIndex
CREATE INDEX "meta_ads_ad_activity_log_createdAt_idx" ON "meta_ads_ad_activity_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "google_ads_account_integrationId_customerId_key" ON "google_ads_account"("integrationId", "customerId");

-- AddForeignKey
ALTER TABLE "meta_ads_account" ADD CONSTRAINT "meta_ads_account_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "social_media_integration"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_account" ADD CONSTRAINT "meta_ads_account_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_campaign" ADD CONSTRAINT "meta_ads_campaign_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "meta_ads_account"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_ad_set" ADD CONSTRAINT "meta_ads_ad_set_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "meta_ads_campaign"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_ad_set" ADD CONSTRAINT "meta_ads_ad_set_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "meta_ads_account"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_ad" ADD CONSTRAINT "meta_ads_ad_adSetId_fkey" FOREIGN KEY ("adSetId") REFERENCES "meta_ads_ad_set"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_ad" ADD CONSTRAINT "meta_ads_ad_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "meta_ads_campaign"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_ad" ADD CONSTRAINT "meta_ads_ad_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "meta_ads_account"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_insight" ADD CONSTRAINT "meta_ads_insight_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "meta_ads_account"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_insight" ADD CONSTRAINT "meta_ads_insight_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "meta_ads_campaign"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_insight" ADD CONSTRAINT "meta_ads_insight_adSetId_fkey" FOREIGN KEY ("adSetId") REFERENCES "meta_ads_ad_set"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_insight" ADD CONSTRAINT "meta_ads_insight_adId_fkey" FOREIGN KEY ("adId") REFERENCES "meta_ads_ad"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_account_activity_log" ADD CONSTRAINT "meta_ads_account_activity_log_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "meta_ads_account"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_account_activity_log" ADD CONSTRAINT "meta_ads_account_activity_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_campaign_activity_log" ADD CONSTRAINT "meta_ads_campaign_activity_log_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "meta_ads_campaign"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_campaign_activity_log" ADD CONSTRAINT "meta_ads_campaign_activity_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_ad_set_activity_log" ADD CONSTRAINT "meta_ads_ad_set_activity_log_adSetId_fkey" FOREIGN KEY ("adSetId") REFERENCES "meta_ads_ad_set"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_ad_set_activity_log" ADD CONSTRAINT "meta_ads_ad_set_activity_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_ad_activity_log" ADD CONSTRAINT "meta_ads_ad_activity_log_adId_fkey" FOREIGN KEY ("adId") REFERENCES "meta_ads_ad"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ads_ad_activity_log" ADD CONSTRAINT "meta_ads_ad_activity_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
