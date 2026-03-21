import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@npanel/db";
import { aiChat, aiChatMessage } from "@npanel/db/schema/ai";
import { protectedProcedure, router } from "../../trpc";
import OpenAI from "openai";
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
import { getCachedCatalog } from "./catalog-parser";
import { generateToolsFromCatalog, filterCatalogByAccess, createToolsSummary } from "./dynamic-tools";
import { z } from "zod";

// ============================================================================
// HELPERS
// ============================================================================

async function getChatHistory(chatId: string) {
    return await db.query.aiChatMessage.findMany({
        where: eq(aiChatMessage.chatId, chatId),
        orderBy: [asc(aiChatMessage.createdAt)],
    });
}

/**
 * Executes a tool call and returns the result
 */
async function executeTool(toolName: string, args: any, toolExecutors: Record<string, any>): Promise<any> {
    const executor = toolExecutors[toolName];
    if (!executor || typeof executor.execute !== 'function') {
        return { error: `Tool ${toolName} not found or not executable.` };
    }
    try {
        console.log(`[AI Chat] Executing tool: ${toolName}`, args);
        const result = await executor.execute(args);
        return result;
    } catch (error) {
        console.error(`[AI Chat] Error executing tool ${toolName}:`, error);
        return { error: error instanceof Error ? error.message : "Unknown tool execution error" };
    }
}

/**
 * Main AI Chat Loop - handles message processing and recursive tool calls
 */
async function runAiChatLoop(params: {
    chatId: string;
    messages: any[];
    openai: OpenAI;
    toolExecutors: Record<string, any>;
    toolsDefinition: any[];
    maxIterations?: number;
}): Promise<string> {
    const { chatId, messages, openai, toolExecutors, toolsDefinition, maxIterations = 5 } = params;
    let iteration = 0;
    let lastContent = "";

    while (iteration < maxIterations) {
        iteration++;
        console.log(`[AI Chat] Loop iteration ${iteration}`);

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages as any,
            tools: toolsDefinition.length > 0 ? (toolsDefinition as any) : undefined,
        });

        const choice = response.choices[0];
        const assistantMessage = choice?.message;
        if (!assistantMessage) {
            break;
        }

        // Save assistant message to DB
        await db.insert(aiChatMessage).values({
            id: randomUUID(),
            chatId: chatId,
            role: "assistant",
            content: assistantMessage.content || "",
            toolCalls: assistantMessage.tool_calls as any,
            metadata: {
                usage: response.usage,
                finishReason: choice.finish_reason,
                iteration
            } as any,
            createdAt: new Date(),
        });

        // Add to local context for potential next iteration
        messages.push({
            role: "assistant",
            content: assistantMessage.content || "",
            tool_calls: assistantMessage.tool_calls,
        });

        lastContent = assistantMessage.content || "";

        // If no tool calls, we're done
        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
            break;
        }

        // Process tool calls
        for (const toolCall of assistantMessage.tool_calls) {
            if (toolCall.type !== 'function') continue;

            const args = JSON.parse(toolCall.function.arguments);
            const result = await executeTool(toolCall.function.name, args, toolExecutors);

            const toolResultString = typeof result === 'string' ? result : JSON.stringify(result);

            // Save tool result to DB
            await db.insert(aiChatMessage).values({
                id: randomUUID(),
                chatId: chatId,
                role: "tool",
                content: toolResultString,
                toolCallId: toolCall.id,
                createdAt: new Date(),
            });

            // Add to local context
            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: toolResultString,
            });
        }

        // Continue the loop to let AI process tool results
    }

    if (iteration >= maxIterations) {
        console.warn(`[AI Chat] Reached max iterations (${maxIterations}) for chat ${chatId}`);
    }

    return lastContent;
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
        tool_calls: m.toolCalls as any,
        tool_call_id: m.toolCallId || undefined,
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
            const userRole = ctx.session.user.role;
            const chatId = randomUUID();

            // 1. Prepare Tools and Prompt
            const indexedCatalog = getCachedCatalog();
            const allowedFunctions = filterCatalogByAccess(
                indexedCatalog.catalog.functions,
                userRole ?? undefined
            );
            const toolsSummary = createToolsSummary(
                allowedFunctions,
                indexedCatalog.catalog.categories
            );

            // 2. Create Chat and context
            const systemPrompt = `You are Zepo, the official Nisc Cloud AI Assistant.
Nisc Cloud is based in Nairobi, Kenya (Applewood Adams, Ngong Road, Suite 805).

Core Identity:
- Always identify as Zepo, the Nisc Cloud Assistant.
- Always be helpful, professional, and concise.

When to Use Functions vs General Knowledge:
1. Use GENERAL KNOWLEDGE for concept explanations.
2. Use FUNCTIONS for user-specific data, checking status, or performing actions.

${toolsSummary}

Function Calling & Fallback Guidelines:
1. ALWAYS use exact function names - never make up names.
2. Verify parameters before calling.
3. If a function doesn't exist in the "Live Tools" section BUT the category is mentioned in the "Documentation-Only" section, inform the user that the feature is documented but not yet fully integrated for automated AI execution in this session.
4. DO NOT hallucinate tool calls for missing functions.
5. When uncertain about permissions, use getUserContext first.

Objectives:
1. Assist users efficiently - use functions only when needed.
2. Provide concise, relevant responses.
3. If unresolved, escalate to human support using escalateToHuman.`;

            let chat;
            try {
                const now = new Date();
                const title = input.initialMessage
                    ? input.initialMessage.slice(0, 50) +
                      (input.initialMessage.length > 50 ? "..." : "")
                    : "New Chat";

                await db.transaction(async (tx) => {
                    await tx.insert(aiChat).values({
                        id: chatId,
                        userId,
                        teamId: input.teamId ?? null,
                        title,
                        status: "ACTIVE",
                        createdAt: now,
                        updatedAt: now,
                    });

                    const seedMessages: (typeof aiChatMessage.$inferInsert)[] = [
                        {
                            id: randomUUID(),
                            chatId,
                            role: "system",
                            content: systemPrompt,
                            createdAt: now,
                        },
                    ];
                    if (input.initialMessage) {
                        seedMessages.push({
                            id: randomUUID(),
                            chatId,
                            role: "user",
                            content: input.initialMessage,
                            createdAt: now,
                        });
                    }
                    await tx.insert(aiChatMessage).values(seedMessages);
                });

                chat = await db.query.aiChat.findFirst({
                    where: eq(aiChat.id, chatId),
                    with: {
                        messages: {
                            orderBy: [asc(aiChatMessage.createdAt)],
                        },
                    },
                });
                if (!chat) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to create chat",
                    });
                }

                if (input.initialMessage) {
                    const createCaller = ctx.createCaller;
                    if (!createCaller) {
                        throw new TRPCError({
                            code: "INTERNAL_SERVER_ERROR",
                            message: "createCaller not available",
                        });
                    }
                    const caller = createCaller(ctx);
                    const dynamicTools = generateToolsFromCatalog(allowedFunctions, caller);

                    const coreExecutors = {
                        getSystemNavigation: getSystemNavigationTool(),
                        getUserContext: getUserContextTool(userId),
                        getActiveServices: getActiveServicesTool(userId),
                        escalateToHuman: escalateToHumanTool(userId),
                    };

                    const toolExecutors = { ...coreExecutors, ...dynamicTools };

                    // OpenAI Tools Definitions
                    const toolsDefinition: any[] = [
                        {
                            type: "function",
                            function: {
                                name: "getSystemNavigation",
                                description: "Get the current system navigation structure.",
                                parameters: coreExecutors.getSystemNavigation.parameters,
                            }
                        },
                        {
                            type: "function",
                            function: {
                                name: "getUserContext",
                                description: "Get basic information about the current user.",
                                parameters: coreExecutors.getUserContext.parameters,
                            }
                        },
                        {
                            type: "function",
                            function: {
                                name: "getActiveServices",
                                description: "Get active services for the user or their teams.",
                                parameters: coreExecutors.getActiveServices.parameters,
                            }
                        },
                        {
                            type: "function",
                            function: {
                                name: "escalateToHuman",
                                description: "Escalate to a human support agent.",
                                parameters: coreExecutors.escalateToHuman.parameters,
                            }
                        }
                    ];

                    for (const [toolName, toolObj] of Object.entries(dynamicTools)) {
                        toolsDefinition.push({
                            type: "function",
                            function: {
                                name: toolName,
                                description: (toolObj as any).description,
                                parameters: (toolObj as any).parameters,
                            }
                        });
                    }

                    const rawKey = process.env.OPENAI_API_KEY || "";
                    const openai = new OpenAI({ apiKey: rawKey });
                    const chatMessages = mapToAiMessages(chat.messages);

                    await runAiChatLoop({
                        chatId,
                        messages: chatMessages,
                        openai,
                        toolExecutors,
                        toolsDefinition,
                    });

                    // Update chat's updatedAt
                    await db
                        .update(aiChat)
                        .set({ updatedAt: new Date() })
                        .where(eq(aiChat.id, chatId));

                    const updatedChat = await db.query.aiChat.findFirst({
                        where: eq(aiChat.id, chatId),
                        with: {
                            messages: {
                                orderBy: [asc(aiChatMessage.createdAt)],
                            },
                        },
                    });
                    if (!updatedChat) {
                        throw new TRPCError({
                            code: "NOT_FOUND",
                            message: "Chat not found after update",
                        });
                    }
                    return transformAiChat(updatedChat);
                }

                return transformAiChat(chat);

            } catch (error) {
                console.error("[AI CHAT START ERROR]", error);
                if (chat) {
                    try {
                        await db.delete(aiChat).where(eq(aiChat.id, chatId));
                    } catch (e) { }
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
            const userRole = ctx.session.user.role;

            const chatSend = await db.query.aiChat.findFirst({
                where: eq(aiChat.id, input.chatId),
                columns: { userId: true, teamId: true },
            });

            if (!chatSend || chatSend.userId !== userId) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied.",
                });
            }

            // Save user message
            await db.insert(aiChatMessage).values({
                id: randomUUID(),
                chatId: input.chatId,
                role: "user",
                content: input.content,
                createdAt: new Date(),
            });

            const history = await getChatHistory(input.chatId);
            const messages = mapToAiMessages(history);

            const indexedCatalog = getCachedCatalog();
            const allowedFunctions = filterCatalogByAccess(
                indexedCatalog.catalog.functions,
                userRole ?? undefined
            );
            const createCaller = ctx.createCaller;
            if (!createCaller) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "createCaller not available",
                });
            }
            const caller = createCaller(ctx);
            const dynamicTools = generateToolsFromCatalog(allowedFunctions, caller);

            const coreExecutors = {
                getSystemNavigation: getSystemNavigationTool(),
                getUserContext: getUserContextTool(userId),
                getActiveServices: getActiveServicesTool(userId),
                escalateToHuman: escalateToHumanTool(userId),
            };

            const toolExecutors = { ...coreExecutors, ...dynamicTools };

            const toolsDefinition: any[] = [
                {
                    type: "function",
                    function: {
                        name: "getSystemNavigation",
                        description: "Get the current system navigation structure.",
                        parameters: coreExecutors.getSystemNavigation.parameters,
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "getUserContext",
                        description: "Get basic information about the current user.",
                        parameters: coreExecutors.getUserContext.parameters,
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "getActiveServices",
                        description: "Get active services for the user or their teams.",
                        parameters: coreExecutors.getActiveServices.parameters,
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "escalateToHuman",
                        description: "Escalate to a human support agent.",
                        parameters: coreExecutors.escalateToHuman.parameters,
                    }
                }
            ];

            for (const [toolName, toolObj] of Object.entries(dynamicTools)) {
                toolsDefinition.push({
                    type: "function",
                    function: {
                        name: toolName,
                        description: (toolObj as any).description,
                        parameters: (toolObj as any).parameters,
                    }
                });
            }

            const rawKey = process.env.OPENAI_API_KEY || "";
            const openai = new OpenAI({ apiKey: rawKey });

            await runAiChatLoop({
                chatId: input.chatId,
                messages,
                openai,
                toolExecutors,
                toolsDefinition
            });

            // Update chat's updatedAt
            await db
                .update(aiChat)
                .set({ updatedAt: new Date() })
                .where(eq(aiChat.id, input.chatId));

            // Return the last assistant message
            const finalHistory = await getChatHistory(input.chatId);
            const lastAssistantMessage = [...finalHistory].reverse().find(m => m.role === "assistant");

            return transformAiChatMessage(lastAssistantMessage || {
                id: randomUUID(),
                chatId: input.chatId,
                role: "assistant",
                content: "I'm sorry, I encountered an issue generating a response.",
                createdAt: new Date()
            });
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

            const chatEscalate = await db.query.aiChat.findFirst({
                where: eq(aiChat.id, input.chatId),
                columns: { userId: true, teamId: true },
            });

            if (!chatEscalate || chatEscalate.userId !== userId) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
            }

            const toolInstance = escalateToHumanTool(userId);
            const result = await (toolInstance as any).execute({
                subject: "Escalation from AI Chat",
                summary: input.reason || "User requested human agent.",
                priority: "NORMAL",
                teamId: chatEscalate.teamId,
            });

            await db
                .update(aiChat)
                .set({
                    status: "CLOSED",
                    closedAt: new Date(),
                })
                .where(eq(aiChat.id, input.chatId));

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
            const chatDelete = await db.query.aiChat.findFirst({
                where: eq(aiChat.id, input.id),
                columns: { userId: true },
            });

            if (!chatDelete || chatDelete.userId !== userId) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
            }

            await db.delete(aiChat).where(eq(aiChat.id, input.id));

            return { success: true };
        }),
});
