export declare const zeepoAgentChatRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    sendMessage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            content: string;
            skillId?: string | undefined;
            attachments?: {
                url: string;
                name: string;
                mimeType: string;
                storageKey?: string | undefined;
            }[] | undefined;
        };
        output: {
            data: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                title: string | null;
                messages: {
                    id: string;
                    role: string;
                    createdAt: Date;
                    metadata: unknown;
                    sessionId: string;
                    content: string | null;
                    toolCalls: unknown;
                    toolCallId: string | null;
                }[];
            } | undefined;
            lastAssistantPreview: string;
        };
        meta: object;
    }>;
    /**
     * Generate a short title for a session based on its first 3 user messages.
     * No-ops if the title is already set (not "New chat" / not null).
     * Runs a lightweight direct Replicate call - does not go through the full
     * orchestration pipeline.
     */
    generateTitle: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
        };
        output: {
            title: string;
        };
        meta: object;
    }>;
    /**
     * Synchronous AI image edit - no background job, result returned directly.
     *
     * Uses black-forest-labs/flux-2-pro with the source image passed via
     * input_images for image-to-image editing. When the user has drawn a mask,
     * the prompt is prefixed to target the brushed region.
     */
    editImage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            imageUrl: string;
            prompt: string;
            generationId?: string | undefined;
            parentId?: string | undefined;
            maskDataUrl?: string | undefined;
            outputFormat?: "webp" | "png" | undefined;
            resolution?: "1 MP" | "2 MP" | undefined;
        };
        output: {
            imageUrl: string;
        };
        meta: object;
    }>;
}>>;
