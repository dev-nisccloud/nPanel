-- CreateEnum
CREATE TYPE "EmailDomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('TRANSACTIONAL', 'MARKETING');

-- CreateEnum
CREATE TYPE "EmailLogStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'BOUNCED', 'FAILED', 'OPENED', 'CLICKED', 'COMPLAINED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "EmailLogType" AS ENUM ('TRANSACTIONAL', 'CAMPAIGN');

-- CreateTable
CREATE TABLE "email_domain" (
    "_id" TEXT NOT NULL,
    "domainName" TEXT NOT NULL,
    "resendDomainId" TEXT,
    "status" "EmailDomainStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "verificationStatus" TEXT,
    "verificationData" JSONB,
    "dnsRecords" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "email_domain_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "contact" (
    "_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "jobTitle" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "status" "ContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastContactedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "contact_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "audience" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "contactCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audience_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "audience_contact" (
    "_id" TEXT NOT NULL,
    "audienceId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audience_contact_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "campaign" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "type" "CampaignType" NOT NULL DEFAULT 'MARKETING',
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "audienceId" TEXT NOT NULL,
    "emailDomainId" TEXT,
    "htmlContent" TEXT,
    "textContent" TEXT,
    "templateId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "bouncedCount" INTEGER NOT NULL DEFAULT 0,
    "complainedCount" INTEGER NOT NULL DEFAULT 0,
    "unsubscribedCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "email_log" (
    "_id" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" "EmailLogType" NOT NULL DEFAULT 'TRANSACTIONAL',
    "status" "EmailLogStatus" NOT NULL DEFAULT 'PENDING',
    "resendEmailId" TEXT,
    "resendMessageId" TEXT,
    "emailDomainId" TEXT,
    "campaignId" TEXT,
    "contactId" TEXT,
    "htmlContent" TEXT,
    "textContent" TEXT,
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "complainedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "userId" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("_id")
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
CREATE TABLE "contact_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_activity_log_pkey" PRIMARY KEY ("_id")
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

-- CreateTable
CREATE TABLE "campaign_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "email_log_activity_log" (
    "_id" TEXT NOT NULL,
    "userId" TEXT,
    "emailLogId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_log_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_domain_domainName_key" ON "email_domain"("domainName");

-- CreateIndex
CREATE INDEX "email_domain_userId_idx" ON "email_domain"("userId");

-- CreateIndex
CREATE INDEX "email_domain_teamId_idx" ON "email_domain"("teamId");

-- CreateIndex
CREATE INDEX "email_domain_status_idx" ON "email_domain"("status");

-- CreateIndex
CREATE INDEX "email_domain_domainName_idx" ON "email_domain"("domainName");

-- CreateIndex
CREATE INDEX "contact_email_idx" ON "contact"("email");

-- CreateIndex
CREATE INDEX "contact_userId_idx" ON "contact"("userId");

-- CreateIndex
CREATE INDEX "contact_teamId_idx" ON "contact"("teamId");

-- CreateIndex
CREATE INDEX "contact_status_idx" ON "contact"("status");

-- CreateIndex
CREATE INDEX "contact_createdAt_idx" ON "contact"("createdAt");

-- CreateIndex
CREATE INDEX "audience_userId_idx" ON "audience"("userId");

-- CreateIndex
CREATE INDEX "audience_teamId_idx" ON "audience"("teamId");

-- CreateIndex
CREATE INDEX "audience_name_idx" ON "audience"("name");

-- CreateIndex
CREATE INDEX "audience_contact_audienceId_idx" ON "audience_contact"("audienceId");

-- CreateIndex
CREATE INDEX "audience_contact_contactId_idx" ON "audience_contact"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "audience_contact_audienceId_contactId_key" ON "audience_contact"("audienceId", "contactId");

-- CreateIndex
CREATE INDEX "campaign_audienceId_idx" ON "campaign"("audienceId");

-- CreateIndex
CREATE INDEX "campaign_emailDomainId_idx" ON "campaign"("emailDomainId");

-- CreateIndex
CREATE INDEX "campaign_userId_idx" ON "campaign"("userId");

-- CreateIndex
CREATE INDEX "campaign_teamId_idx" ON "campaign"("teamId");

-- CreateIndex
CREATE INDEX "campaign_status_idx" ON "campaign"("status");

-- CreateIndex
CREATE INDEX "campaign_type_idx" ON "campaign"("type");

-- CreateIndex
CREATE INDEX "campaign_scheduledAt_idx" ON "campaign"("scheduledAt");

-- CreateIndex
CREATE INDEX "email_log_emailDomainId_idx" ON "email_log"("emailDomainId");

-- CreateIndex
CREATE INDEX "email_log_campaignId_idx" ON "email_log"("campaignId");

-- CreateIndex
CREATE INDEX "email_log_contactId_idx" ON "email_log"("contactId");

-- CreateIndex
CREATE INDEX "email_log_userId_idx" ON "email_log"("userId");

-- CreateIndex
CREATE INDEX "email_log_teamId_idx" ON "email_log"("teamId");

-- CreateIndex
CREATE INDEX "email_log_status_idx" ON "email_log"("status");

-- CreateIndex
CREATE INDEX "email_log_type_idx" ON "email_log"("type");

-- CreateIndex
CREATE INDEX "email_log_toEmail_idx" ON "email_log"("toEmail");

-- CreateIndex
CREATE INDEX "email_log_sentAt_idx" ON "email_log"("sentAt");

-- CreateIndex
CREATE INDEX "email_domain_activity_log_userId_idx" ON "email_domain_activity_log"("userId");

-- CreateIndex
CREATE INDEX "email_domain_activity_log_emailDomainId_idx" ON "email_domain_activity_log"("emailDomainId");

-- CreateIndex
CREATE INDEX "email_domain_activity_log_action_idx" ON "email_domain_activity_log"("action");

-- CreateIndex
CREATE INDEX "email_domain_activity_log_createdAt_idx" ON "email_domain_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "contact_activity_log_userId_idx" ON "contact_activity_log"("userId");

-- CreateIndex
CREATE INDEX "contact_activity_log_contactId_idx" ON "contact_activity_log"("contactId");

-- CreateIndex
CREATE INDEX "contact_activity_log_action_idx" ON "contact_activity_log"("action");

-- CreateIndex
CREATE INDEX "contact_activity_log_createdAt_idx" ON "contact_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "audience_activity_log_userId_idx" ON "audience_activity_log"("userId");

-- CreateIndex
CREATE INDEX "audience_activity_log_audienceId_idx" ON "audience_activity_log"("audienceId");

-- CreateIndex
CREATE INDEX "audience_activity_log_action_idx" ON "audience_activity_log"("action");

-- CreateIndex
CREATE INDEX "audience_activity_log_createdAt_idx" ON "audience_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "campaign_activity_log_userId_idx" ON "campaign_activity_log"("userId");

-- CreateIndex
CREATE INDEX "campaign_activity_log_campaignId_idx" ON "campaign_activity_log"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_activity_log_action_idx" ON "campaign_activity_log"("action");

-- CreateIndex
CREATE INDEX "campaign_activity_log_createdAt_idx" ON "campaign_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "email_log_activity_log_userId_idx" ON "email_log_activity_log"("userId");

-- CreateIndex
CREATE INDEX "email_log_activity_log_emailLogId_idx" ON "email_log_activity_log"("emailLogId");

-- CreateIndex
CREATE INDEX "email_log_activity_log_action_idx" ON "email_log_activity_log"("action");

-- CreateIndex
CREATE INDEX "email_log_activity_log_createdAt_idx" ON "email_log_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "email_domain" ADD CONSTRAINT "email_domain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_domain" ADD CONSTRAINT "email_domain_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "contact_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audience" ADD CONSTRAINT "audience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audience" ADD CONSTRAINT "audience_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audience_contact" ADD CONSTRAINT "audience_contact_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "audience"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audience_contact" ADD CONSTRAINT "audience_contact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "audience"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_emailDomainId_fkey" FOREIGN KEY ("emailDomainId") REFERENCES "email_domain"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_emailDomainId_fkey" FOREIGN KEY ("emailDomainId") REFERENCES "email_domain"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_domain_activity_log" ADD CONSTRAINT "email_domain_activity_log_emailDomainId_fkey" FOREIGN KEY ("emailDomainId") REFERENCES "email_domain"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_activity_log" ADD CONSTRAINT "contact_activity_log_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audience_activity_log" ADD CONSTRAINT "audience_activity_log_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "audience"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_activity_log" ADD CONSTRAINT "campaign_activity_log_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log_activity_log" ADD CONSTRAINT "email_log_activity_log_emailLogId_fkey" FOREIGN KEY ("emailLogId") REFERENCES "email_log"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
