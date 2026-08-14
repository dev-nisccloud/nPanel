import { z } from "zod";
export declare const createSessionSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const listSessionsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const listLibrarySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    teamId: z.ZodOptional<z.ZodString>;
    kind: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        image: "image";
        all: "all";
        document: "document";
        presentation: "presentation";
    }>>>;
}, z.core.$strip>;
export declare const getSessionSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const deleteSessionSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const updateSessionTitleSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
}, z.core.$strip>;
export declare const messageFeedbackSchema: z.ZodObject<{
    messageId: z.ZodString;
    feedback: z.ZodEnum<{
        like: "like";
        dislike: "dislike";
        clear: "clear";
    }>;
}, z.core.$strip>;
export declare const registerAttachmentSchema: z.ZodObject<{
    sessionId: z.ZodString;
    url: z.ZodString;
    name: z.ZodString;
    mimeType: z.ZodString;
    storageKey: z.ZodOptional<z.ZodString>;
    sizeBytes: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const streamTurnBodySchema: z.ZodObject<{
    sessionId: z.ZodString;
    content: z.ZodString;
    teamId: z.ZodOptional<z.ZodString>;
    skillId: z.ZodOptional<z.ZodString>;
    searchEnabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    attachmentIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    modelId: z.ZodOptional<z.ZodString>;
    replaceFromUserMessageId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const listBillingActivitySchema: z.ZodObject<{
    teamId: z.ZodString;
    limit: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const listUsageActivitySchema: z.ZodObject<{
    from: z.ZodCoercedDate<unknown>;
    to: z.ZodCoercedDate<unknown>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    provider: z.ZodDefault<z.ZodEnum<{
        google: "google";
        anthropic: "anthropic";
        all: "all";
    }>>;
    eventType: z.ZodDefault<z.ZodEnum<{
        generation: "generation";
        other: "other";
        all: "all";
        chat_turn: "chat_turn";
        image_edit: "image_edit";
    }>>;
    status: z.ZodDefault<z.ZodEnum<{
        failed: "failed";
        succeeded: "succeeded";
        partial: "partial";
        all: "all";
        cancelled: "cancelled";
    }>>;
    teamId: z.ZodOptional<z.ZodString>;
    groupBy: z.ZodDefault<z.ZodEnum<{
        user: "user";
        team: "team";
    }>>;
    surface: z.ZodDefault<z.ZodEnum<{
        all: "all";
        support_fab: "support_fab";
        zeepo_ai: "zeepo_ai";
    }>>;
}, z.core.$strip>;
export declare const getBalanceSchema: z.ZodObject<{
    teamId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
