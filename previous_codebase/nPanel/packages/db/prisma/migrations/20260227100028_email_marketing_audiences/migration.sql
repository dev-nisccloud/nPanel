-- CreateEnum
CREATE TYPE "AudienceContactStatus" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED');

-- CreateTable
CREATE TABLE "email_audience" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_audience_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "email_audience_contact" (
    "_id" TEXT NOT NULL,
    "audienceId" TEXT NOT NULL,
    "name" TEXT,
    "phoneNumber" TEXT,
    "emailAddress" TEXT,
    "description" TEXT,
    "company" TEXT,
    "status" "AudienceContactStatus" DEFAULT 'SUBSCRIBED',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_audience_contact_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "email_audience_userId_idx" ON "email_audience"("userId");

-- CreateIndex
CREATE INDEX "email_audience_teamId_idx" ON "email_audience"("teamId");

-- CreateIndex
CREATE INDEX "email_audience_createdAt_idx" ON "email_audience"("createdAt");

-- CreateIndex
CREATE INDEX "email_audience_contact_audienceId_idx" ON "email_audience_contact"("audienceId");

-- CreateIndex
CREATE INDEX "email_audience_contact_emailAddress_idx" ON "email_audience_contact"("emailAddress");

-- CreateIndex
CREATE INDEX "email_audience_contact_status_idx" ON "email_audience_contact"("status");

-- AddForeignKey
ALTER TABLE "email_audience" ADD CONSTRAINT "email_audience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_audience" ADD CONSTRAINT "email_audience_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_audience_contact" ADD CONSTRAINT "email_audience_contact_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "email_audience"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
