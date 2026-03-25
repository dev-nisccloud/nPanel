-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "quotation" (
    "_id" TEXT NOT NULL,
    "quotationNumber" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "token" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "amount" TEXT,
    "subtotal" TEXT,
    "tax" TEXT,
    "taxPercentage" DOUBLE PRECISION,
    "vat" TEXT,
    "discount" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "issueDate" TIMESTAMP(3),
    "note" TEXT,
    "internalNote" TEXT,
    "fromDetails" JSONB,
    "customerDetails" JSONB,
    "noteDetails" JSONB,
    "template" JSONB,
    "topBlock" JSONB,
    "bottomBlock" JSONB,
    "metadata" JSONB,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotation_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "quotation_line_item" (
    "_id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT,
    "description" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "price" TEXT,
    "discount" TEXT,
    "total" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotation_line_item_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "quotation_activity_log" (
    "_id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotation_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "quotation_counter" (
    "id" TEXT NOT NULL DEFAULT 'quotation-counter',
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotation_counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quotation_token_key" ON "quotation"("token");

-- CreateIndex
CREATE INDEX "quotation_quotationNumber_idx" ON "quotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "quotation_status_idx" ON "quotation"("status");

-- CreateIndex
CREATE INDEX "quotation_createdBy_idx" ON "quotation"("createdBy");

-- CreateIndex
CREATE INDEX "quotation_issueDate_idx" ON "quotation"("issueDate");

-- CreateIndex
CREATE INDEX "quotation_line_item_quotationId_idx" ON "quotation_line_item"("quotationId");

-- CreateIndex
CREATE INDEX "quotation_line_item_position_idx" ON "quotation_line_item"("position");

-- CreateIndex
CREATE INDEX "quotation_activity_log_quotationId_idx" ON "quotation_activity_log"("quotationId");

-- CreateIndex
CREATE INDEX "quotation_activity_log_userId_idx" ON "quotation_activity_log"("userId");

-- CreateIndex
CREATE INDEX "quotation_activity_log_action_idx" ON "quotation_activity_log"("action");

-- CreateIndex
CREATE INDEX "quotation_activity_log_createdAt_idx" ON "quotation_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_line_item" ADD CONSTRAINT "quotation_line_item_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotation"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_activity_log" ADD CONSTRAINT "quotation_activity_log_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotation"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
