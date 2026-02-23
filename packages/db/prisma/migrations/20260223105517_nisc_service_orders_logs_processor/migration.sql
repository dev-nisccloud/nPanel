-- CreateTable
CREATE TABLE "nisc_order_processing_log" (
    "id" TEXT NOT NULL,
    "niscOrderId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nisc_order_processing_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nisc_order_processing_log_niscOrderId_idx" ON "nisc_order_processing_log"("niscOrderId");

-- CreateIndex
CREATE INDEX "nisc_order_processing_log_niscOrderId_createdAt_idx" ON "nisc_order_processing_log"("niscOrderId", "createdAt");

-- AddForeignKey
ALTER TABLE "nisc_order_processing_log" ADD CONSTRAINT "nisc_order_processing_log_niscOrderId_fkey" FOREIGN KEY ("niscOrderId") REFERENCES "nisc_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
