-- CreateTable
CREATE TABLE "background_remover_generation" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "originalImageUrl" TEXT NOT NULL,
    "originalImageKey" TEXT NOT NULL,
    "originalImageFileName" TEXT NOT NULL,
    "originalImageSize" INTEGER NOT NULL,
    "originalImageMimeType" TEXT NOT NULL,
    "originalImageMetadata" JSONB,
    "processedImageUrl" TEXT NOT NULL,
    "processedImageKey" TEXT NOT NULL,
    "processedImageFileName" TEXT NOT NULL,
    "processedImageSize" INTEGER NOT NULL,
    "processedImageMimeType" TEXT NOT NULL,
    "processedImageMetadata" JSONB,
    "modelId" TEXT NOT NULL,
    "modelName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_remover_generation_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "background_remover_generation_activity_log" (
    "_id" TEXT NOT NULL,
    "backgroundRemoverGenerationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_remover_generation_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "background_remover_generation_userId_idx" ON "background_remover_generation"("userId");

-- CreateIndex
CREATE INDEX "background_remover_generation_teamId_idx" ON "background_remover_generation"("teamId");

-- CreateIndex
CREATE INDEX "background_remover_generation_createdAt_idx" ON "background_remover_generation"("createdAt");

-- CreateIndex
CREATE INDEX "background_remover_generation_modelId_idx" ON "background_remover_generation"("modelId");

-- CreateIndex
CREATE INDEX "background_remover_generation_activity_log_backgroundRemove_idx" ON "background_remover_generation_activity_log"("backgroundRemoverGenerationId");

-- CreateIndex
CREATE INDEX "background_remover_generation_activity_log_userId_idx" ON "background_remover_generation_activity_log"("userId");

-- CreateIndex
CREATE INDEX "background_remover_generation_activity_log_action_idx" ON "background_remover_generation_activity_log"("action");

-- CreateIndex
CREATE INDEX "background_remover_generation_activity_log_createdAt_idx" ON "background_remover_generation_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "background_remover_generation" ADD CONSTRAINT "background_remover_generation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "background_remover_generation" ADD CONSTRAINT "background_remover_generation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "background_remover_generation_activity_log" ADD CONSTRAINT "background_remover_generation_activity_log_backgroundRemov_fkey" FOREIGN KEY ("backgroundRemoverGenerationId") REFERENCES "background_remover_generation"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
