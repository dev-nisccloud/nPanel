export declare const imageGenAiRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    generateImage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            prompt: string;
            referenceImageUrls?: string[] | undefined;
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
    removeBg: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            image: string;
        };
        output: {
            data: string;
        };
        meta: object;
    }>;
}>>;
