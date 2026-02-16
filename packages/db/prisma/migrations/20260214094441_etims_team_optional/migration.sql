-- AlterTable
ALTER TABLE "etims_configuration" ALTER COLUMN "teamId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "etims_item" ALTER COLUMN "teamId" DROP NOT NULL;
