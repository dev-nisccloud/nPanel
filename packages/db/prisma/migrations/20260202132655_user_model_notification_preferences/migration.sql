-- AlterTable
ALTER TABLE "user" ADD COLUMN     "browserNotificationPermission" TEXT DEFAULT 'default',
ADD COLUMN     "browserNotificationsEnabled" BOOLEAN DEFAULT false,
ADD COLUMN     "notificationPreferencesUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "notificationSoundEnabled" BOOLEAN DEFAULT true,
ADD COLUMN     "notificationSoundVolume" INTEGER DEFAULT 100;
