/*
  Warnings:

  - You are about to drop the column `platformUserId` on the `social_media_integration` table. All the data in the column will be lost.
  - You are about to drop the column `platformUserName` on the `social_media_integration` table. All the data in the column will be lost.
  - You are about to drop the column `platformUserPicture` on the `social_media_integration` table. All the data in the column will be lost.
  - Added the required column `userId` to the `social_media_integration` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."social_media_integration_platformUserId_idx";

-- AlterTable
ALTER TABLE "social_media_integration" DROP COLUMN "platformUserId",
DROP COLUMN "platformUserName",
DROP COLUMN "platformUserPicture",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "social_media_integration_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_media_integration_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "social_media_page_token_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pageTokenId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_media_page_token_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "social_media_integration_activity_log_userId_idx" ON "social_media_integration_activity_log"("userId");

-- CreateIndex
CREATE INDEX "social_media_integration_activity_log_integrationId_idx" ON "social_media_integration_activity_log"("integrationId");

-- CreateIndex
CREATE INDEX "social_media_integration_activity_log_action_idx" ON "social_media_integration_activity_log"("action");

-- CreateIndex
CREATE INDEX "social_media_integration_activity_log_createdAt_idx" ON "social_media_integration_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "social_media_page_token_activity_log_userId_idx" ON "social_media_page_token_activity_log"("userId");

-- CreateIndex
CREATE INDEX "social_media_page_token_activity_log_pageTokenId_idx" ON "social_media_page_token_activity_log"("pageTokenId");

-- CreateIndex
CREATE INDEX "social_media_page_token_activity_log_action_idx" ON "social_media_page_token_activity_log"("action");

-- CreateIndex
CREATE INDEX "social_media_page_token_activity_log_createdAt_idx" ON "social_media_page_token_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "social_media_integration_userId_idx" ON "social_media_integration"("userId");

-- CreateIndex
CREATE INDEX "social_media_page_token_userId_idx" ON "social_media_page_token"("userId");

-- AddForeignKey
ALTER TABLE "social_media_integration" ADD CONSTRAINT "social_media_integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_integration_activity_log" ADD CONSTRAINT "social_media_integration_activity_log_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "social_media_integration"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_page_token_activity_log" ADD CONSTRAINT "social_media_page_token_activity_log_pageTokenId_fkey" FOREIGN KEY ("pageTokenId") REFERENCES "social_media_page_token"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
