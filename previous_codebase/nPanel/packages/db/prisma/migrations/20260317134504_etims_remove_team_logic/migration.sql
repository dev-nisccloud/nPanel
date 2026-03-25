/*
  Warnings:

  - You are about to drop the column `teamId` on the `etims_configuration` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[itemCd]` on the table `etims_item` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."etims_configuration" DROP CONSTRAINT "etims_configuration_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."etims_item" DROP CONSTRAINT "etims_item_teamId_fkey";

-- DropIndex
DROP INDEX "public"."etims_configuration_teamId_idx";

-- DropIndex
DROP INDEX "public"."etims_configuration_teamId_key";

-- DropIndex
DROP INDEX "public"."etims_item_teamId_idx";

-- DropIndex
DROP INDEX "public"."etims_item_teamId_itemCd_key";

-- AlterTable
ALTER TABLE "etims_configuration" DROP COLUMN "teamId";

-- AlterTable
ALTER TABLE "team" ADD COLUMN     "eTimsConfigurationId" TEXT;

-- CreateIndex
CREATE INDEX "etims_configuration_kraPin_branchId_idx" ON "etims_configuration"("kraPin", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "etims_item_itemCd_key" ON "etims_item"("itemCd");

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_eTimsConfigurationId_fkey" FOREIGN KEY ("eTimsConfigurationId") REFERENCES "etims_configuration"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etims_item" ADD CONSTRAINT "etims_item_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
