-- CreateEnum
CREATE TYPE "DomainTransferRequestStatus" AS ENUM ('PENDING', 'SUBMITTED_TO_PROVIDER', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DomainTransferRequestProvider" AS ENUM ('KENIC', 'OPENPROVIDER');

-- CreateTable
CREATE TABLE "domain_transfer_request" (
    "_id" TEXT NOT NULL,
    "domainName" TEXT NOT NULL,
    "authCode" TEXT NOT NULL,
    "provider" "DomainTransferRequestProvider" NOT NULL,
    "status" "DomainTransferRequestStatus" NOT NULL DEFAULT 'PENDING',
    "providerPriceAmount" TEXT,
    "providerPriceCurrency" TEXT,
    "customerPriceAmount" TEXT,
    "customerPriceCurrency" TEXT,
    "teamId" TEXT,
    "submittedToProviderAt" TIMESTAMP(3),
    "providerResponse" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_transfer_request_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "domain_transfer_request_domainName_idx" ON "domain_transfer_request"("domainName");

-- CreateIndex
CREATE INDEX "domain_transfer_request_status_idx" ON "domain_transfer_request"("status");

-- CreateIndex
CREATE INDEX "domain_transfer_request_createdById_idx" ON "domain_transfer_request"("createdById");

-- CreateIndex
CREATE INDEX "domain_transfer_request_teamId_idx" ON "domain_transfer_request"("teamId");

-- CreateIndex
CREATE INDEX "domain_transfer_request_createdAt_idx" ON "domain_transfer_request"("createdAt");

-- AddForeignKey
ALTER TABLE "domain_transfer_request" ADD CONSTRAINT "domain_transfer_request_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_transfer_request" ADD CONSTRAINT "domain_transfer_request_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
