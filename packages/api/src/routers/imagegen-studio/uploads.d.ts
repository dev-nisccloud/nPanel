export declare const imageGenUploadsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            fileUrl: string;
            fileKey: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            fileMetadata?: Record<string, any> | undefined;
            teamId?: string | undefined;
        };
        output: {
            data: {
                id: string;
                fileUrl: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileMetadata: Record<string, any> | null;
                createdAt: Date;
                updatedAt: Date;
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
                fileUrl: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileMetadata: Record<string, any> | null;
                createdAt: Date;
                updatedAt: Date;
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
            data: {
                id: string;
            };
        };
        meta: object;
    }>;
}>>;
