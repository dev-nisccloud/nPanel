export declare const imageGenAiGenerationsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            teamId?: string | undefined;
        };
        output: {
            data: {
                id: string;
                prompt: string;
                referenceImageUrls: string[];
                imageUrl: string;
                imageFileName: string;
                imageSize: number;
                imageMimeType: string;
                imageMetadata: Record<string, any> | null;
                modelId: string;
                modelName: string | null;
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
