-- AlterTable
ALTER TABLE "image_generator_generation" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "qstashMessageId" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'QUEUED';

-- AlterTable
ALTER TABLE "image_generator_variation" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PROCESSING',
ALTER COLUMN "imageUrl" DROP NOT NULL,
ALTER COLUMN "imageKey" DROP NOT NULL,
ALTER COLUMN "imageFileName" DROP NOT NULL,
ALTER COLUMN "imageSize" DROP NOT NULL,
ALTER COLUMN "imageMimeType" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "image_generator_generation_status_idx" ON "image_generator_generation"("status");

-- CreateIndex
CREATE INDEX "image_generator_variation_status_idx" ON "image_generator_variation"("status");
