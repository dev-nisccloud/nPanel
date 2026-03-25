/*
  Warnings:

  - You are about to drop the column `nameservers` on the `domain_registration` table. All the data in the column will be lost.
  - You are about to drop the column `nameservers` on the `domain_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `nameservers` on the `nameserver_group` table. All the data in the column will be lost.
  - You are about to drop the column `costMargin` on the `tld_settings` table. All the data in the column will be lost.
  - You are about to drop the column `profitMargin` on the `tld_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "domain_registration" DROP COLUMN "nameservers",
ADD COLUMN     "nameserverGroupId" TEXT;

-- AlterTable
ALTER TABLE "domain_transfer" DROP COLUMN "nameservers",
ADD COLUMN     "nameserverGroupId" TEXT;

-- AlterTable
ALTER TABLE "nameserver_group" DROP COLUMN "nameservers";

-- AlterTable
ALTER TABLE "tld_settings" DROP COLUMN "costMargin",
DROP COLUMN "profitMargin",
ADD COLUMN     "fixedMargin" TEXT,
ADD COLUMN     "percentageMargin" TEXT;

-- CreateTable
CREATE TABLE "nameserver" (
    "_id" TEXT NOT NULL,
    "nameserverGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ipv4" TEXT,
    "ipv6" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nameserver_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "nameserver_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nameserverId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nameserver_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "nameserver_nameserverGroupId_idx" ON "nameserver"("nameserverGroupId");

-- CreateIndex
CREATE INDEX "nameserver_name_idx" ON "nameserver"("name");

-- CreateIndex
CREATE INDEX "nameserver_activity_log_userId_idx" ON "nameserver_activity_log"("userId");

-- CreateIndex
CREATE INDEX "nameserver_activity_log_nameserverId_idx" ON "nameserver_activity_log"("nameserverId");

-- CreateIndex
CREATE INDEX "nameserver_activity_log_action_idx" ON "nameserver_activity_log"("action");

-- CreateIndex
CREATE INDEX "nameserver_activity_log_createdAt_idx" ON "nameserver_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "domain_registration_nameserverGroupId_idx" ON "domain_registration"("nameserverGroupId");

-- CreateIndex
CREATE INDEX "domain_transfer_nameserverGroupId_idx" ON "domain_transfer"("nameserverGroupId");

-- AddForeignKey
ALTER TABLE "nameserver" ADD CONSTRAINT "nameserver_nameserverGroupId_fkey" FOREIGN KEY ("nameserverGroupId") REFERENCES "nameserver_group"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nameserver_activity_log" ADD CONSTRAINT "nameserver_activity_log_nameserverId_fkey" FOREIGN KEY ("nameserverId") REFERENCES "nameserver"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_registration" ADD CONSTRAINT "domain_registration_nameserverGroupId_fkey" FOREIGN KEY ("nameserverGroupId") REFERENCES "nameserver_group"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_transfer" ADD CONSTRAINT "domain_transfer_nameserverGroupId_fkey" FOREIGN KEY ("nameserverGroupId") REFERENCES "nameserver_group"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
