export declare const zeepoAiSessionsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            title?: string | undefined;
            teamId?: string | undefined;
        };
        output: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            teamId: string | null;
            metadata: unknown;
            title: string | null;
        } | undefined;
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            teamId?: string | undefined;
        };
        output: {
            sessions: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                metadata: unknown;
                title: string | null;
            }[];
            page: number;
            limit: number;
            total: number;
        };
        meta: object;
    }>;
    listLibrary: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            teamId?: string | undefined;
            kind?: "image" | "all" | "document" | "presentation" | undefined;
        };
        output: {
            items: {
                sessionTitle: string;
                isEditHistory: boolean;
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                metadata: unknown;
                completedAt: Date | null;
                qstashMessageId: string | null;
                startedAt: Date | null;
                sessionId: string;
                messageId: string | null;
                errorMessage: string | null;
                kind: string;
                provider: string;
                modelId: string;
                providerRequestId: string | null;
                parentGenerationId: string | null;
                tokensDebited: string | null;
                providerCostUsdMicros: number | null;
                prompt: string | null;
                inputs: unknown;
                outputs: unknown;
            }[];
            page: number;
            limit: number;
            total: number;
        } | {
            items: ({
                sessionTitle: string;
                isEditHistory: false;
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                metadata: unknown;
                completedAt: Date | null;
                qstashMessageId: string | null;
                startedAt: Date | null;
                sessionId: string;
                messageId: string | null;
                errorMessage: string | null;
                kind: string;
                provider: string;
                modelId: string;
                providerRequestId: string | null;
                parentGenerationId: string | null;
                tokensDebited: string | null;
                providerCostUsdMicros: number | null;
                prompt: string | null;
                inputs: unknown;
                outputs: unknown;
            } | {
                id: string;
                sessionId: string;
                userId: string;
                teamId: string | null;
                messageId: string | null;
                kind: "image";
                provider: string;
                status: "COMPLETED";
                progress: null;
                errorMessage: null;
                url: string;
                thumbnailUrl: null;
                title: string;
                description: string | null;
                prompt: string | null;
                outputs: {
                    imageUrl: string;
                };
                metadata: {
                    operationType: string;
                    parentGenerationId: string;
                    isEditHistory: boolean;
                };
                tokensDebited: string | null;
                providerCostUsdMicros: number | null;
                modelId: string | null;
                providerRequestId: string | null;
                parentGenerationId: string;
                createdAt: Date;
                updatedAt: Date;
                sessionTitle: string;
                isEditHistory: true;
            })[];
            page: number;
            limit: number;
            total: number;
        };
        meta: object;
    }>;
    openSupportTicket: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            phone?: string | null | undefined;
            intent?: "support" | "sales" | undefined;
        };
        output: {
            _tool: "create_support_ticket";
            ok: true;
            alreadyOpen: boolean;
            ticketId: string;
            ticketNumber: string;
            intent: import("../../lib/create-ai-support-ticket").AiSupportTicketIntent;
            subject: string;
        };
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            session: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                metadata: unknown;
                title: string | null;
            };
            messages: {
                id: string;
                role: string;
                status: string;
                createdAt: Date;
                metadata: unknown;
                sessionId: string;
                content: string | null;
                reasoning: string | null;
                toolCalls: unknown;
                toolCallId: string | null;
                inputTokens: number | null;
                outputTokens: number | null;
                cacheReadTokens: number | null;
                cacheWriteTokens: number | null;
            }[];
            generations: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                metadata: unknown;
                completedAt: Date | null;
                qstashMessageId: string | null;
                startedAt: Date | null;
                sessionId: string;
                messageId: string | null;
                errorMessage: string | null;
                kind: string;
                provider: string;
                modelId: string;
                providerRequestId: string | null;
                parentGenerationId: string | null;
                tokensDebited: string | null;
                providerCostUsdMicros: number | null;
                prompt: string | null;
                inputs: unknown;
                outputs: unknown;
            }[];
            attachments: {
                id: string;
                name: string;
                createdAt: Date;
                userId: string;
                metadata: unknown;
                sessionId: string;
                messageId: string | null;
                url: string;
                storageKey: string | null;
                mimeType: string;
                sizeBytes: number | null;
            }[];
            toolInvocations: {
                id: string;
                status: string;
                createdAt: Date;
                messageId: string | null;
                toolName: string;
                result: unknown;
            }[];
        };
        meta: object;
    }>;
    updateTitle: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            title: string;
        };
        output: {
            id: string;
            title: string;
        };
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            ok: boolean;
        };
        meta: object;
    }>;
    checkWelcomeEligibility: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId?: string | undefined;
        };
        output: {
            eligible: boolean;
            reason?: string;
            tokensIfGranted: number;
        };
        meta: object;
    }>;
    /** Actually attempt the one-time welcome grant (idempotent). */
    claimWelcomeGrant: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            teamId: string;
        };
        output: import("../../lib/zeepo-ai-free-token-grant").FreeTokenGrantResult;
        meta: object;
    }>;
}>>;
