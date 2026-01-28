-- AlterTable
ALTER TABLE "creative_brief" ADD COLUMN     "approverUserId" TEXT,
ADD COLUMN     "copy" TEXT,
ADD COLUMN     "designPreference" TEXT,
ADD COLUMN     "mandatoryElements" TEXT,
ADD COLUMN     "style" TEXT;

-- AlterTable
ALTER TABLE "creative_brief_activity_log" ADD COLUMN     "comment" TEXT;

-- CreateIndex
CREATE INDEX "creative_brief_approverUserId_idx" ON "creative_brief"("approverUserId");

-- AddForeignKey
ALTER TABLE "creative_brief" ADD CONSTRAINT "creative_brief_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "user"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
