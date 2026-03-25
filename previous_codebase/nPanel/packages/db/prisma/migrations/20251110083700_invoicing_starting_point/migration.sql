-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "InvoicePaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "InvoicePaymentMethod" AS ENUM ('BANK_TRANSFER', 'MPESA', 'CHEQUE', 'CASH', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "CreditNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'APPLIED', 'VOIDED');

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "invoiceId" TEXT;

-- CreateTable
CREATE TABLE "invoice" (
    "_id" TEXT NOT NULL,
    "teamId" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "invoiceNumber" TEXT,
    "token" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "amount" TEXT,
    "subtotal" TEXT,
    "tax" TEXT,
    "vat" TEXT,
    "discount" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "creditedAmount" TEXT,
    "creditBalance" TEXT,
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "note" TEXT,
    "internalNote" TEXT,
    "fromDetails" JSONB,
    "customerDetails" JSONB,
    "paymentDetails" JSONB,
    "noteDetails" JSONB,
    "template" JSONB,
    "topBlock" JSONB,
    "bottomBlock" JSONB,
    "metadata" JSONB,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "invoice_line_item" (
    "_id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT,
    "description" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "price" TEXT,
    "tax" TEXT,
    "vat" TEXT,
    "discount" TEXT,
    "total" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_line_item_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "invoice_transaction" (
    "_id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "reference" TEXT,
    "providerReference" TEXT,
    "status" "InvoicePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "InvoicePaymentMethod" NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "recordedBy" TEXT,
    "balanceBefore" TEXT,
    "balanceAfter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_transaction_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "invoice_credit_note" (
    "_id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "teamId" TEXT,
    "creditNumber" TEXT,
    "status" "CreditNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "reason" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "issuedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_credit_note_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "invoice_activity_log" (
    "_id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "invoice_transaction_activity_log" (
    "_id" TEXT NOT NULL,
    "invoiceTransactionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_transaction_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "invoice_credit_note_activity_log" (
    "_id" TEXT NOT NULL,
    "creditNoteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_credit_note_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoice_token_key" ON "invoice"("token");

-- CreateIndex
CREATE INDEX "invoice_teamId_idx" ON "invoice"("teamId");

-- CreateIndex
CREATE INDEX "invoice_status_idx" ON "invoice"("status");

-- CreateIndex
CREATE INDEX "invoice_dueDate_idx" ON "invoice"("dueDate");

-- CreateIndex
CREATE INDEX "invoice_sentAt_idx" ON "invoice"("sentAt");

-- CreateIndex
CREATE INDEX "invoice_invoiceNumber_idx" ON "invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_teamId_invoiceNumber_key" ON "invoice"("teamId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "invoice_line_item_invoiceId_idx" ON "invoice_line_item"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_line_item_position_idx" ON "invoice_line_item"("position");

-- CreateIndex
CREATE INDEX "invoice_transaction_invoiceId_idx" ON "invoice_transaction"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_transaction_status_idx" ON "invoice_transaction"("status");

-- CreateIndex
CREATE INDEX "invoice_transaction_paidAt_idx" ON "invoice_transaction"("paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_credit_note_invoiceId_key" ON "invoice_credit_note"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_credit_note_teamId_idx" ON "invoice_credit_note"("teamId");

-- CreateIndex
CREATE INDEX "invoice_credit_note_status_idx" ON "invoice_credit_note"("status");

-- CreateIndex
CREATE INDEX "invoice_credit_note_issuedAt_idx" ON "invoice_credit_note"("issuedAt");

-- CreateIndex
CREATE INDEX "invoice_activity_log_invoiceId_idx" ON "invoice_activity_log"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_activity_log_userId_idx" ON "invoice_activity_log"("userId");

-- CreateIndex
CREATE INDEX "invoice_activity_log_action_idx" ON "invoice_activity_log"("action");

-- CreateIndex
CREATE INDEX "invoice_activity_log_createdAt_idx" ON "invoice_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "invoice_transaction_activity_log_invoiceTransactionId_idx" ON "invoice_transaction_activity_log"("invoiceTransactionId");

-- CreateIndex
CREATE INDEX "invoice_transaction_activity_log_userId_idx" ON "invoice_transaction_activity_log"("userId");

-- CreateIndex
CREATE INDEX "invoice_transaction_activity_log_action_idx" ON "invoice_transaction_activity_log"("action");

-- CreateIndex
CREATE INDEX "invoice_transaction_activity_log_createdAt_idx" ON "invoice_transaction_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "invoice_credit_note_activity_log_creditNoteId_idx" ON "invoice_credit_note_activity_log"("creditNoteId");

-- CreateIndex
CREATE INDEX "invoice_credit_note_activity_log_userId_idx" ON "invoice_credit_note_activity_log"("userId");

-- CreateIndex
CREATE INDEX "invoice_credit_note_activity_log_action_idx" ON "invoice_credit_note_activity_log"("action");

-- CreateIndex
CREATE INDEX "invoice_credit_note_activity_log_createdAt_idx" ON "invoice_credit_note_activity_log"("createdAt");

-- CreateIndex
CREATE INDEX "order_invoiceId_idx" ON "order"("invoiceId");

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_item" ADD CONSTRAINT "invoice_line_item_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_transaction" ADD CONSTRAINT "invoice_transaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_credit_note" ADD CONSTRAINT "invoice_credit_note_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_credit_note" ADD CONSTRAINT "invoice_credit_note_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_activity_log" ADD CONSTRAINT "invoice_activity_log_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_transaction_activity_log" ADD CONSTRAINT "invoice_transaction_activity_log_invoiceTransactionId_fkey" FOREIGN KEY ("invoiceTransactionId") REFERENCES "invoice_transaction"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_credit_note_activity_log" ADD CONSTRAINT "invoice_credit_note_activity_log_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "invoice_credit_note"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
