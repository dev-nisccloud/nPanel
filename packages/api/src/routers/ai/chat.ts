import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import prisma from "@nPanel/db";
import { randomUUID } from "node:crypto";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
    startAiChatSchema,
    deleteAiChatSchema,
    aiChatSchema,
    aiChatMessageSchema
} from "./schemas";
import {
    getSystemNavigationTool,
    getUserContextTool,
    getActiveServicesTool,
    escalateToHumanTool
} from "./tools";
import { z } from "zod";

const getOpenai = () => {
    const rawKey = process.env.OPENAI_API_KEY || "";
    const key = rawKey.trim();

    if (!key) {
        console.error("[AI ERROR] OPENAI_API_KEY is missing or empty.");
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "OPENAI_API_KEY is not defined in environment variables",
        });
    }

    console.log(`[AI DEBUG] getOpenai called:
        Raw defined: ${!!rawKey}
        Processed Length: ${key.length}
        Prefix: ${key.substring(0, 12)}
        Suffix: ${key.substring(Math.max(0, key.length - 4))}
    `);

    return createOpenAI({
        apiKey: key,
    });
};

// ============================================================================
// HELPERS
// ============================================================================

async function getChatHistory(chatId: string) {
    return await prisma.aiChatMessage.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
    });
}

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

function mapToAiMessages(messages: any[]) {
    return messages.map(m => ({
        role: m.role as "system" | "user" | "assistant" | "tool",
        content: m.content || "",
        toolCalls: m.toolCalls as any,
        toolCallId: m.toolCallId || undefined,
    }));
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

// ============================================================================
// AI CHAT ROUTER
// ============================================================================

export const aiChatRouter = router({
    // Start a new AI chat
    start: protectedProcedure
        .input(startAiChatSchema)
        .output(aiChatSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const chatId = randomUUID();

            let chat;

            try {
                chat = await prisma.aiChat.create({
                    data: {
                        id: chatId,
                        userId,
                        teamId: input.teamId || null,
                        title: input.initialMessage ? (input.initialMessage.slice(0, 50) + (input.initialMessage.length > 50 ? "..." : "")) : "New Chat",
                        status: "ACTIVE",
                        messages: {
                            create: [
                                {
                                    id: randomUUID(),
                                    role: "system",
                                    content: `You are Zeepo, the official Nisc Cloud AI Assistant.
Nisc Cloud is based in Nairobi, Kenya (Applewood Adams, Ngong Road, Suite 805).

Core Identity:
- Always identify as Zeepo, the Nisc Cloud Assistant.
- If users ask for contact or location details, provide the Nairobi address above.
- Always be helpful, professional, and concise.

Objectives:
1. Assist users with cloud services, marketing tools, and account settings.
2. Utilize provided tools to fetch system navigation, user context, and active services.
3. If you cannot resolve a query, offer to escalate to a human support agent.`,
                                    createdAt: new Date(),
                                },
                                ...(input.initialMessage ? [{
                                    id: randomUUID(),
                                    role: "user",
                                    content: input.initialMessage,
                                    createdAt: new Date(),
                                }] : [])
                            ]
                        }
                    },
                    include: {
                        messages: true
                    }
                });

                if (input.initialMessage) {
                    // 2. Call OpenAI with tools
                    const messages = mapToAiMessages(chat.messages);
                    const openai = getOpenai();
                    const result = await generateText({
                        model: openai("gpt-4o-mini"),
                        messages,
                        tools: {
                            getSystemNavigation: getSystemNavigationTool(),
                            getUserContext: getUserContextTool(userId),
                            getActiveServices: getActiveServicesTool(userId),
                            escalateToHuman: escalateToHumanTool(userId),
                        },
                    });

                    // 3. Save assistant's response
                    await prisma.aiChatMessage.create({
                        data: {
                            id: randomUUID(),
                            chatId: chatId,
                            role: "assistant",
                            content: result.text,
                            metadata: {
                                usage: result.usage,
                                finishReason: result.finishReason,
                            } as any,
                            createdAt: new Date(),
                        }
                    });

                    // 4. Update chat's updatedAt
                    await prisma.aiChat.update({
                        where: { id: chatId },
                        data: { updatedAt: new Date() }
                    });

                    // 5. Fetch updated chat to return with all messages
                    const updatedChat = await prisma.aiChat.findUnique({
                        where: { id: chatId },
                        include: { messages: { orderBy: { createdAt: "asc" } } }
                    });
                    return transformAiChat(updatedChat);
                }

                return transformAiChat(chat);

            } catch (error) {
                console.error("[AI CHAT START ERROR]", error);

                // If chat was created but something failed (e.g. OpenAI), delete the chat to avoid "ghost" chats with only user message
                if (chat) {
                    try {
                        await prisma.aiChat.delete({ where: { id: chatId } });
                    } catch (deleteError) {
                        console.error("[AI CHAT CLEANUP ERROR] Failed to delete failed chat", deleteError);
                    }
                }

                throw error;
            }
        }),

    // Generate a response for a message
    sendMessage: protectedProcedure
        .input(z.object({
            chatId: z.string(),
            content: z.string().min(1),
        }))
        .output(aiChatMessageSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // 1. Verify chat ownership
            const chat = await prisma.aiChat.findUnique({
                where: { id: input.chatId },
                select: { userId: true, teamId: true }
            });

            if (!chat || chat.userId !== userId) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this chat.",
                });
            }

            // 2. Save user message
            await prisma.aiChatMessage.create({
                data: {
                    id: randomUUID(),
                    chatId: input.chatId,
                    role: "user",
                    content: input.content,
                    createdAt: new Date(),
                }
            });

            // 3. Fetch full history for context
            const history = await getChatHistory(input.chatId);
            const messages = mapToAiMessages(history);

            // 4. Call OpenAI with tools
            const openai = getOpenai();
            const result = await generateText({
                model: openai("gpt-4o-mini"),
                messages,
                tools: {
                    getSystemNavigation: getSystemNavigationTool(),
                    getUserContext: getUserContextTool(userId),
                    getActiveServices: getActiveServicesTool(userId),
                    escalateToHuman: escalateToHumanTool(userId),
                },
            });

            // 6. Save assistant's response
            const assistantMessage = await prisma.aiChatMessage.create({
                data: {
                    id: randomUUID(),
                    chatId: input.chatId,
                    role: "assistant",
                    content: result.text,
                    metadata: {
                        usage: result.usage,
                        finishReason: result.finishReason,
                    } as any,
                    createdAt: new Date(),
                }
            });

            // 7. Update chat's updatedAt for sorting in history
            await prisma.aiChat.update({
                where: { id: input.chatId },
                data: { updatedAt: new Date() }
            });

            return transformAiChatMessage(assistantMessage);
        }),

    // Directly escalate to human
    escalate: protectedProcedure
        .input(z.object({
            chatId: z.string(),
            reason: z.string().optional(),
        }))
        .output(z.object({
            success: z.boolean(),
            ticketId: z.string(),
            ticketNumber: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // 1. Verify chat ownership
            const chat = await prisma.aiChat.findUnique({
                where: { id: input.chatId },
                select: { userId: true, teamId: true }
            });

            if (!chat || chat.userId !== userId) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this chat.",
                });
            }

            // 2. Execute escalation
            const toolInstance = escalateToHumanTool(userId);
            const result = await (toolInstance as any).execute({
                subject: "Escalation from AI Chat",
                summary: input.reason || "User requested human agent.",
                priority: "NORMAL",
                teamId: chat.teamId,
            });

            // 3. Close the AI chat status
            await prisma.aiChat.update({
                where: { id: input.chatId },
                data: {
                    status: "CLOSED",
                    closedAt: new Date(),
                }
            });

            return {
                success: result.success,
                ticketId: result.ticketId,
                ticketNumber: result.ticketNumber,
            };
        }),

    // Delete a chat history
    delete: protectedProcedure
        .input(deleteAiChatSchema)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // 1. Verify ownership
            const chat = await prisma.aiChat.findUnique({
                where: { id: input.id },
                select: { userId: true }
            });

            if (!chat || chat.userId !== userId) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to delete this chat history",
                });
            }

            // 2. Delete messages first (Prisma relational delete if configured, but let's be safe)
            await prisma.aiChatMessage.deleteMany({
                where: { chatId: input.id }
            });

            // 3. Delete the chat
            await prisma.aiChat.delete({
                where: { id: input.id }
            });

            return { success: true };
        }),
});
