-- AlterTable
ALTER TABLE "invoice" ADD COLUMN     "kraError" TEXT,
ADD COLUMN     "kraInvoiceNumber" TEXT,
ADD COLUMN     "kraQrCode" TEXT,
ADD COLUMN     "kraReceiptNumber" TEXT,
ADD COLUMN     "kraSignature" TEXT,
ADD COLUMN     "kraStatus" TEXT,
ADD COLUMN     "kraVerifiedDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "team_etims_settings" (
    "_id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "kraPin" TEXT NOT NULL,
    "branchId" TEXT NOT NULL DEFAULT '00',
    "deviceSerialNumber" TEXT NOT NULL,
    "cmcKey" TEXT,
    "isInitialized" BOOLEAN NOT NULL DEFAULT false,
    "isSandbox" BOOLEAN NOT NULL DEFAULT true,
    "apigeeAppId" TEXT,
    "authConsumerKey" TEXT,
    "authConsumerSecret" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_etims_settings_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_etims_settings_teamId_key" ON "team_etims_settings"("teamId");

-- CreateIndex
CREATE INDEX "team_etims_settings_teamId_idx" ON "team_etims_settings"("teamId");

-- AddForeignKey
ALTER TABLE "team_etims_settings" ADD CONSTRAINT "team_etims_settings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
