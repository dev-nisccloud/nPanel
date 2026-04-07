import { z } from "zod";
export declare const aiChatStatusSchema: z.ZodEnum<{
    ACTIVE: "ACTIVE";
    CLOSED: "CLOSED";
    ESCALATED: "ESCALATED";
}>;
export declare const aiChatMessageRoleSchema: z.ZodEnum<{
    user: "user";
    system: "system";
    assistant: "assistant";
    tool: "tool";
}>;
export declare const aiChatMessageSchema: z.ZodObject<{
    id: z.ZodString;
    chatId: z.ZodString;
    role: z.ZodEnum<{
        user: "user";
        system: "system";
        assistant: "assistant";
        tool: "tool";
    }>;
    content: z.ZodNullable<z.ZodString>;
    toolCalls: z.ZodNullable<z.ZodAny>;
    toolCallId: z.ZodNullable<z.ZodString>;
    metadata: z.ZodNullable<z.ZodAny>;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export declare const aiChatSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    teamId: z.ZodNullable<z.ZodString>;
    title: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        CLOSED: "CLOSED";
        ESCALATED: "ESCALATED";
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    closedAt: z.ZodNullable<z.ZodDate>;
    messages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        chatId: z.ZodString;
        role: z.ZodEnum<{
            user: "user";
            system: "system";
            assistant: "assistant";
            tool: "tool";
        }>;
        content: z.ZodNullable<z.ZodString>;
        toolCalls: z.ZodNullable<z.ZodAny>;
        toolCallId: z.ZodNullable<z.ZodString>;
        metadata: z.ZodNullable<z.ZodAny>;
        createdAt: z.ZodDate;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const aiChatListItemSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodNullable<z.ZodString>;
    lastMessage: z.ZodNullable<z.ZodString>;
    timestamp: z.ZodDate;
    status: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        CLOSED: "CLOSED";
        ESCALATED: "ESCALATED";
    }>;
}, z.core.$strip>;
export declare const getAiChatHistorySchema: z.ZodObject<{
    teamId: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export declare const getAiChatByIdSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const startAiChatSchema: z.ZodObject<{
    teamId: z.ZodOptional<z.ZodString>;
    initialMessage: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const deleteAiChatSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
