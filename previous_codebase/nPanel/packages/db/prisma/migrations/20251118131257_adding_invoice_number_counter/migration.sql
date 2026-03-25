-- CreateTable
CREATE TABLE "invoice_counter" (
    "id" TEXT NOT NULL DEFAULT 'invoice-counter',
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_counter_pkey" PRIMARY KEY ("id")
);
