/*
  Warnings:

  - You are about to drop the column `imageFileName` on the `image_generator_generation` table. All the data in the column will be lost.
  - You are about to drop the column `imageKey` on the `image_generator_generation` table. All the data in the column will be lost.
  - You are about to drop the column `imageMetadata` on the `image_generator_generation` table. All the data in the column will be lost.
  - You are about to drop the column `imageMimeType` on the `image_generator_generation` table. All the data in the column will be lost.
  - You are about to drop the column `imageSize` on the `image_generator_generation` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `image_generator_generation` table. All the data in the column will be lost.
  - Added the required column `aspectRatio` to the `image_generator_generation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outputFormat` to the `image_generator_generation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resolution` to the `image_generator_generation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variationsCount` to the `image_generator_generation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "image_generator_generation" DROP COLUMN "imageFileName",
DROP COLUMN "imageKey",
DROP COLUMN "imageMetadata",
DROP COLUMN "imageMimeType",
DROP COLUMN "imageSize",
DROP COLUMN "imageUrl",
ADD COLUMN     "aspectRatio" TEXT NOT NULL,
ADD COLUMN     "outputFormat" TEXT NOT NULL,
ADD COLUMN     "resolution" TEXT NOT NULL,
ADD COLUMN     "variationsCount" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "image_generator_variation" (
    "_id" TEXT NOT NULL,
    "imageGeneratorGenerationId" TEXT NOT NULL,
    "variationIndex" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "imageFileName" TEXT NOT NULL,
    "imageSize" INTEGER NOT NULL,
    "imageMimeType" TEXT NOT NULL,
    "imageMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_generator_variation_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "image_generator_variation_imageGeneratorGenerationId_idx" ON "image_generator_variation"("imageGeneratorGenerationId");

-- CreateIndex
CREATE INDEX "image_generator_variation_variationIndex_idx" ON "image_generator_variation"("variationIndex");

-- AddForeignKey
ALTER TABLE "image_generator_variation" ADD CONSTRAINT "image_generator_variation_imageGeneratorGenerationId_fkey" FOREIGN KEY ("imageGeneratorGenerationId") REFERENCES "image_generator_generation"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
