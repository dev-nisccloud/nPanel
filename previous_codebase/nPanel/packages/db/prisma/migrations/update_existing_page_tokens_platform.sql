-- Migration: Add platform field to existing SocialMediaPageToken records
-- This migration sets all existing page tokens to META_FACEBOOK platform
-- since they were created before the platform field was added

-- Step 1: Add platform column (if not already added by Prisma migration)
-- Note: This will be handled by Prisma migration, but included for reference
-- ALTER TABLE "social_media_page_token" ADD COLUMN IF NOT EXISTS "platform" "SocialMediaPlatform" NOT NULL DEFAULT 'META_FACEBOOK';

-- Step 2: Update all existing records to META_FACEBOOK
-- This ensures all existing Meta/Facebook page tokens have the correct platform
UPDATE "social_media_page_token"
SET "platform" = 'META_FACEBOOK'
WHERE "platform" IS NULL OR "platform" != 'META_FACEBOOK';

-- Step 3: Create index on platform column (if not already created by Prisma)
-- CREATE INDEX IF NOT EXISTS "social_media_page_token_platform_idx" ON "social_media_page_token"("platform");




