-- AlterTable
ALTER TABLE "tld_settings" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "tld_settings_isDefault_idx" ON "tld_settings"("isDefault");
