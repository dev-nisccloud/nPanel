-- CreateEnum
CREATE TYPE "GoogleAdsIntegrationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'REVOKED', 'PENDING');

-- CreateEnum
CREATE TYPE "GoogleAdsAccountStatus" AS ENUM ('ACTIVE', 'PAUSED', 'REMOVED');

-- CreateTable
CREATE TABLE "google_ads_integration" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "GoogleAdsIntegrationStatus" NOT NULL DEFAULT 'PENDING',
    "refreshToken" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "tokenType" TEXT,
    "lastTokenRefreshAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_ads_integration_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "google_ads_account" (
    "_id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "accountName" TEXT,
    "currencyCode" TEXT,
    "timeZone" TEXT,
    "status" "GoogleAdsAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_ads_account_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "google_ads_integration_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_ads_integration_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "google_ads_account_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_ads_account_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "google_ads_integration_status_idx" ON "google_ads_integration"("status");

-- CreateIndex
CREATE INDEX "google_ads_integration_userId_idx" ON "google_ads_integration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "google_ads_account_customerId_key" ON "google_ads_account"("customerId");

-- CreateIndex
CREATE INDEX "google_ads_account_integrationId_idx" ON "google_ads_account"("integrationId");

-- CreateIndex
CREATE INDEX "google_ads_account_customerId_idx" ON "google_ads_account"("customerId");

-- CreateIndex
CREATE INDEX "google_ads_account_status_idx" ON "google_ads_account"("status");

-- CreateIndex
CREATE INDEX "google_ads_account_teamId_idx" ON "google_ads_account"("teamId");

-- CreateIndex
CREATE INDEX "google_ads_integration_activity_log_userId_idx" ON "google_ads_integration_activity_log"("userId");

-- CreateIndex
CREATE INDEX "google_ads_integration_activity_log_integrationId_idx" ON "google_ads_integration_activity_log"("integrationId");

-- CreateIndex
CREATE INDEX "google_ads_integration_activity_log_action_idx" ON "google_ads_integration_activity_log"("action");

-- CreateIndex
CREATE INDEX "google_ads_integration_activity_log_createdAt_idx" ON "google_ads_integration_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "google_ads_account_activity_log_userId_idx" ON "google_ads_account_activity_log"("userId");

-- CreateIndex
CREATE INDEX "google_ads_account_activity_log_accountId_idx" ON "google_ads_account_activity_log"("accountId");

-- CreateIndex
CREATE INDEX "google_ads_account_activity_log_action_idx" ON "google_ads_account_activity_log"("action");

-- CreateIndex
CREATE INDEX "google_ads_account_activity_log_createdAt_idx" ON "google_ads_account_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "google_ads_integration" ADD CONSTRAINT "google_ads_integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_ads_account" ADD CONSTRAINT "google_ads_account_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "google_ads_integration"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_ads_account" ADD CONSTRAINT "google_ads_account_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_ads_integration_activity_log" ADD CONSTRAINT "google_ads_integration_activity_log_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "google_ads_integration"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_ads_account_activity_log" ADD CONSTRAINT "google_ads_account_activity_log_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "google_ads_account"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
