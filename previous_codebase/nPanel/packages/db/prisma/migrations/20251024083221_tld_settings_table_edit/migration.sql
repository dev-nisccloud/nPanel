/*
  Warnings:

  - You are about to drop the `TldSettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TldSettings" DROP CONSTRAINT "TldSettings_nameserverGroupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tld_settings_activity_log" DROP CONSTRAINT "tld_settings_activity_log_tldSettingId_fkey";

-- DropTable
DROP TABLE "public"."TldSettings";

-- CreateTable
CREATE TABLE "tld_settings" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nameserverGroupId" TEXT,
    "marginType" "MarginType",
    "profitMargin" TEXT,
    "costMargin" TEXT,
    "roundOff" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tld_settings_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "tld_settings_userId_idx" ON "tld_settings"("userId");

-- CreateIndex
CREATE INDEX "tld_settings_nameserverGroupId_idx" ON "tld_settings"("nameserverGroupId");

-- CreateIndex
CREATE INDEX "tld_settings_marginType_idx" ON "tld_settings"("marginType");

-- AddForeignKey
ALTER TABLE "tld_settings" ADD CONSTRAINT "tld_settings_nameserverGroupId_fkey" FOREIGN KEY ("nameserverGroupId") REFERENCES "nameserver_group"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tld_settings_activity_log" ADD CONSTRAINT "tld_settings_activity_log_tldSettingId_fkey" FOREIGN KEY ("tldSettingId") REFERENCES "tld_settings"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
