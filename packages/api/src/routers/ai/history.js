import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { aiChat } from "@npanel/db/schema/ai";
import { user } from "@npanel/db/schema/auth";
import { protectedProcedure, router } from "../../trpc";
import { getAiChatHistorySchema, getAiChatByIdSchema, aiChatListItemSchema, aiChatSchema, } from "./schemas";
import { z } from "zod";
// ============================================================================
// TRANSFORM FUNCTIONS
// ============================================================================
function transformAiChatMessage(message) {
    return {
        id: message.id,
        chatId: message.chatId,
        role: message.role,
        content: message.content,
        toolCalls: message.toolCalls,
        toolCallId: message.toolCallId,
        metadata: message.metadata,
        createdAt: message.createdAt,
    };
}
function transformAiChat(chat) {
    return {
        id: chat.id,
        userId: chat.userId,
        teamId: chat.teamId,
        title: chat.title,
        status: chat.status,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        closedAt: chat.closedAt,
        messages: chat.messages?.map(transformAiChatMessage),
    };
}
function transformAiChatListItem(chat) {
    // Get the last user or assistant message for preview
    const lastMessage = chat.messages?.[0]?.content || "New conversation";
    return {
        id: chat.id,
        title: chat.title || "AI Chat",
        lastMessage,
        timestamp: chat.updatedAt,
        status: chat.status,
    };
}
// ============================================================================
// AI HISTORY ROUTER
// ============================================================================
export const aiHistoryRouter = router({
    // Get chat history for the current user
    getHistory: protectedProcedure
        .input(getAiChatHistorySchema)
        .output(z.array(aiChatListItemSchema))
        .query(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        const conditions = [eq(aiChat.userId, userId)];
        if (input.teamId) {
            conditions.push(eq(aiChat.teamId, input.teamId));
        }
        const chats = await db.query.aiChat.findMany({
            where: and(...conditions),
            orderBy: [desc(aiChat.updatedAt)],
            limit: input.limit,
            offset: input.offset,
            with: {
                messages: {
                    where: (m, { inArray: inArr }) => inArr(m.role, ["user", "assistant"]),
                    orderBy: (m, { desc: descCol }) => [descCol(m.createdAt)],
                    limit: 1,
                },
            },
        });
        return chats.map(transformAiChatListItem);
    }),
    // Get a single chat with its full message history
    getById: protectedProcedure
        .input(getAiChatByIdSchema)
        .output(aiChatSchema)
        .query(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        const chat = await db.query.aiChat.findFirst({
            where: eq(aiChat.id, input.id),
            with: {
                messages: {
                    orderBy: (m, { asc: ascFn }) => [ascFn(m.createdAt)],
                },
            },
        });
        if (!chat) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Chat history not found",
            });
        }
        // Security: verify user owns the chat
        if (chat.userId !== userId) {
            // Check if it's an agency user (optional, but good practice if agency can see customer chats)
            const agencyUser = await db.query.user.findFirst({
                where: eq(user.id, userId),
                columns: { role: true },
            });
            if (!agencyUser?.role?.includes("AGENCY")) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to view this chat history",
                });
            }
        }
        return transformAiChat(chat);
    }),
});
