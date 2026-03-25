-- CreateIndex
CREATE INDEX "ai_chat_userId_status_createdAt_idx" ON "ai_chat"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ai_chat_message_chatId_createdAt_idx" ON "ai_chat_message"("chatId", "createdAt");
