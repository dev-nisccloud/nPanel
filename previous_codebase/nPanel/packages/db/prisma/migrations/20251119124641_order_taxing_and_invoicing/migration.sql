-- AlterTable
ALTER TABLE "order" ADD COLUMN     "isTaxable" BOOLEAN,
ADD COLUMN     "taxAmount" TEXT,
ADD COLUMN     "taxPercentage" DOUBLE PRECISION;
