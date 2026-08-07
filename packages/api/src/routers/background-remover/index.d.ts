export declare const backgroundRemoverRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    startBackgroundRemoval: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            image: string;
            teamId?: string | undefined;
            originalImageKey?: string | undefined;
            originalImageFileName?: string | undefined;
            originalImageSize?: number | undefined;
            originalImageMimeType?: string | undefined;
        };
        output: {
            generationId: string;
            status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
        };
        meta: object;
    }>;
    removeBackground: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            image: string;
            teamId?: string | undefined;
        };
        output: {
            data: string;
            generationId: string;
        };
        meta: object;
    }>;
    updateGenerationAfterUpload: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            generationId: string;
            originalImageUrl: string;
            originalImageKey: string;
            originalImageFileName: string;
            originalImageSize: number;
            originalImageMimeType: string;
            processedImageUrl: string;
            processedImageKey: string;
            processedImageFileName: string;
            processedImageSize: number;
            processedImageMimeType: string;
        };
        output: {
            data: {
                id: string;
            };
        };
        meta: object;
    }>;
    getGenerations: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number | undefined;
            limit?: number | undefined;
            teamId?: string | undefined;
        };
        output: {
            data: {
                id: string;
                userId: string;
                teamId: string | null;
                originalImageUrl: string;
                originalImageKey: string;
                originalImageFileName: string;
                originalImageSize: number;
                originalImageMimeType: string;
                originalImageMetadata: Record<string, any> | null;
                processedImageUrl: string | null;
                processedImageKey: string | null;
                processedImageFileName: string | null;
                processedImageSize: number | null;
                processedImageMimeType: string | null;
                processedImageMetadata: Record<string, any> | null;
                modelId: string;
                modelName: string | null;
                status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
                errorMessage: string | null;
                qstashMessageId: string | null;
                startedAt: Date | null;
                completedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
        meta: object;
    }>;
    deleteGeneration: import("@trpc/server").TRPCMutationProcedure<{
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
