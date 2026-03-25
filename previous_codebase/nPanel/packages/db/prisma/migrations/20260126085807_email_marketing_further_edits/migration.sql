/*
  Warnings:

  - You are about to drop the column `audienceId` on the `campaign` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `campaign` table. All the data in the column will be lost.
  - You are about to drop the `audience` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audience_activity_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audience_contact` table. If the table is not empty, all the data it contains will be lost.

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
ALTER TABLE "public"."audience_contact" DROP CONSTRAINT "audience_contact_contactId_fkey";

-- DropForeignKey
ALTER TABLE "public"."campaign" DROP CONSTRAINT "campaign_audienceId_fkey";

-- DropIndex
DROP INDEX "public"."campaign_audienceId_idx";

-- AlterTable
ALTER TABLE "campaign" DROP COLUMN "audienceId",
DROP COLUMN "templateId",
ADD COLUMN     "emailTemplateId" TEXT,
ADD COLUMN     "recipientEmails" TEXT[];

-- DropTable
DROP TABLE "public"."audience";

-- DropTable
DROP TABLE "public"."audience_activity_log";

-- DropTable
DROP TABLE "public"."audience_contact";

-- CreateTable
CREATE TABLE "email_template" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "htmlContent" TEXT,
    "textContent" TEXT,
    "variables" JSONB,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_template_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "email_template_userId_idx" ON "email_template"("userId");

-- CreateIndex
CREATE INDEX "email_template_teamId_idx" ON "email_template"("teamId");

-- CreateIndex
CREATE INDEX "email_template_name_idx" ON "email_template"("name");

-- CreateIndex
CREATE INDEX "email_template_isActive_idx" ON "email_template"("isActive");

-- CreateIndex
CREATE INDEX "campaign_emailTemplateId_idx" ON "campaign"("emailTemplateId");

-- AddForeignKey
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_emailTemplateId_fkey" FOREIGN KEY ("emailTemplateId") REFERENCES "email_template"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
