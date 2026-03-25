-- AlterTable
ALTER TABLE "background_remover_generation" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "qstashMessageId" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'QUEUED',
ALTER COLUMN "processedImageUrl" DROP NOT NULL,
ALTER COLUMN "processedImageKey" DROP NOT NULL,
ALTER COLUMN "processedImageFileName" DROP NOT NULL,
ALTER COLUMN "processedImageSize" DROP NOT NULL,
ALTER COLUMN "processedImageMimeType" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "background_remover_generation_status_idx" ON "background_remover_generation"("status");
