export declare const imageGeneratorRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    startGeneration: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            prompt: string;
            referenceImageUrls?: string[] | undefined;
            aspectRatio?: "21:9" | "16:9" | "3:2" | "5:4" | "1:1" | "4:5" | "2:3" | "9:16" | "3:4" | "4:3" | undefined;
            outputFormat?: "png" | "jpg" | undefined;
            resolution?: "1K" | "2K" | "4K" | undefined;
            variations?: number | undefined;
            teamId?: string | undefined;
        };
        output: {
            generationId: string;
            status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
            variationsCount: number;
        };
        meta: object;
    }>;
    generateImage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            prompt: string;
            referenceImageUrls?: string[] | undefined;
            aspectRatio?: "21:9" | "16:9" | "3:2" | "5:4" | "1:1" | "4:5" | "2:3" | "9:16" | "3:4" | "4:3" | undefined;
            outputFormat?: "png" | "jpg" | undefined;
            resolution?: "1K" | "2K" | "4K" | undefined;
            variations?: number | undefined;
            teamId?: string | undefined;
        };
        output: {
            generationId: `${string}-${string}-${string}-${string}-${string}`;
            variations: {
                id: string;
                variationIndex: number;
                imageUrl: string;
                imageFileName: string;
                imageSize: number;
                imageMimeType: string;
            }[];
        };
        meta: object;
    }>;
    updateVariationAfterUpload: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            variationId: string;
            imageUrl: string;
            imageKey: string;
            imageFileName: string;
            imageSize: number;
            imageMimeType: string;
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
                prompt: string;
                referenceImageUrls: string[] | null;
                aspectRatio: string;
                outputFormat: string;
                resolution: string;
                variationsCount: number;
                modelId: string;
                modelName: string | null;
                status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
                errorMessage: string | null;
                qstashMessageId: string | null;
                startedAt: Date | null;
                completedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                variations: {
                    id: string;
                    imageGeneratorGenerationId: string;
                    variationIndex: number;
                    status: "PROCESSING" | "COMPLETED" | "FAILED";
                    errorMessage: string | null;
                    imageUrl: string | null;
                    imageKey: string | null;
                    imageFileName: string | null;
                    imageSize: number | null;
                    imageMimeType: string | null;
                    imageMetadata: Record<string, any> | null;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
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
    getGenerationById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            userId: string;
            teamId: string | null;
            prompt: string;
            referenceImageUrls: string[] | null;
            aspectRatio: string;
            outputFormat: string;
            resolution: string;
            variationsCount: number;
            modelId: string;
            modelName: string | null;
            status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
            errorMessage: string | null;
            qstashMessageId: string | null;
            startedAt: Date | null;
            completedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            variations: {
                id: string;
                imageGeneratorGenerationId: string;
                variationIndex: number;
                status: "PROCESSING" | "COMPLETED" | "FAILED";
                errorMessage: string | null;
                imageUrl: string | null;
                imageKey: string | null;
                imageFileName: string | null;
                imageSize: number | null;
                imageMimeType: string | null;
                imageMetadata: Record<string, any> | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
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
