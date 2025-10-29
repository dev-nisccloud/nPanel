-- CreateEnum
CREATE TYPE "EmailDomainVerificationStatus" AS ENUM ('PENDING', 'VERIFYING', 'VERIFIED', 'FAILED', 'TEMPORARY_FAILURE');

-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AudienceContactStatus" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED');

-- CreateEnum
CREATE TYPE "EmailEventType" AS ENUM ('SEND', 'DELIVERY', 'BOUNCE', 'COMPLAINT', 'OPEN', 'CLICK', 'REJECT', 'RENDERING_FAILURE');

-- AlterTable
ALTER TABLE "team_invite" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "team_member" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "email_domain" (
    "_id" TEXT NOT NULL,
    "teamId" TEXT,
    "userId" TEXT NOT NULL,
    "domainName" TEXT NOT NULL,
    "verificationStatus" "EmailDomainVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "dkimTokens" JSONB,
    "spfRecord" TEXT,
    "dmarcRecord" TEXT,
    "sesIdentityArn" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastVerificationAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_domain_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "email_campaign" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teamId" TEXT,
    "userId" TEXT NOT NULL,
    "emailDomainId" TEXT NOT NULL,
    "audienceId" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "replyToAddress" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "status" "EmailCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalRecipients" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaign_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "audience" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teamId" TEXT,
    "userId" TEXT NOT NULL,
    "status" TEXT,
    "totalContacts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audience_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "audience_contact" (
    "_id" TEXT NOT NULL,
    "audienceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "customFields" JSONB,
    "status" "AudienceContactStatus" NOT NULL DEFAULT 'SUBSCRIBED',
    "subscribedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audience_contact_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "email_log" (
    "_id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "audienceContactId" TEXT NOT NULL,
    "messageId" TEXT,
    "eventType" "EmailEventType" NOT NULL,
    "eventData" JSONB,
    "timestamp" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "linkUrl" TEXT,
    "bounceType" TEXT,
    "bounceSubType" TEXT,
    "complaintFeedbackType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "ses_configuration" (
    "_id" TEXT NOT NULL,
    "configurationSetName" TEXT NOT NULL,
    "snsTopicArn" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dailySendingQuota" INTEGER,
    "maxSendRate" INTEGER,
    "reputationMetrics" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ses_configuration_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "email_domain_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailDomainId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_domain_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "email_campaign_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailCampaignId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaign_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "audience_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "audienceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audience_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_domain_domainName_key" ON "email_domain"("domainName");

-- CreateIndex
CREATE INDEX "email_domain_domainName_idx" ON "email_domain"("domainName");

-- CreateIndex
CREATE INDEX "email_domain_teamId_idx" ON "email_domain"("teamId");

-- CreateIndex
CREATE INDEX "email_domain_userId_idx" ON "email_domain"("userId");

-- CreateIndex
CREATE INDEX "email_domain_verificationStatus_idx" ON "email_domain"("verificationStatus");

-- CreateIndex
CREATE INDEX "email_domain_isVerified_idx" ON "email_domain"("isVerified");

-- CreateIndex
CREATE INDEX "email_campaign_teamId_idx" ON "email_campaign"("teamId");

-- CreateIndex
CREATE INDEX "email_campaign_userId_idx" ON "email_campaign"("userId");

-- CreateIndex
CREATE INDEX "email_campaign_emailDomainId_idx" ON "email_campaign"("emailDomainId");

-- CreateIndex
CREATE INDEX "email_campaign_audienceId_idx" ON "email_campaign"("audienceId");

-- CreateIndex
CREATE INDEX "email_campaign_status_idx" ON "email_campaign"("status");

-- CreateIndex
CREATE INDEX "email_campaign_scheduledAt_idx" ON "email_campaign"("scheduledAt");

-- CreateIndex
CREATE INDEX "audience_teamId_idx" ON "audience"("teamId");

-- CreateIndex
CREATE INDEX "audience_userId_idx" ON "audience"("userId");

-- CreateIndex
CREATE INDEX "audience_status_idx" ON "audience"("status");

-- CreateIndex
CREATE INDEX "audience_contact_audienceId_idx" ON "audience_contact"("audienceId");

-- CreateIndex
CREATE INDEX "audience_contact_email_idx" ON "audience_contact"("email");

-- CreateIndex
CREATE INDEX "audience_contact_status_idx" ON "audience_contact"("status");

-- CreateIndex
CREATE UNIQUE INDEX "audience_contact_audienceId_email_key" ON "audience_contact"("audienceId", "email");

-- CreateIndex
CREATE INDEX "email_log_campaignId_idx" ON "email_log"("campaignId");

-- CreateIndex
CREATE INDEX "email_log_audienceContactId_idx" ON "email_log"("audienceContactId");

-- CreateIndex
CREATE INDEX "email_log_messageId_idx" ON "email_log"("messageId");

-- CreateIndex
CREATE INDEX "email_log_eventType_idx" ON "email_log"("eventType");

-- CreateIndex
CREATE INDEX "email_log_timestamp_idx" ON "email_log"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ses_configuration_configurationSetName_key" ON "ses_configuration"("configurationSetName");

-- CreateIndex
CREATE INDEX "ses_configuration_isActive_idx" ON "ses_configuration"("isActive");

-- CreateIndex
CREATE INDEX "ses_configuration_configurationSetName_idx" ON "ses_configuration"("configurationSetName");

-- CreateIndex
CREATE INDEX "email_domain_activity_log_userId_idx" ON "email_domain_activity_log"("userId");

-- CreateIndex
CREATE INDEX "email_domain_activity_log_emailDomainId_idx" ON "email_domain_activity_log"("emailDomainId");

-- CreateIndex
CREATE INDEX "email_domain_activity_log_action_idx" ON "email_domain_activity_log"("action");

-- CreateIndex
CREATE INDEX "email_domain_activity_log_createdAt_idx" ON "email_domain_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "email_campaign_activity_log_userId_idx" ON "email_campaign_activity_log"("userId");

-- CreateIndex
CREATE INDEX "email_campaign_activity_log_emailCampaignId_idx" ON "email_campaign_activity_log"("emailCampaignId");

-- CreateIndex
CREATE INDEX "email_campaign_activity_log_action_idx" ON "email_campaign_activity_log"("action");

-- CreateIndex
CREATE INDEX "email_campaign_activity_log_createdAt_idx" ON "email_campaign_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "audience_activity_log_userId_idx" ON "audience_activity_log"("userId");

-- CreateIndex
CREATE INDEX "audience_activity_log_audienceId_idx" ON "audience_activity_log"("audienceId");

-- CreateIndex
CREATE INDEX "audience_activity_log_action_idx" ON "audience_activity_log"("action");

-- CreateIndex
CREATE INDEX "audience_activity_log_createdAt_idx" ON "audience_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "email_domain" ADD CONSTRAINT "email_domain_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_domain" ADD CONSTRAINT "email_domain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaign" ADD CONSTRAINT "email_campaign_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaign" ADD CONSTRAINT "email_campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaign" ADD CONSTRAINT "email_campaign_emailDomainId_fkey" FOREIGN KEY ("emailDomainId") REFERENCES "email_domain"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaign" ADD CONSTRAINT "email_campaign_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "audience"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audience" ADD CONSTRAINT "audience_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audience" ADD CONSTRAINT "audience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audience_contact" ADD CONSTRAINT "audience_contact_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "audience"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "email_campaign"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_audienceContactId_fkey" FOREIGN KEY ("audienceContactId") REFERENCES "audience_contact"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_domain_activity_log" ADD CONSTRAINT "email_domain_activity_log_emailDomainId_fkey" FOREIGN KEY ("emailDomainId") REFERENCES "email_domain"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaign_activity_log" ADD CONSTRAINT "email_campaign_activity_log_emailCampaignId_fkey" FOREIGN KEY ("emailCampaignId") REFERENCES "email_campaign"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audience_activity_log" ADD CONSTRAINT "audience_activity_log_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "audience"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
