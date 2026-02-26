-- AlterTable
ALTER TABLE "image_generator_variation" ADD COLUMN     "predictionId" TEXT;

-- CreateIndex
CREATE INDEX "image_generator_variation_predictionId_idx" ON "image_generator_variation"("predictionId");
