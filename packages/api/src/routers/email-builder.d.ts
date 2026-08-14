export declare const emailBuilderRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            json: string;
            description?: string | undefined;
            thumbnailUrl?: string | undefined;
            isPublic?: boolean | undefined;
            teamId?: string | undefined;
        };
        output: {
            data: {
                json: string;
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                description: string | null;
                isPublic: boolean;
                thumbnailUrl: string | null;
                saveStatus: string;
                lastSaveError: string | null;
                isAiGenerated: boolean;
                aiStatus: string;
                aiContext: unknown;
                clientVersion: number;
                lastSavedAt: Date | null;
            };
        };
        meta: object;
    }>;
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            data: {
                json: string;
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                description: string | null;
                isPublic: boolean;
                thumbnailUrl: string | null;
                saveStatus: string;
                lastSaveError: string | null;
                isAiGenerated: boolean;
                aiStatus: string;
                aiContext: unknown;
                clientVersion: number;
                lastSavedAt: Date | null;
            };
        };
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            teamId?: string | undefined;
        };
        output: {
            data: {
                id: string;
                name: string;
                description: string | null;
                thumbnailUrl: string | null;
                isPublic: boolean;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
            }[];
            nextPage: number | null;
        };
        meta: object;
    }>;
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            name?: string | undefined;
            description?: string | undefined;
            json?: string | undefined;
            thumbnailUrl?: string | undefined;
            isPublic?: boolean | undefined;
        };
        output: {
            data: {
                id: string;
                name: string;
                description: string | null;
                userId: string;
                teamId: string | null;
                json: string;
                thumbnailUrl: string | null;
                isPublic: boolean;
                saveStatus: string;
                lastSaveError: string | null;
                isAiGenerated: boolean;
                aiStatus: string;
                aiContext: unknown;
                clientVersion: number;
                createdAt: Date;
                updatedAt: Date;
                lastSavedAt: Date | null;
            };
        };
        meta: object;
    }>;
    saveContent: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            designId: string;
            json: string;
            clientVersion?: number | undefined;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                name: string;
                description: string | null;
                userId: string;
                teamId: string | null;
                json: string;
                thumbnailUrl: string | null;
                isPublic: boolean;
                saveStatus: string;
                lastSaveError: string | null;
                isAiGenerated: boolean;
                aiStatus: string;
                aiContext: unknown;
                clientVersion: number;
                createdAt: Date;
                updatedAt: Date;
                lastSavedAt: Date | null;
            } | undefined;
            operationId: `${string}-${string}-${string}-${string}-${string}`;
            version: number;
        };
        meta: object;
    }>;
    getOperations: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            designId: string;
            status?: "QUEUED" | "PROCESSING" | "FAILED" | "COMPLETED" | undefined;
            limit?: number | undefined;
        };
        output: {
            data: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                completedAt: Date | null;
                qstashMessageId: string | null;
                payload: unknown;
                startedAt: Date | null;
                result: unknown;
                errorMessage: string | null;
                operationType: string;
                clientVersion: number | null;
                designId: string;
            }[];
        };
        meta: object;
    }>;
    createOperation: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            designId: string;
            operationType: "AUTO_SAVE" | "AI_GENERATION" | "IMAGE_UPLOAD";
            payload?: any;
            status?: "QUEUED" | "PROCESSING" | "FAILED" | "COMPLETED" | undefined;
        };
        output: {
            data: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                completedAt: Date | null;
                qstashMessageId: string | null;
                payload: unknown;
                startedAt: Date | null;
                result: unknown;
                errorMessage: string | null;
                operationType: string;
                clientVersion: number | null;
                designId: string;
            } | undefined;
        };
        meta: object;
    }>;
    getDesignHtml: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            designId: string;
        };
        output: {
            success: boolean;
            data: {
                html: string;
                name: string;
            };
        };
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            data: {
                id: string;
            };
        };
        meta: object;
    }>;
    duplicate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            data: {
                json: string;
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                description: string | null;
                isPublic: boolean;
                thumbnailUrl: string | null;
                saveStatus: string;
                lastSaveError: string | null;
                isAiGenerated: boolean;
                aiStatus: string;
                aiContext: unknown;
                clientVersion: number;
                lastSavedAt: Date | null;
            };
        };
        meta: object;
    }>;
    generateWithAi: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            designId: string;
            audience: string;
            goal: string;
            tone: string;
            companyName?: string | undefined;
            productName?: string | undefined;
            emailType?: string | undefined;
            imageCount?: number | undefined;
            brandColors?: string[] | undefined;
            instructions?: string | undefined;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    getAiStatus: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            designId: string;
        };
        output: {
            data: {
                isAiGenerated: boolean;
                aiStatus: string;
            };
        };
        meta: object;
    }>;
}>>;
