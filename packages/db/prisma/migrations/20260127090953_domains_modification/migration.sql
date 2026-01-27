/*
  Warnings:

  - Made the column `renewedBy` on table `domain_renewal` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `createdById` to the `domain_transfer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "domain_activity_log" ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "domain_renewal" ADD COLUMN     "teamId" TEXT,
ALTER COLUMN "renewedBy" SET NOT NULL;

-- AlterTable
ALTER TABLE "domain_renewal_activity_log" ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "domain_transfer" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "domain_transfer_activity_log" ADD COLUMN     "teamId" TEXT;

-- CreateIndex
CREATE INDEX "domain_activity_log_teamId_idx" ON "domain_activity_log"("teamId");

-- CreateIndex
CREATE INDEX "domain_renewal_teamId_idx" ON "domain_renewal"("teamId");

-- CreateIndex
CREATE INDEX "domain_renewal_activity_log_teamId_idx" ON "domain_renewal_activity_log"("teamId");

-- CreateIndex
CREATE INDEX "domain_transfer_createdById_idx" ON "domain_transfer"("createdById");

-- CreateIndex
CREATE INDEX "domain_transfer_teamId_idx" ON "domain_transfer"("teamId");

-- CreateIndex
CREATE INDEX "domain_transfer_activity_log_teamId_idx" ON "domain_transfer_activity_log"("teamId");

-- AddForeignKey
ALTER TABLE "domain_renewal" ADD CONSTRAINT "domain_renewal_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_renewal" ADD CONSTRAINT "domain_renewal_renewedBy_fkey" FOREIGN KEY ("renewedBy") REFERENCES "user"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_transfer" ADD CONSTRAINT "domain_transfer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_transfer" ADD CONSTRAINT "domain_transfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
