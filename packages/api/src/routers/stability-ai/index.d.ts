export declare const stabilityAiRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Generate an image using Stability AI
     */
    generate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            prompt: string;
            negativePrompt?: string | undefined;
            aspectRatio?: "1:1" | "2:3" | "3:2" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9" | "9:21" | undefined;
            stylePreset?: "cinematic" | "anime" | "3d-model" | "analog-film" | "comic-book" | "digital-art" | "enhance" | "fantasy-art" | "isometric" | "line-art" | "low-poly" | "modeling-compound" | "neon-punk" | "origami" | "photographic" | "pixel-art" | "tile-texture" | undefined;
            seed?: number | undefined;
            outputFormat?: "webp" | "jpeg" | "png" | undefined;
            model?: "core" | "ultra" | "sd3" | undefined;
            sd3Model?: "sd3.5-large" | "sd3.5-large-turbo" | "sd3.5-medium" | "sd3.5-flash" | undefined;
        };
        output: {
            image: string;
            mimeType: string;
            seed: number;
            finishReason: string;
        };
        meta: object;
    }>;
    /**
     * Remove background from an image using Stability AI
     */
    removeBackground: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            image: string;
            outputFormat?: "webp" | "jpeg" | "png" | undefined;
        };
        output: {
            image: string;
            mimeType: string;
            seed: number | null;
            finishReason: string;
        };
        meta: object;
    }>;
}>>;
