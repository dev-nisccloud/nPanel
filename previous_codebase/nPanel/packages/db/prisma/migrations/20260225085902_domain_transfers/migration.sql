-- AlterTable
ALTER TABLE "domain_transfer_request" ADD COLUMN     "niscOrderId" TEXT;

-- CreateIndex
CREATE INDEX "domain_transfer_request_niscOrderId_idx" ON "domain_transfer_request"("niscOrderId");

-- AddForeignKey
ALTER TABLE "domain_transfer_request" ADD CONSTRAINT "domain_transfer_request_niscOrderId_fkey" FOREIGN KEY ("niscOrderId") REFERENCES "nisc_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
