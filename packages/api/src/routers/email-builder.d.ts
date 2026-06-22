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
                teamId: string | null;
                description: string | null;
                userId: string;
                isPublic: boolean;
                thumbnailUrl: string | null;
                isAiGenerated: boolean;
                aiStatus: string;
                aiContext: unknown;
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
                teamId: string | null;
                description: string | null;
                userId: string;
                isPublic: boolean;
                thumbnailUrl: string | null;
                isAiGenerated: boolean;
                aiStatus: string;
                aiContext: unknown;
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
                isAiGenerated: boolean;
                aiStatus: string;
                aiContext: unknown;
                createdAt: Date;
                updatedAt: Date;
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
                teamId: string | null;
                description: string | null;
                userId: string;
                isPublic: boolean;
                thumbnailUrl: string | null;
                isAiGenerated: boolean;
                aiStatus: string;
                aiContext: unknown;
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
