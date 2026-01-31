-- CreateEnum
CREATE TYPE "CampaignSendJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "email_campaign_send_job" (
    "_id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "status" "CampaignSendJobStatus" NOT NULL DEFAULT 'QUEUED',
    "qstashMessageId" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaign_send_job_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "email_campaign_send_job_campaignId_idx" ON "email_campaign_send_job"("campaignId");

-- CreateIndex
CREATE INDEX "email_campaign_send_job_status_idx" ON "email_campaign_send_job"("status");

-- CreateIndex
CREATE INDEX "email_campaign_send_job_scheduledFor_idx" ON "email_campaign_send_job"("scheduledFor");

-- CreateIndex
CREATE INDEX "email_campaign_send_job_qstashMessageId_idx" ON "email_campaign_send_job"("qstashMessageId");

-- AddForeignKey
ALTER TABLE "email_campaign_send_job" ADD CONSTRAINT "email_campaign_send_job_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "email_campaign"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
