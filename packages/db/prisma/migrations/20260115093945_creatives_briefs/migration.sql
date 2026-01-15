-- CreateEnum
CREATE TYPE "CreativeBriefStatus" AS ENUM ('DRAFT', 'REVIEWING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "creative_brief" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "status" "CreativeBriefStatus" NOT NULL DEFAULT 'DRAFT',
    "background" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "comments" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "timelineStartDate" TIMESTAMP(3),
    "timelineEndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creative_brief_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "creative_brief_reference_image" (
    "_id" TEXT NOT NULL,
    "creativeBriefId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creative_brief_reference_image_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "creative_brief_activity_log" (
    "_id" TEXT NOT NULL,
    "creativeBriefId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creative_brief_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "creative_brief_userId_idx" ON "creative_brief"("userId");

-- CreateIndex
CREATE INDEX "creative_brief_teamId_idx" ON "creative_brief"("teamId");

-- CreateIndex
CREATE INDEX "creative_brief_status_idx" ON "creative_brief"("status");

-- CreateIndex
CREATE INDEX "creative_brief_createdAt_idx" ON "creative_brief"("createdAt");

-- CreateIndex
CREATE INDEX "creative_brief_reference_image_creativeBriefId_idx" ON "creative_brief_reference_image"("creativeBriefId");

-- CreateIndex
CREATE INDEX "creative_brief_reference_image_createdAt_idx" ON "creative_brief_reference_image"("createdAt");

-- CreateIndex
CREATE INDEX "creative_brief_activity_log_creativeBriefId_idx" ON "creative_brief_activity_log"("creativeBriefId");

-- CreateIndex
CREATE INDEX "creative_brief_activity_log_userId_idx" ON "creative_brief_activity_log"("userId");

-- CreateIndex
CREATE INDEX "creative_brief_activity_log_action_idx" ON "creative_brief_activity_log"("action");

-- CreateIndex
CREATE INDEX "creative_brief_activity_log_createdAt_idx" ON "creative_brief_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "creative_brief" ADD CONSTRAINT "creative_brief_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_brief" ADD CONSTRAINT "creative_brief_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_brief_reference_image" ADD CONSTRAINT "creative_brief_reference_image_creativeBriefId_fkey" FOREIGN KEY ("creativeBriefId") REFERENCES "creative_brief"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_brief_activity_log" ADD CONSTRAINT "creative_brief_activity_log_creativeBriefId_fkey" FOREIGN KEY ("creativeBriefId") REFERENCES "creative_brief"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
