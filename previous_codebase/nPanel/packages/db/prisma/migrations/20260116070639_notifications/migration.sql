-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'USER', 'TEAM', 'ORDER', 'PAYMENT', 'INVOICE', 'DOMAIN', 'HOSTING', 'CREATIVE_BRIEF', 'CREATIVE_ASSET', 'SOCIAL_MEDIA', 'EMAIL_MARKETING', 'AD_CAMPAIGN', 'GENERAL');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "notification" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERAL',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "metadata" JSONB,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "notification_activity_log" (
    "_id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_activity_log_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "notification_userId_idx" ON "notification"("userId");

-- CreateIndex
CREATE INDEX "notification_teamId_idx" ON "notification"("teamId");

-- CreateIndex
CREATE INDEX "notification_type_idx" ON "notification"("type");

-- CreateIndex
CREATE INDEX "notification_seen_idx" ON "notification"("seen");

-- CreateIndex
CREATE INDEX "notification_priority_idx" ON "notification"("priority");

-- CreateIndex
CREATE INDEX "notification_createdAt_idx" ON "notification"("createdAt");

-- CreateIndex
CREATE INDEX "notification_userId_seen_idx" ON "notification"("userId", "seen");

-- CreateIndex
CREATE INDEX "notification_teamId_seen_idx" ON "notification"("teamId", "seen");

-- CreateIndex
CREATE INDEX "notification_activity_log_notificationId_idx" ON "notification_activity_log"("notificationId");

-- CreateIndex
CREATE INDEX "notification_activity_log_userId_idx" ON "notification_activity_log"("userId");

-- CreateIndex
CREATE INDEX "notification_activity_log_action_idx" ON "notification_activity_log"("action");

-- CreateIndex
CREATE INDEX "notification_activity_log_createdAt_idx" ON "notification_activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_activity_log" ADD CONSTRAINT "notification_activity_log_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notification"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
