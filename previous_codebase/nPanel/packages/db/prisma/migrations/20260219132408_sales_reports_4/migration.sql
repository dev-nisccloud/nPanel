-- CreateTable
CREATE TABLE "RevenueByTeamSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueByTeamSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RevenueByTeamSnapshot_date_period_idx" ON "RevenueByTeamSnapshot"("date", "period");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueByTeamSnapshot_date_period_teamId_currency_key" ON "RevenueByTeamSnapshot"("date", "period", "teamId", "currency");
