import { z } from "zod";

// ============================================================================
// AI Chat Schemas
// ============================================================================

export const aiChatStatusSchema = z.enum(["ACTIVE", "ESCALATED", "CLOSED"]);

export const aiChatMessageRoleSchema = z.enum(["system", "user", "assistant", "tool"]);

export const aiChatMessageSchema = z.object({
    id: z.string(),
    chatId: z.string(),
    role: aiChatMessageRoleSchema,
    content: z.string().nullable(),
    toolCalls: z.any().nullable(),
    toolCallId: z.string().nullable(),
    metadata: z.any().nullable(),
    createdAt: z.date(),
});

export const aiChatSchema = z.object({
    id: z.string(),
    userId: z.string(),
    teamId: z.string().nullable(),
    title: z.string().nullable(),
    status: aiChatStatusSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
    closedAt: z.date().nullable(),
    messages: z.array(aiChatMessageSchema).optional(),
});

export const aiChatListItemSchema = z.object({
    id: z.string(),
    title: z.string().nullable(),
    lastMessage: z.string().nullable(),
    timestamp: z.date(),
    status: aiChatStatusSchema,
});

// ============================================================================
// Input Schemas
// ============================================================================

export const getAiChatHistorySchema = z.object({
    teamId: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional().default(20),
    offset: z.number().int().min(0).optional().default(0),
});

export const getAiChatByIdSchema = z.object({
    id: z.string(),
});

export const startAiChatSchema = z.object({
    teamId: z.string().optional(),
    initialMessage: z.string().optional(),
});

export const deleteAiChatSchema = z.object({
    id: z.string(),
});
