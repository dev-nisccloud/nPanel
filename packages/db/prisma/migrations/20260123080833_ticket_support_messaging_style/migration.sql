/*
  Warnings:

  - You are about to drop the column `commentId` on the `ticket_attachment` table. All the data in the column will be lost.
  - You are about to drop the `ticket_comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ticket_participant` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MessageReadStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- DropForeignKey
ALTER TABLE "public"."ticket_attachment" DROP CONSTRAINT "ticket_attachment_commentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ticket_comment" DROP CONSTRAINT "ticket_comment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ticket_comment" DROP CONSTRAINT "ticket_comment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ticket_comment" DROP CONSTRAINT "ticket_comment_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ticket_participant" DROP CONSTRAINT "ticket_participant_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ticket_participant" DROP CONSTRAINT "ticket_participant_userId_fkey";

-- DropIndex
DROP INDEX "public"."ticket_attachment_commentId_idx";

-- AlterTable
ALTER TABLE "ticket" ADD COLUMN     "customerUnreadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3),
ADD COLUMN     "lastMessageId" TEXT,
ADD COLUMN     "lastMessagePreview" TEXT,
ADD COLUMN     "unreadCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "subject" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ticket_attachment" DROP COLUMN "commentId",
ADD COLUMN     "messageId" TEXT,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "public"."ticket_comment";

-- DropTable
DROP TABLE "public"."ticket_participant";

-- CreateTable
CREATE TABLE "ticket_message" (
    "_id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "readStatus" "MessageReadStatus" NOT NULL DEFAULT 'SENT',
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ticket_message_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "ticket_message_ticketId_idx" ON "ticket_message"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_message_senderId_idx" ON "ticket_message"("senderId");

-- CreateIndex
CREATE INDEX "ticket_message_createdAt_idx" ON "ticket_message"("createdAt");

-- CreateIndex
CREATE INDEX "ticket_message_ticketId_createdAt_idx" ON "ticket_message"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "ticket_message_isInternal_idx" ON "ticket_message"("isInternal");

-- CreateIndex
CREATE INDEX "ticket_message_deletedAt_idx" ON "ticket_message"("deletedAt");

-- CreateIndex
CREATE INDEX "ticket_message_readStatus_idx" ON "ticket_message"("readStatus");

-- CreateIndex
CREATE INDEX "ticket_lastMessageAt_idx" ON "ticket"("lastMessageAt");

-- CreateIndex
CREATE INDEX "ticket_assignedToId_status_idx" ON "ticket"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "ticket_attachment_messageId_idx" ON "ticket_attachment"("messageId");

-- AddForeignKey
ALTER TABLE "ticket_message" ADD CONSTRAINT "ticket_message_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ticket"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_message" ADD CONSTRAINT "ticket_message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachment" ADD CONSTRAINT "ticket_attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ticket_message"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
