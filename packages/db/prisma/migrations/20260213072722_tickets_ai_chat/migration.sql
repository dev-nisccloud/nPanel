-- CreateEnum
CREATE TYPE "AiChatStatus" AS ENUM ('ACTIVE', 'ESCALATED', 'CLOSED');

-- CreateTable
CREATE TABLE "ai_chat" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "title" TEXT,
    "status" "AiChatStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "ai_chat_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "ai_chat_message" (
    "_id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT,
    "toolCalls" JSONB,
    "toolCallId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_message_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "ai_chat_userId_idx" ON "ai_chat"("userId");

-- CreateIndex
CREATE INDEX "ai_chat_teamId_idx" ON "ai_chat"("teamId");

-- CreateIndex
CREATE INDEX "ai_chat_status_idx" ON "ai_chat"("status");

-- CreateIndex
CREATE INDEX "ai_chat_createdAt_idx" ON "ai_chat"("createdAt");

-- CreateIndex
CREATE INDEX "ai_chat_message_chatId_idx" ON "ai_chat_message"("chatId");

-- CreateIndex
CREATE INDEX "ai_chat_message_createdAt_idx" ON "ai_chat_message"("createdAt");

-- AddForeignKey
ALTER TABLE "ai_chat" ADD CONSTRAINT "ai_chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chat" ADD CONSTRAINT "ai_chat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chat_message" ADD CONSTRAINT "ai_chat_message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "ai_chat"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
