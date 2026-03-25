/*
  Warnings:

  - You are about to drop the column `teamId` on the `etims_item` table. All the data in the column will be lost.
  - You are about to drop the column `eTimsConfigurationId` on the `team` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."etims_item" DROP CONSTRAINT "etims_item_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."team" DROP CONSTRAINT "team_eTimsConfigurationId_fkey";

-- AlterTable
ALTER TABLE "etims_item" DROP COLUMN "teamId";

-- AlterTable
ALTER TABLE "team" DROP COLUMN "eTimsConfigurationId";
