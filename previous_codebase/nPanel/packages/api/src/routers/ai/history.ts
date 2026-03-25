import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import prisma from "@npanel/db";
import {
    getAiChatHistorySchema,
    getAiChatByIdSchema,
    aiChatListItemSchema,
    aiChatSchema,
    aiChatMessageSchema
} from "./schemas";
import { z } from "zod";

// ============================================================================
// TRANSFORM FUNCTIONS
// ============================================================================

function transformAiChatMessage(message: any) {
    return {
        id: message.id,
        chatId: message.chatId,
        role: message.role as any,
        content: message.content,
        toolCalls: message.toolCalls,
        toolCallId: message.toolCallId,
        metadata: message.metadata,
        createdAt: message.createdAt,
    };
}

function transformAiChat(chat: any) {
    return {
        id: chat.id,
        userId: chat.userId,
        teamId: chat.teamId,
        title: chat.title,
        status: chat.status as any,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        closedAt: chat.closedAt,
        messages: chat.messages?.map(transformAiChatMessage),
    };
}

function transformAiChatListItem(chat: any) {
    // Get the last user or assistant message for preview
    const lastMessage = chat.messages?.[0]?.content || "New conversation";

    return {
        id: chat.id,
        title: chat.title || "AI Chat",
        lastMessage,
        timestamp: chat.updatedAt,
        status: chat.status as any,
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

            const where: any = {
                userId,
            };

            if (input.teamId) {
                where.teamId = input.teamId;
            }

            const chats = await prisma.aiChat.findMany({
                where,
                include: {
                    messages: {
                        orderBy: {
                            createdAt: "desc",
                        },
                        take: 1,
                        where: {
                            role: {
                                in: ["user", "assistant"],
                            },
                        },
                    },
                },
                orderBy: {
                    updatedAt: "desc",
                },
                take: input.limit,
                skip: input.offset,
            });

            return chats.map(transformAiChatListItem);
        }),

    // Get a single chat with its full message history
    getById: protectedProcedure
        .input(getAiChatByIdSchema)
        .output(aiChatSchema)
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const chat = await prisma.aiChat.findUnique({
                where: {
                    id: input.id,
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: "asc",
                        },
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
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { role: true }
                });

                if (!user?.role?.includes("AGENCY")) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to view this chat history",
                    });
                }
            }

            return transformAiChat(chat);
        }),
});
