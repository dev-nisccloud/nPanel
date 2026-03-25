-- CreateEnum
CREATE TYPE "SocialMediaPlatform" AS ENUM ('META_FACEBOOK', 'META_INSTAGRAM', 'TWITTER', 'LINKEDIN', 'TIKTOK');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'REVOKED', 'PENDING');

-- CreateTable
CREATE TABLE "social_media_integration" (
    "_id" TEXT NOT NULL,
    "platform" "SocialMediaPlatform" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'PENDING',
    "accessToken" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "tokenType" TEXT,
    "lastTokenRefreshAt" TIMESTAMP(3),
    "platformUserId" TEXT,
    "platformUserName" TEXT,
    "platformUserPicture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_media_integration_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "social_media_page_token" (
    "_id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "teamId" TEXT,
    "pageId" TEXT NOT NULL,
    "pageName" TEXT,
    "pageUsername" TEXT,
    "pagePicture" TEXT,
    "pageCategory" TEXT,
    "accessToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "social_media_page_token_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "social_media_integration_platform_idx" ON "social_media_integration"("platform");

-- CreateIndex
CREATE INDEX "social_media_integration_status_idx" ON "social_media_integration"("status");

-- CreateIndex
CREATE INDEX "social_media_integration_platformUserId_idx" ON "social_media_integration"("platformUserId");

-- CreateIndex
CREATE INDEX "social_media_page_token_integrationId_idx" ON "social_media_page_token"("integrationId");

-- CreateIndex
CREATE INDEX "social_media_page_token_pageId_idx" ON "social_media_page_token"("pageId");

-- CreateIndex
CREATE INDEX "social_media_page_token_teamId_idx" ON "social_media_page_token"("teamId");

-- CreateIndex
CREATE INDEX "social_media_page_token_isActive_idx" ON "social_media_page_token"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "social_media_page_token_integrationId_pageId_key" ON "social_media_page_token"("integrationId", "pageId");

-- AddForeignKey
ALTER TABLE "social_media_page_token" ADD CONSTRAINT "social_media_page_token_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "social_media_integration"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_page_token" ADD CONSTRAINT "social_media_page_token_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_page_token" ADD CONSTRAINT "social_media_page_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
