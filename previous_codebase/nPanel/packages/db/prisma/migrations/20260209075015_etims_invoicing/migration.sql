-- CreateTable
CREATE TABLE "team_etims_item" (
    "_id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "itemCd" TEXT NOT NULL,
    "itemClsCd" TEXT NOT NULL,
    "itemNm" TEXT NOT NULL,
    "itemClsNm" TEXT,
    "taxTyCd" TEXT NOT NULL DEFAULT 'A',
    "pkgUnitCd" TEXT NOT NULL DEFAULT 'OU',
    "qtyUnitCd" TEXT NOT NULL DEFAULT 'OU',
    "prc" TEXT,
    "isService" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_etims_item_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "team_etims_branch" (
    "_id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "bhfId" TEXT NOT NULL,
    "bhfNm" TEXT NOT NULL,
    "bhfSttsCd" TEXT NOT NULL DEFAULT '01',
    "addr" TEXT,
    "mgrNm" TEXT,
    "mgrTelNo" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_etims_branch_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "team_etims_item_teamId_idx" ON "team_etims_item"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "team_etims_item_teamId_itemCd_key" ON "team_etims_item"("teamId", "itemCd");

-- CreateIndex
CREATE INDEX "team_etims_branch_teamId_idx" ON "team_etims_branch"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "team_etims_branch_teamId_bhfId_key" ON "team_etims_branch"("teamId", "bhfId");

-- AddForeignKey
ALTER TABLE "team_etims_item" ADD CONSTRAINT "team_etims_item_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_etims_branch" ADD CONSTRAINT "team_etims_branch_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
