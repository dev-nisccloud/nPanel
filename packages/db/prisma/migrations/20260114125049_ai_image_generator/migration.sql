-- CreateTable
CREATE TABLE "image_generator_generation" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "prompt" TEXT NOT NULL,
    "referenceImageUrls" JSONB,
    "imageUrl" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "imageFileName" TEXT NOT NULL,
    "imageSize" INTEGER NOT NULL,
    "imageMimeType" TEXT NOT NULL,
    "imageMetadata" JSONB,
    "modelId" TEXT NOT NULL,
    "modelName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_generator_generation_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "image_generator_generation_activity_log" (
    "_id" TEXT NOT NULL,
    "imageGeneratorGenerationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_generator_generation_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "image_generator_generation_userId_idx" ON "image_generator_generation"("userId");

-- CreateIndex
CREATE INDEX "image_generator_generation_teamId_idx" ON "image_generator_generation"("teamId");

-- CreateIndex
CREATE INDEX "image_generator_generation_createdAt_idx" ON "image_generator_generation"("createdAt");

-- CreateIndex
CREATE INDEX "image_generator_generation_modelId_idx" ON "image_generator_generation"("modelId");

-- CreateIndex
CREATE INDEX "image_generator_generation_activity_log_imageGeneratorGener_idx" ON "image_generator_generation_activity_log"("imageGeneratorGenerationId");

-- CreateIndex
CREATE INDEX "image_generator_generation_activity_log_userId_idx" ON "image_generator_generation_activity_log"("userId");

-- CreateIndex
CREATE INDEX "image_generator_generation_activity_log_action_idx" ON "image_generator_generation_activity_log"("action");

-- CreateIndex
CREATE INDEX "image_generator_generation_activity_log_createdAt_idx" ON "image_generator_generation_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "image_generator_generation" ADD CONSTRAINT "image_generator_generation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_generator_generation" ADD CONSTRAINT "image_generator_generation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_generator_generation_activity_log" ADD CONSTRAINT "image_generator_generation_activity_log_imageGeneratorGene_fkey" FOREIGN KEY ("imageGeneratorGenerationId") REFERENCES "image_generator_generation"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
