export declare const nebMediaLibraryRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    createFromUpload: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            fileName: string;
            fileSize: number;
            mimeType: string;
            fileUrl: string;
            storageKey?: string | undefined;
            description?: string | undefined;
            metadata?: unknown;
            teamId?: string | undefined;
        };
        output: {
            data: {
                id: string;
                userId: string;
                teamId: string | null;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileUrl: string;
                storageKey: string | null;
                description: string | null;
                metadata: unknown;
                createdAt: Date;
            };
        };
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            teamId?: string | undefined;
            onlyImages?: boolean | undefined;
            search?: string | undefined;
        };
        output: {
            data: {
                id: string;
                userId: string;
                teamId: string | null;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileUrl: string;
                storageKey: string | null;
                description: string | null;
                metadata: unknown;
                createdAt: Date;
            }[];
            nextPage: number | null;
        };
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
}>>;
