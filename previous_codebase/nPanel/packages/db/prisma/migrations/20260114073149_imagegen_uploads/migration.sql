-- CreateTable
CREATE TABLE "imagegen_upload" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imagegen_upload_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "imagegen_upload_activity_log" (
    "_id" TEXT NOT NULL,
    "imageGenUploadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imagegen_upload_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "imagegen_upload_userId_idx" ON "imagegen_upload"("userId");

-- CreateIndex
CREATE INDEX "imagegen_upload_teamId_idx" ON "imagegen_upload"("teamId");

-- CreateIndex
CREATE INDEX "imagegen_upload_createdAt_idx" ON "imagegen_upload"("createdAt");

-- CreateIndex
CREATE INDEX "imagegen_upload_activity_log_imageGenUploadId_idx" ON "imagegen_upload_activity_log"("imageGenUploadId");

-- CreateIndex
CREATE INDEX "imagegen_upload_activity_log_userId_idx" ON "imagegen_upload_activity_log"("userId");

-- CreateIndex
CREATE INDEX "imagegen_upload_activity_log_action_idx" ON "imagegen_upload_activity_log"("action");

-- CreateIndex
CREATE INDEX "imagegen_upload_activity_log_createdAt_idx" ON "imagegen_upload_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "imagegen_upload" ADD CONSTRAINT "imagegen_upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagegen_upload" ADD CONSTRAINT "imagegen_upload_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagegen_upload_activity_log" ADD CONSTRAINT "imagegen_upload_activity_log_imageGenUploadId_fkey" FOREIGN KEY ("imageGenUploadId") REFERENCES "imagegen_upload"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
