-- CreateTable
CREATE TABLE "team_billing_settings" (
    "_id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "billingEmail" TEXT NOT NULL,
    "billingPhone" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "postalCode" TEXT,
    "taxId" TEXT,
    "additionalNotes" TEXT,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_billing_settings_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "team_billing_settings_activity_log" (
    "_id" TEXT NOT NULL,
    "teamBillingSettingsId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_billing_settings_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_billing_settings_teamId_key" ON "team_billing_settings"("teamId");

-- CreateIndex
CREATE INDEX "team_billing_settings_teamId_idx" ON "team_billing_settings"("teamId");

-- CreateIndex
CREATE INDEX "team_billing_settings_activity_log_teamBillingSettingsId_idx" ON "team_billing_settings_activity_log"("teamBillingSettingsId");

-- CreateIndex
CREATE INDEX "team_billing_settings_activity_log_userId_idx" ON "team_billing_settings_activity_log"("userId");

-- CreateIndex
CREATE INDEX "team_billing_settings_activity_log_action_idx" ON "team_billing_settings_activity_log"("action");

-- CreateIndex
CREATE INDEX "team_billing_settings_activity_log_createdAt_idx" ON "team_billing_settings_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "team_billing_settings" ADD CONSTRAINT "team_billing_settings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_billing_settings_activity_log" ADD CONSTRAINT "team_billing_settings_activity_log_teamBillingSettingsId_fkey" FOREIGN KEY ("teamBillingSettingsId") REFERENCES "team_billing_settings"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
