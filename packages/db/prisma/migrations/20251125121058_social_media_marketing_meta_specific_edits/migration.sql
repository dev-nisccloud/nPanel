-- DropIndex
DROP INDEX "public"."social_media_page_token_userId_idx";

-- AlterTable
ALTER TABLE "social_media_page_token" ADD COLUMN     "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "lastTokenRefreshAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "social_media_page_token_accessTokenExpiresAt_idx" ON "social_media_page_token"("accessTokenExpiresAt");
