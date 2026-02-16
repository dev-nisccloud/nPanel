/*
  Warnings:

  - You are about to drop the `team_etims_branch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `team_etims_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `team_etims_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."team_etims_branch" DROP CONSTRAINT "team_etims_branch_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."team_etims_item" DROP CONSTRAINT "team_etims_item_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."team_etims_settings" DROP CONSTRAINT "team_etims_settings_teamId_fkey";

-- DropTable
DROP TABLE "public"."team_etims_branch";

-- DropTable
DROP TABLE "public"."team_etims_item";

-- DropTable
DROP TABLE "public"."team_etims_settings";

-- CreateTable
CREATE TABLE "etims_configuration" (
    "_id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "kraPin" TEXT NOT NULL,
    "branchId" TEXT NOT NULL DEFAULT '00',
    "branchName" TEXT,
    "deviceSerialNumber" TEXT NOT NULL,
    "cmcKey" TEXT,
    "isSandbox" BOOLEAN NOT NULL DEFAULT true,
    "isInitialized" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etims_configuration_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "etims_item" (
    "_id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "localItemId" TEXT,
    "itemCd" TEXT NOT NULL,
    "itemClsCd" TEXT NOT NULL,
    "itemNm" TEXT NOT NULL,
    "taxTyCd" TEXT NOT NULL DEFAULT 'A',
    "pkgUnitCd" TEXT NOT NULL DEFAULT 'OU',
    "originCountryCd" TEXT,
    "packagingUnit" TEXT,
    "quantityUnit" TEXT,
    "unitPrice" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etims_item_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "etims_configuration_teamId_key" ON "etims_configuration"("teamId");

-- CreateIndex
CREATE INDEX "etims_configuration_teamId_idx" ON "etims_configuration"("teamId");

-- CreateIndex
CREATE INDEX "etims_item_teamId_idx" ON "etims_item"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "etims_item_teamId_itemCd_key" ON "etims_item"("teamId", "itemCd");

-- AddForeignKey
ALTER TABLE "etims_configuration" ADD CONSTRAINT "etims_configuration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etims_item" ADD CONSTRAINT "etims_item_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
