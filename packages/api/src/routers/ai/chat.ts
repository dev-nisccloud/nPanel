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
import { getCachedCatalog } from "./catalog-parser";
import { generateToolsFromCatalog, filterCatalogByAccess, createToolsSummary } from "./dynamic-tools";
import { appRouter } from "../index";
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

When to Use Functions vs General Knowledge:
1. Use GENERAL KNOWLEDGE for:
   - Explaining concepts, features, or how things work
   - Answering "what is", "how do I", "can I" questions
   - Providing guidance or best practices
   - General platform information

2. Use FUNCTIONS for:
   - Fetching user-specific data (teams, subscriptions, tickets, etc.)
   - Checking current status or details
   - Performing actions or mutations
   - Getting real-time information

Function Calling Guidelines:
1. ALWAYS use exact function names from your available tools - never make up function names
2. Verify parameter types and required fields before calling
3. If a function doesn't exist, clearly inform the user instead of hallucinating
4. When uncertain about permissions, use getUserContext first
5. Read function descriptions carefully to understand what each does

3. FORMATTING (MARKDOWN):
   - Use **bold** for key terms, names, and titles
   - Use \`code blocks\` for technical identifiers (IDs, handles, hashes)
   - Use bullet points or numbered lists for lists of items
   - Use **Tables** for multi-field data or comparisons
   - Use \`![image](url)\` for displaying images if provided by a tool

4. FORMAT EXAMPLES:
   - Domains: "You have **3 domains**:
     - \`example.com\` (Expiring soon)
     - \`test.net\`
     - \`demo.org\`"
   - Teams: "You're part of **2 teams**: **Marketing Team**, **Development Team**"
   - Tickets: "| Ticket # | Subject | Priority |
     | :--- | :--- | :--- |
     | \`#TKT-001\` | Login Issue | **High** |
     | \`#TKT-002\` | DNS Setup | Normal |"

Available Function Categories:
- Plesk Integration (hosting, domains, WordPress, email, databases)
- OpenProvider (domain registration, DNS)
- eTIMS (Kenya KRA tax integration)
- Advertising (Google Ads, Meta Ads, LinkedIn Ads)
- Marketing (email campaigns, SEO)
- Creative (image generation, assets)
- Business (teams, clients, tickets, invoicing)

Examples of Proper Usage:

Example 1 - General Knowledge (NO function needed):
User: "What is a domain name?"
Response: "A domain name is the address people use to find your website..."

Example 2 - User Data (USE function):
User: "What domains do I have?"
Action: Call teamsGetUserTeams or domainsGetByTeam
Response: "You have 3 domains: example.com, test.net, demo.org"

Example 3 - Concise Formatting:
User: "Show me my teams"
Action: Call teamsGetUserTeams
Response: "You're part of 2 teams: Marketing Team, Development Team" (NOT full JSON objects)

Example 4 - Partial Information:
User: "Do I have any high priority tickets?"
Action: Call ticketsGetAll with priority filter
Response: "Yes, you have 2 high priority tickets: #TKT-001 (Login Issue), #TKT-003 (Payment Bug)"

Objectives:
1. Assist users efficiently - use functions only when needed
2. Provide concise, relevant responses - extract only what user asked for
3. If you cannot resolve a query, escalate to human support using escalateToHuman`,
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
                    // 2. Load catalog and generate dynamic tools
                    const indexedCatalog = getCachedCatalog();
                    const userRole = ctx.session.user.role;
                    const allowedFunctions = filterCatalogByAccess(
                        indexedCatalog.catalog.functions,
                        userRole
                    );

                    // Create tRPC caller for executing procedures
                    const caller = appRouter.createCaller(ctx);
                    const dynamicTools = generateToolsFromCatalog(allowedFunctions, caller);

                    // 3. Call OpenAI with tools
                    const messages = mapToAiMessages(chat.messages);
                    const openai = getOpenai();
                    const result = await generateText({
                        model: openai("gpt-4o-mini"),
                        messages,
                        tools: {
                            // Core utility tools
                            getSystemNavigation: getSystemNavigationTool(),
                            getUserContext: getUserContextTool(userId),
                            escalateToHuman: escalateToHumanTool(userId),
                            // Dynamic catalog-based tools
                            ...dynamicTools,
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

            // 4. Load catalog and generate dynamic tools
            const indexedCatalog = getCachedCatalog();
            const userRole = ctx.session.user.role;
            const allowedFunctions = filterCatalogByAccess(
                indexedCatalog.catalog.functions,
                userRole
            );

            // Create tRPC caller for executing procedures
            const caller = appRouter.createCaller(ctx);
            const dynamicTools = generateToolsFromCatalog(allowedFunctions, caller);

            // 5. Call OpenAI with tools
            const openai = getOpenai();
            const result = await generateText({
                model: openai("gpt-4o-mini"),
                messages,
                tools: {
                    // Core utility tools
                    getSystemNavigation: getSystemNavigationTool(),
                    getUserContext: getUserContextTool(userId),
                    escalateToHuman: escalateToHumanTool(userId),
                    // Dynamic catalog-based tools
                    ...dynamicTools,
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
