/*
  Warnings:

  - You are about to drop the column `tax` on the `invoice_line_item` table. All the data in the column will be lost.
  - You are about to drop the column `vat` on the `invoice_line_item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invoice" ADD COLUMN     "taxPercentage" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "invoice_line_item" DROP COLUMN "tax",
DROP COLUMN "vat";
