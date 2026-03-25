/*
  Warnings:

  - You are about to drop the column `apigeeAppId` on the `team_etims_settings` table. All the data in the column will be lost.
  - You are about to drop the column `authConsumerKey` on the `team_etims_settings` table. All the data in the column will be lost.
  - You are about to drop the column `authConsumerSecret` on the `team_etims_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "team_etims_settings" DROP COLUMN "apigeeAppId",
DROP COLUMN "authConsumerKey",
DROP COLUMN "authConsumerSecret";

-- CreateTable
CREATE TABLE "email_builder_design" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "json" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_builder_design_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "email_builder_design_activity_log" (
    "_id" TEXT NOT NULL,
    "emailBuilderDesignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_builder_design_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "email_builder_design_userId_idx" ON "email_builder_design"("userId");

-- CreateIndex
CREATE INDEX "email_builder_design_teamId_idx" ON "email_builder_design"("teamId");

-- CreateIndex
CREATE INDEX "email_builder_design_isPublic_idx" ON "email_builder_design"("isPublic");

-- CreateIndex
CREATE INDEX "email_builder_design_activity_log_emailBuilderDesignId_idx" ON "email_builder_design_activity_log"("emailBuilderDesignId");

-- CreateIndex
CREATE INDEX "email_builder_design_activity_log_userId_idx" ON "email_builder_design_activity_log"("userId");

-- CreateIndex
CREATE INDEX "email_builder_design_activity_log_action_idx" ON "email_builder_design_activity_log"("action");

-- CreateIndex
CREATE INDEX "email_builder_design_activity_log_createdAt_idx" ON "email_builder_design_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "email_builder_design" ADD CONSTRAINT "email_builder_design_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_builder_design" ADD CONSTRAINT "email_builder_design_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_builder_design_activity_log" ADD CONSTRAINT "email_builder_design_activity_log_emailBuilderDesignId_fkey" FOREIGN KEY ("emailBuilderDesignId") REFERENCES "email_builder_design"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
