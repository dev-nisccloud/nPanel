-- CreateEnum
CREATE TYPE "MetaContentCalendarStatus" AS ENUM ('SCHEDULED', 'PUBLISHED', 'FAILED', 'CANCELLED', 'DRAFT');

-- CreateEnum
CREATE TYPE "MetaContentMediaType" AS ENUM ('PHOTO', 'VIDEO');

-- CreateTable
CREATE TABLE "meta_content_calendar" (
    "_id" TEXT NOT NULL,
    "pageTokenId" TEXT,
    "message" TEXT,
    "scheduledPublishTime" TIMESTAMP(3) NOT NULL,
    "status" "MetaContentCalendarStatus" NOT NULL DEFAULT 'SCHEDULED',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "publishedPostId" TEXT,
    "publishedPermalink" TEXT,
    "lastError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_content_calendar_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "meta_content_calendar_media" (
    "_id" TEXT NOT NULL,
    "calendarPostId" TEXT NOT NULL,
    "mediaType" "MetaContentMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_content_calendar_media_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "meta_content_calendar_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calendarPostId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_content_calendar_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "meta_content_calendar_pageTokenId_idx" ON "meta_content_calendar"("pageTokenId");

-- CreateIndex
CREATE INDEX "meta_content_calendar_status_idx" ON "meta_content_calendar"("status");

-- CreateIndex
CREATE INDEX "meta_content_calendar_scheduledPublishTime_idx" ON "meta_content_calendar"("scheduledPublishTime");

-- CreateIndex
CREATE INDEX "meta_content_calendar_published_idx" ON "meta_content_calendar"("published");

-- CreateIndex
CREATE INDEX "meta_content_calendar_createdBy_idx" ON "meta_content_calendar"("createdBy");

-- CreateIndex
CREATE INDEX "meta_content_calendar_createdAt_idx" ON "meta_content_calendar"("createdAt");

-- CreateIndex
CREATE INDEX "meta_content_calendar_media_calendarPostId_idx" ON "meta_content_calendar_media"("calendarPostId");

-- CreateIndex
CREATE INDEX "meta_content_calendar_media_mediaType_idx" ON "meta_content_calendar_media"("mediaType");

-- CreateIndex
CREATE INDEX "meta_content_calendar_media_order_idx" ON "meta_content_calendar_media"("order");

-- CreateIndex
CREATE INDEX "meta_content_calendar_activity_log_userId_idx" ON "meta_content_calendar_activity_log"("userId");

-- CreateIndex
CREATE INDEX "meta_content_calendar_activity_log_calendarPostId_idx" ON "meta_content_calendar_activity_log"("calendarPostId");

-- CreateIndex
CREATE INDEX "meta_content_calendar_activity_log_action_idx" ON "meta_content_calendar_activity_log"("action");

-- CreateIndex
CREATE INDEX "meta_content_calendar_activity_log_createdAt_idx" ON "meta_content_calendar_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "meta_content_calendar" ADD CONSTRAINT "meta_content_calendar_pageTokenId_fkey" FOREIGN KEY ("pageTokenId") REFERENCES "social_media_page_token"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_content_calendar" ADD CONSTRAINT "meta_content_calendar_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_content_calendar_media" ADD CONSTRAINT "meta_content_calendar_media_calendarPostId_fkey" FOREIGN KEY ("calendarPostId") REFERENCES "meta_content_calendar"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_content_calendar_activity_log" ADD CONSTRAINT "meta_content_calendar_activity_log_calendarPostId_fkey" FOREIGN KEY ("calendarPostId") REFERENCES "meta_content_calendar"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
