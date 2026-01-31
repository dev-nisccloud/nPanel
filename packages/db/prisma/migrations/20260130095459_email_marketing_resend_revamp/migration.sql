/*
  Warnings:

  - You are about to drop the `campaign` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `campaign_activity_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contact_activity_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `email_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `email_log_activity_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `email_template` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailEventType" AS ENUM ('email_bounced', 'email_clicked', 'email_complained', 'email_delivered', 'email_delivery_delayed', 'email_failed', 'email_opened', 'email_received', 'email_scheduled', 'email_sent', 'email_suppressed');

-- DropForeignKey
ALTER TABLE "public"."campaign" DROP CONSTRAINT "campaign_emailDomainId_fkey";

-- DropForeignKey
ALTER TABLE "public"."campaign" DROP CONSTRAINT "campaign_emailTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."campaign" DROP CONSTRAINT "campaign_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."campaign" DROP CONSTRAINT "campaign_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."campaign_activity_log" DROP CONSTRAINT "campaign_activity_log_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "public"."contact" DROP CONSTRAINT "contact_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."contact" DROP CONSTRAINT "contact_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."contact_activity_log" DROP CONSTRAINT "contact_activity_log_contactId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_log" DROP CONSTRAINT "email_log_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_log" DROP CONSTRAINT "email_log_contactId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_log" DROP CONSTRAINT "email_log_emailDomainId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_log" DROP CONSTRAINT "email_log_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_log" DROP CONSTRAINT "email_log_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_log_activity_log" DROP CONSTRAINT "email_log_activity_log_emailLogId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_template" DROP CONSTRAINT "email_template_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_template" DROP CONSTRAINT "email_template_userId_fkey";

-- DropTable
DROP TABLE "public"."campaign";

-- DropTable
DROP TABLE "public"."campaign_activity_log";

-- DropTable
DROP TABLE "public"."contact";

-- DropTable
DROP TABLE "public"."contact_activity_log";

-- DropTable
DROP TABLE "public"."email_log";

-- DropTable
DROP TABLE "public"."email_log_activity_log";

-- DropTable
DROP TABLE "public"."email_template";

-- DropEnum
DROP TYPE "public"."CampaignStatus";

-- DropEnum
DROP TYPE "public"."CampaignType";

-- DropEnum
DROP TYPE "public"."ContactStatus";

-- DropEnum
DROP TYPE "public"."EmailLogStatus";

-- DropEnum
DROP TYPE "public"."EmailLogType";

-- CreateTable
CREATE TABLE "email_campaign" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "status" "EmailCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "htmlContent" TEXT,
    "textContent" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "emailDomainId" TEXT,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaign_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "campaign_recipient" (
    "_id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "resendId" TEXT,
    "resendMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_recipient_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "email_event" (
    "_id" TEXT NOT NULL,
    "campaignRecipientId" TEXT NOT NULL,
    "type" "EmailEventType" NOT NULL,
    "eventCreatedAt" TIMESTAMP(3) NOT NULL,
    "resendEmailId" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_event_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "email_event_activity_log" (
    "_id" TEXT NOT NULL,
    "emailEventId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_event_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "email_campaign_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaign_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "email_campaign_emailDomainId_idx" ON "email_campaign"("emailDomainId");

-- CreateIndex
CREATE INDEX "email_campaign_userId_idx" ON "email_campaign"("userId");

-- CreateIndex
CREATE INDEX "email_campaign_teamId_idx" ON "email_campaign"("teamId");

-- CreateIndex
CREATE INDEX "email_campaign_status_idx" ON "email_campaign"("status");

-- CreateIndex
CREATE INDEX "email_campaign_scheduledAt_idx" ON "email_campaign"("scheduledAt");

-- CreateIndex
CREATE INDEX "campaign_recipient_campaignId_idx" ON "campaign_recipient"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_recipient_toEmail_idx" ON "campaign_recipient"("toEmail");

-- CreateIndex
CREATE INDEX "campaign_recipient_resendId_idx" ON "campaign_recipient"("resendId");

-- CreateIndex
CREATE INDEX "email_event_campaignRecipientId_idx" ON "email_event"("campaignRecipientId");

-- CreateIndex
CREATE INDEX "email_event_type_idx" ON "email_event"("type");

-- CreateIndex
CREATE INDEX "email_event_eventCreatedAt_idx" ON "email_event"("eventCreatedAt");

-- CreateIndex
CREATE INDEX "email_event_resendEmailId_idx" ON "email_event"("resendEmailId");

-- CreateIndex
CREATE INDEX "email_event_activity_log_emailEventId_idx" ON "email_event_activity_log"("emailEventId");

-- CreateIndex
CREATE INDEX "email_event_activity_log_action_idx" ON "email_event_activity_log"("action");

-- CreateIndex
CREATE INDEX "email_event_activity_log_createdAt_idx" ON "email_event_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "email_campaign_activity_log_userId_idx" ON "email_campaign_activity_log"("userId");

-- CreateIndex
CREATE INDEX "email_campaign_activity_log_campaignId_idx" ON "email_campaign_activity_log"("campaignId");

-- CreateIndex
CREATE INDEX "email_campaign_activity_log_action_idx" ON "email_campaign_activity_log"("action");

-- CreateIndex
CREATE INDEX "email_campaign_activity_log_createdAt_idx" ON "email_campaign_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "email_campaign" ADD CONSTRAINT "email_campaign_emailDomainId_fkey" FOREIGN KEY ("emailDomainId") REFERENCES "email_domain"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaign" ADD CONSTRAINT "email_campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaign" ADD CONSTRAINT "email_campaign_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_recipient" ADD CONSTRAINT "campaign_recipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "email_campaign"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_event" ADD CONSTRAINT "email_event_campaignRecipientId_fkey" FOREIGN KEY ("campaignRecipientId") REFERENCES "campaign_recipient"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_event_activity_log" ADD CONSTRAINT "email_event_activity_log_emailEventId_fkey" FOREIGN KEY ("emailEventId") REFERENCES "email_event"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaign_activity_log" ADD CONSTRAINT "email_campaign_activity_log_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "email_campaign"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
