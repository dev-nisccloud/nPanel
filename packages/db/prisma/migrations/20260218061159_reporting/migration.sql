-- CreateTable
CREATE TABLE "SalesReportSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "totalRevenue" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "totalInvoiced" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "invoiceCount" INTEGER NOT NULL DEFAULT 0,
    "paidInvoiceCount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesReportSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueByServiceSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueByServiceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativeProductionSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "assetsCreated" INTEGER NOT NULL DEFAULT 0,
    "assetsApproved" INTEGER NOT NULL DEFAULT 0,
    "versionsCreated" INTEGER NOT NULL DEFAULT 0,
    "avgVelocityDays" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreativeProductionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesReportSnapshot_date_period_idx" ON "SalesReportSnapshot"("date", "period");

-- CreateIndex
CREATE UNIQUE INDEX "SalesReportSnapshot_date_period_currency_key" ON "SalesReportSnapshot"("date", "period", "currency");

-- CreateIndex
CREATE INDEX "RevenueByServiceSnapshot_date_period_serviceType_idx" ON "RevenueByServiceSnapshot"("date", "period", "serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueByServiceSnapshot_date_period_serviceType_currency_key" ON "RevenueByServiceSnapshot"("date", "period", "serviceType", "currency");

-- CreateIndex
CREATE INDEX "CreativeProductionSnapshot_date_period_idx" ON "CreativeProductionSnapshot"("date", "period");

-- CreateIndex
CREATE UNIQUE INDEX "CreativeProductionSnapshot_date_period_key" ON "CreativeProductionSnapshot"("date", "period");
