/*
  Warnings:

  - Added the required column `platform` to the `social_media_page_token` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LinkedInContentCalendarStatus" AS ENUM ('SCHEDULED', 'PUBLISHED', 'FAILED', 'CANCELLED', 'DRAFT');

-- CreateEnum
CREATE TYPE "LinkedInContentMediaType" AS ENUM ('PHOTO', 'VIDEO');

-- AlterTable
ALTER TABLE "social_media_page_token" ADD COLUMN     "platform" "SocialMediaPlatform" NOT NULL;

-- CreateTable
CREATE TABLE "linkedin_content_calendar" (
    "_id" TEXT NOT NULL,
    "pageTokenId" TEXT,
    "message" TEXT,
    "scheduledPublishTime" TIMESTAMP(3) NOT NULL,
    "status" "LinkedInContentCalendarStatus" NOT NULL DEFAULT 'SCHEDULED',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "publishedPostId" TEXT,
    "publishedPermalink" TEXT,
    "lastError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "qstashJobId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linkedin_content_calendar_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "linkedin_content_calendar_media" (
    "_id" TEXT NOT NULL,
    "calendarPostId" TEXT NOT NULL,
    "mediaType" "LinkedInContentMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "caption" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linkedin_content_calendar_media_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "linkedin_content_calendar_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calendarPostId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linkedin_content_calendar_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "linkedin_content_calendar_pageTokenId_idx" ON "linkedin_content_calendar"("pageTokenId");

-- CreateIndex
CREATE INDEX "linkedin_content_calendar_status_idx" ON "linkedin_content_calendar"("status");

-- CreateIndex
CREATE INDEX "linkedin_content_calendar_scheduledPublishTime_idx" ON "linkedin_content_calendar"("scheduledPublishTime");

-- CreateIndex
CREATE INDEX "linkedin_content_calendar_published_idx" ON "linkedin_content_calendar"("published");

-- CreateIndex
CREATE INDEX "linkedin_content_calendar_createdBy_idx" ON "linkedin_content_calendar"("createdBy");

-- CreateIndex
CREATE INDEX "linkedin_content_calendar_createdAt_idx" ON "linkedin_content_calendar"("createdAt");

-- CreateIndex
CREATE INDEX "linkedin_content_calendar_media_calendarPostId_idx" ON "linkedin_content_calendar_media"("calendarPostId");

-- CreateIndex
CREATE INDEX "linkedin_content_calendar_media_mediaType_idx" ON "linkedin_content_calendar_media"("mediaType");

-- CreateIndex
CREATE INDEX "linkedin_content_calendar_media_order_idx" ON "linkedin_content_calendar_media"("order");

-- CreateIndex
CREATE INDEX "linkedin_content_calendar_activity_log_userId_idx" ON "linkedin_content_calendar_activity_log"("userId");

-- CreateIndex
CREATE INDEX "linkedin_content_calendar_activity_log_calendarPostId_idx" ON "linkedin_content_calendar_activity_log"("calendarPostId");

-- CreateIndex
CREATE INDEX "linkedin_content_calendar_activity_log_action_idx" ON "linkedin_content_calendar_activity_log"("action");

-- CreateIndex
CREATE INDEX "linkedin_content_calendar_activity_log_createdAt_idx" ON "linkedin_content_calendar_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "social_media_page_token_platform_idx" ON "social_media_page_token"("platform");

-- AddForeignKey
ALTER TABLE "linkedin_content_calendar" ADD CONSTRAINT "linkedin_content_calendar_pageTokenId_fkey" FOREIGN KEY ("pageTokenId") REFERENCES "social_media_page_token"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_content_calendar" ADD CONSTRAINT "linkedin_content_calendar_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_content_calendar_media" ADD CONSTRAINT "linkedin_content_calendar_media_calendarPostId_fkey" FOREIGN KEY ("calendarPostId") REFERENCES "linkedin_content_calendar"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_content_calendar_activity_log" ADD CONSTRAINT "linkedin_content_calendar_activity_log_calendarPostId_fkey" FOREIGN KEY ("calendarPostId") REFERENCES "linkedin_content_calendar"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
