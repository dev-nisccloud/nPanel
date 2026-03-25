-- CreateTable
CREATE TABLE "order_item" (
    "_id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "niscServicePlanId" TEXT NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "itemPrice" TEXT NOT NULL,
    "itemSubtotal" TEXT NOT NULL,
    "itemCurrency" TEXT NOT NULL DEFAULT 'KES',
    "domainName" TEXT,
    "description" TEXT,
    "adminDescription" TEXT,
    "notes" TEXT,
    "isProvisioned" BOOLEAN NOT NULL DEFAULT false,
    "hostingSubscriptionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "order_item_activity_log" (
    "_id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_item_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "order_item_orderId_idx" ON "order_item"("orderId");

-- CreateIndex
CREATE INDEX "order_item_niscServicePlanId_idx" ON "order_item"("niscServicePlanId");

-- CreateIndex
CREATE INDEX "order_item_isProvisioned_idx" ON "order_item"("isProvisioned");

-- CreateIndex
CREATE INDEX "order_item_hostingSubscriptionId_idx" ON "order_item"("hostingSubscriptionId");

-- CreateIndex
CREATE INDEX "order_item_activity_log_orderItemId_idx" ON "order_item_activity_log"("orderItemId");

-- CreateIndex
CREATE INDEX "order_item_activity_log_userId_idx" ON "order_item_activity_log"("userId");

-- CreateIndex
CREATE INDEX "order_item_activity_log_action_idx" ON "order_item_activity_log"("action");

-- CreateIndex
CREATE INDEX "order_item_activity_log_createdAt_idx" ON "order_item_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_niscServicePlanId_fkey" FOREIGN KEY ("niscServicePlanId") REFERENCES "nisc_service_plan"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_hostingSubscriptionId_fkey" FOREIGN KEY ("hostingSubscriptionId") REFERENCES "hosting_subscription"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_activity_log" ADD CONSTRAINT "order_item_activity_log_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
