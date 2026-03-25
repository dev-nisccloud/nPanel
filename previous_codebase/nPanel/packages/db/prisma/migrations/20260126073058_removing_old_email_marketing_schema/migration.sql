/*
  Warnings:

  - You are about to drop the `audience` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audience_activity_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audience_contact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `email_campaign` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `email_campaign_activity_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `email_domain` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `email_domain_activity_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `email_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ses_configuration` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."audience" DROP CONSTRAINT "audience_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."audience" DROP CONSTRAINT "audience_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."audience_activity_log" DROP CONSTRAINT "audience_activity_log_audienceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."audience_contact" DROP CONSTRAINT "audience_contact_audienceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_campaign" DROP CONSTRAINT "email_campaign_audienceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_campaign" DROP CONSTRAINT "email_campaign_emailDomainId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_campaign" DROP CONSTRAINT "email_campaign_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_campaign" DROP CONSTRAINT "email_campaign_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_campaign_activity_log" DROP CONSTRAINT "email_campaign_activity_log_emailCampaignId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_domain" DROP CONSTRAINT "email_domain_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_domain" DROP CONSTRAINT "email_domain_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_domain_activity_log" DROP CONSTRAINT "email_domain_activity_log_emailDomainId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_log" DROP CONSTRAINT "email_log_audienceContactId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_log" DROP CONSTRAINT "email_log_campaignId_fkey";

-- DropTable
DROP TABLE "public"."audience";

-- DropTable
DROP TABLE "public"."audience_activity_log";

-- DropTable
DROP TABLE "public"."audience_contact";

-- DropTable
DROP TABLE "public"."email_campaign";

-- DropTable
DROP TABLE "public"."email_campaign_activity_log";

-- DropTable
DROP TABLE "public"."email_domain";

-- DropTable
DROP TABLE "public"."email_domain_activity_log";

-- DropTable
DROP TABLE "public"."email_log";

-- DropTable
DROP TABLE "public"."ses_configuration";

-- DropEnum
DROP TYPE "public"."AudienceContactStatus";

-- DropEnum
DROP TYPE "public"."EmailCampaignStatus";

-- DropEnum
DROP TYPE "public"."EmailDomainVerificationStatus";

-- DropEnum
DROP TYPE "public"."EmailEventType";
