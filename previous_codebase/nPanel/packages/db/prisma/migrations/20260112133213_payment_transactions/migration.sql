-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('MPESA', 'STRIPE', 'PAYPAL', 'FLUTTERWAVE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateTable
CREATE TABLE "payment_transaction" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "gateway" "PaymentGateway" NOT NULL,
    "gatewayStatus" TEXT,
    "gatewayMessage" TEXT,
    "gatewayTransactionId" TEXT,
    "merchantRequestId" TEXT,
    "checkoutRequestId" TEXT,
    "receiptNumber" TEXT,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "accountReference" TEXT,
    "transactionDesc" TEXT,
    "phoneNumber" TEXT,
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "rawResponse" JSONB,
    "rawError" JSONB,
    "initiatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transaction_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "payment_transaction_activity_log" (
    "_id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transaction_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "payment_transaction_userId_idx" ON "payment_transaction"("userId");

-- CreateIndex
CREATE INDEX "payment_transaction_teamId_idx" ON "payment_transaction"("teamId");

-- CreateIndex
CREATE INDEX "payment_transaction_gateway_idx" ON "payment_transaction"("gateway");

-- CreateIndex
CREATE INDEX "payment_transaction_status_idx" ON "payment_transaction"("status");

-- CreateIndex
CREATE INDEX "payment_transaction_gatewayTransactionId_idx" ON "payment_transaction"("gatewayTransactionId");

-- CreateIndex
CREATE INDEX "payment_transaction_checkoutRequestId_idx" ON "payment_transaction"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "payment_transaction_merchantRequestId_idx" ON "payment_transaction"("merchantRequestId");

-- CreateIndex
CREATE INDEX "payment_transaction_receiptNumber_idx" ON "payment_transaction"("receiptNumber");

-- CreateIndex
CREATE INDEX "payment_transaction_accountReference_idx" ON "payment_transaction"("accountReference");

-- CreateIndex
CREATE INDEX "payment_transaction_initiatedAt_idx" ON "payment_transaction"("initiatedAt");

-- CreateIndex
CREATE INDEX "payment_transaction_processedAt_idx" ON "payment_transaction"("processedAt");

-- CreateIndex
CREATE INDEX "payment_transaction_createdAt_idx" ON "payment_transaction"("createdAt");

-- CreateIndex
CREATE INDEX "payment_transaction_activity_log_transactionId_idx" ON "payment_transaction_activity_log"("transactionId");

-- CreateIndex
CREATE INDEX "payment_transaction_activity_log_userId_idx" ON "payment_transaction_activity_log"("userId");

-- CreateIndex
CREATE INDEX "payment_transaction_activity_log_action_idx" ON "payment_transaction_activity_log"("action");

-- CreateIndex
CREATE INDEX "payment_transaction_activity_log_createdAt_idx" ON "payment_transaction_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "payment_transaction" ADD CONSTRAINT "payment_transaction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transaction_activity_log" ADD CONSTRAINT "payment_transaction_activity_log_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "payment_transaction"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
