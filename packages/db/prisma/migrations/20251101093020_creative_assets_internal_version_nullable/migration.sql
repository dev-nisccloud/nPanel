-- AlterTable
ALTER TABLE "creative_asset" ALTER COLUMN "currentInternalVersion" DROP NOT NULL,
ALTER COLUMN "currentInternalVersion" DROP DEFAULT;
