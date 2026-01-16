/*
  Warnings:

  - You are about to drop the column `domainRegistrationId` on the `domain_renewal` table. All the data in the column will be lost.
  - You are about to drop the column `expiryDate` on the `domain_renewal` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceNumber` on the `domain_renewal` table. All the data in the column will be lost.
  - You are about to drop the column `niscCurrency` on the `domain_renewal` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `domain_renewal` table. All the data in the column will be lost.
  - You are about to drop the column `openProviderCurrency` on the `domain_renewal` table. All the data in the column will be lost.
  - You are about to drop the column `renewalCycle` on the `domain_renewal` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `domain_renewal` table. All the data in the column will be lost.
  - You are about to drop the column `adminHandle` on the `domain_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `autoRenew` on the `domain_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `billingHandle` on the `domain_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `domainRegistrationId` on the `domain_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `failureReason` on the `domain_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceNumber` on the `domain_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `niscCurrency` on the `domain_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `openProviderCurrency` on the `domain_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `ownerHandle` on the `domain_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `previousExpiryDate` on the `domain_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `previousRegistrar` on the `domain_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `techHandle` on the `domain_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `domainRegistrationId` on the `hosting_subscription` table. All the data in the column will be lost.
  - You are about to drop the column `domainRegistrationId` on the `order` table. All the data in the column will be lost.
  - You are about to drop the `domain_registration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `domain_registration_activity_log` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[domainId]` on the table `domain_renewal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `domainId` to the `domain_renewal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `domainId` to the `domain_transfer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."domain_registration" DROP CONSTRAINT "domain_registration_customerIntegrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."domain_registration" DROP CONSTRAINT "domain_registration_nameserverGroupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."domain_registration" DROP CONSTRAINT "domain_registration_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."domain_registration_activity_log" DROP CONSTRAINT "domain_registration_activity_log_domainRegistrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."domain_renewal" DROP CONSTRAINT "domain_renewal_domainRegistrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."domain_transfer" DROP CONSTRAINT "domain_transfer_domainRegistrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."hosting_subscription" DROP CONSTRAINT "hosting_subscription_domainRegistrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."order" DROP CONSTRAINT "order_domainRegistrationId_fkey";

-- DropIndex
DROP INDEX "public"."domain_renewal_domainRegistrationId_idx";

-- DropIndex
DROP INDEX "public"."domain_renewal_expiryDate_idx";

-- DropIndex
DROP INDEX "public"."domain_transfer_domainRegistrationId_idx";

-- DropIndex
DROP INDEX "public"."domain_transfer_nameserverGroupId_idx";

-- AlterTable
ALTER TABLE "domain_renewal" DROP COLUMN "domainRegistrationId",
DROP COLUMN "expiryDate",
DROP COLUMN "invoiceNumber",
DROP COLUMN "niscCurrency",
DROP COLUMN "notes",
DROP COLUMN "openProviderCurrency",
DROP COLUMN "renewalCycle",
DROP COLUMN "status",
ADD COLUMN     "domainId" TEXT NOT NULL,
ALTER COLUMN "openProviderPrice" DROP NOT NULL,
ALTER COLUMN "niscPrice" DROP NOT NULL;

-- AlterTable
ALTER TABLE "domain_transfer" DROP COLUMN "adminHandle",
DROP COLUMN "autoRenew",
DROP COLUMN "billingHandle",
DROP COLUMN "domainRegistrationId",
DROP COLUMN "failureReason",
DROP COLUMN "invoiceNumber",
DROP COLUMN "niscCurrency",
DROP COLUMN "openProviderCurrency",
DROP COLUMN "ownerHandle",
DROP COLUMN "previousExpiryDate",
DROP COLUMN "previousRegistrar",
DROP COLUMN "techHandle",
ADD COLUMN     "domainId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "hosting_subscription" DROP COLUMN "domainRegistrationId",
ADD COLUMN     "domainId" TEXT;

-- AlterTable
ALTER TABLE "order" DROP COLUMN "domainRegistrationId",
ADD COLUMN     "domainId" TEXT;

-- DropTable
DROP TABLE "public"."domain_registration";

-- DropTable
DROP TABLE "public"."domain_registration_activity_log";

-- DropEnum
DROP TYPE "public"."DomainOperation";

-- CreateTable
CREATE TABLE "domain" (
    "_id" TEXT NOT NULL,
    "domainName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "openProviderId" INTEGER NOT NULL,
    "activationDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "registrationDate" TIMESTAMP(3) NOT NULL,
    "openProviderPrice" TEXT,
    "niscPrice" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerIntegrationId" TEXT,
    "nameserverGroupId" TEXT,

    CONSTRAINT "domain_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "domain_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domain_domainName_key" ON "domain"("domainName");

-- CreateIndex
CREATE INDEX "domain_domainName_idx" ON "domain"("domainName");

-- CreateIndex
CREATE INDEX "domain_userId_idx" ON "domain"("userId");

-- CreateIndex
CREATE INDEX "domain_teamId_idx" ON "domain"("teamId");

-- CreateIndex
CREATE INDEX "domain_openProviderId_idx" ON "domain"("openProviderId");

-- CreateIndex
CREATE INDEX "domain_registrationDate_idx" ON "domain"("registrationDate");

-- CreateIndex
CREATE INDEX "domain_expirationDate_idx" ON "domain"("expirationDate");

-- CreateIndex
CREATE INDEX "domain_activity_log_userId_idx" ON "domain_activity_log"("userId");

-- CreateIndex
CREATE INDEX "domain_activity_log_domainId_idx" ON "domain_activity_log"("domainId");

-- CreateIndex
CREATE INDEX "domain_activity_log_action_idx" ON "domain_activity_log"("action");

-- CreateIndex
CREATE INDEX "domain_activity_log_createdAt_idx" ON "domain_activity_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "domain_renewal_domainId_key" ON "domain_renewal"("domainId");

-- CreateIndex
CREATE INDEX "domain_renewal_domainId_idx" ON "domain_renewal"("domainId");

-- CreateIndex
CREATE INDEX "domain_transfer_domainId_idx" ON "domain_transfer"("domainId");

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domain"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosting_subscription" ADD CONSTRAINT "hosting_subscription_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domain"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain" ADD CONSTRAINT "domain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain" ADD CONSTRAINT "domain_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain" ADD CONSTRAINT "domain_customerIntegrationId_fkey" FOREIGN KEY ("customerIntegrationId") REFERENCES "customer_integration"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain" ADD CONSTRAINT "domain_nameserverGroupId_fkey" FOREIGN KEY ("nameserverGroupId") REFERENCES "nameserver_group"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_renewal" ADD CONSTRAINT "domain_renewal_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domain"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_transfer" ADD CONSTRAINT "domain_transfer_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domain"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_activity_log" ADD CONSTRAINT "domain_activity_log_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domain"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
