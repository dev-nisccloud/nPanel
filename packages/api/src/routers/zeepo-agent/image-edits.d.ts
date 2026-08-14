export declare const zeepoAgentImageEditsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Return the full edit history for a given generation, oldest first.
     */
    listEditHistory: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            generationId: string;
        };
        output: {
            history: {
                id: string;
                createdAt: Date;
                userId: string;
                metadata: unknown;
                sessionId: string;
                prompt: string | null;
                generationId: string;
                parentId: string | null;
                imageUrl: string;
                operationType: string;
                label: string | null;
            }[];
        };
        meta: object;
    }>;
    /**
     * Manually persist any image URL as a history entry.
     * Used by the frontend after the first time an image is opened in the panel
     * (creates the "original" snapshot) and after instruction edits via editImage.
     */
    saveEditedImage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            generationId: string;
            imageUrl: string;
            parentId?: string | undefined;
            operationType?: "instruction" | "style" | "original" | "erase" | "background_swap" | "upscale" | "text_edit" | "variation" | undefined;
            label?: string | undefined;
            prompt?: string | undefined;
            metadata?: Record<PropertyKey, unknown> | undefined;
        };
        output: {
            record: {
                sessionId: string;
                generationId: string;
                parentId?: string;
                userId: string;
                imageUrl: string;
                operationType: string;
                label?: string;
                prompt?: string;
                metadata?: Record<string, unknown>;
                id: `${string}-${string}-${string}-${string}-${string}`;
            };
            imageUrl: string;
        };
        meta: object;
    }>;
    /**
     * Apply a style preset or custom style to an image using flux-2-pro
     * image-to-image.
     */
    styleTransfer: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            generationId: string;
            imageUrl: string;
            style: "watercolor" | "oil_painting" | "cinematic" | "anime" | "pixel_art" | "neon" | "pencil_sketch" | "vintage";
            parentId?: string | undefined;
            customPrompt?: string | undefined;
            outputFormat?: "webp" | "png" | undefined;
            resolution?: "1 MP" | "2 MP" | undefined;
        };
        output: {
            imageUrl: string;
            record: {
                sessionId: string;
                generationId: string;
                parentId?: string;
                userId: string;
                imageUrl: string;
                operationType: string;
                label?: string;
                prompt?: string;
                metadata?: Record<string, unknown>;
                id: `${string}-${string}-${string}-${string}-${string}`;
            };
        };
        meta: object;
    }>;
    /**
     * Erase an object from the image. The user paints a mask in the panel;
     * white pixels indicate the region to erase.
     * Uses bria/eraser - trained on licensed data, commercial-safe.
     */
    eraseObject: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            generationId: string;
            imageUrl: string;
            maskDataUrl: string;
            parentId?: string | undefined;
        };
        output: {
            imageUrl: string;
            record: {
                sessionId: string;
                generationId: string;
                parentId?: string;
                userId: string;
                imageUrl: string;
                operationType: string;
                label?: string;
                prompt?: string;
                metadata?: Record<string, unknown>;
                id: `${string}-${string}-${string}-${string}-${string}`;
            };
        };
        meta: object;
    }>;
    /**
     * Swap the background of an image to a new scene described by bgPrompt.
     * Uses bria/generate-background which handles foreground extraction internally.
     */
    swapBackground: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            generationId: string;
            imageUrl: string;
            bgPrompt: string;
            parentId?: string | undefined;
            bgPreset?: "studio_white" | "gradient_blue" | "outdoor_park" | "office_desk" | "abstract_dark" | "sunset_beach" | undefined;
        };
        output: {
            imageUrl: string;
            record: {
                sessionId: string;
                generationId: string;
                parentId?: string;
                userId: string;
                imageUrl: string;
                operationType: string;
                label?: string;
                prompt?: string;
                metadata?: Record<string, unknown>;
                id: `${string}-${string}-${string}-${string}-${string}`;
            };
        };
        meta: object;
    }>;
    /**
     * Upscale and sharpen an image using recraft-ai/recraft-crisp-upscale.
     * No prompt needed - simply pass the image URL.
     */
    upscaleImage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            generationId: string;
            imageUrl: string;
            parentId?: string | undefined;
        };
        output: {
            imageUrl: string;
            record: {
                sessionId: string;
                generationId: string;
                parentId?: string;
                userId: string;
                imageUrl: string;
                operationType: string;
                label?: string;
                prompt?: string;
                metadata?: Record<string, unknown>;
                id: `${string}-${string}-${string}-${string}-${string}`;
            };
        };
        meta: object;
    }>;
    /**
     * Edit text visible in an image using qwen/qwen-image-edit-2511.
     * Prompt example: "Change 'GRAND OPENING' to 'SOLD OUT'"
     */
    editText: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            generationId: string;
            imageUrl: string;
            prompt: string;
            parentId?: string | undefined;
        };
        output: {
            imageUrl: string;
            record: {
                sessionId: string;
                generationId: string;
                parentId?: string;
                userId: string;
                imageUrl: string;
                operationType: string;
                label?: string;
                prompt?: string;
                metadata?: Record<string, unknown>;
                id: `${string}-${string}-${string}-${string}-${string}`;
            };
        };
        meta: object;
    }>;
    /**
     * Generate 3 variations of the current image using flux-2-pro with
     * different seeds. Returns all three so the user can pick one.
     */
    generateVariations: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            generationId: string;
            imageUrl: string;
            parentId?: string | undefined;
            prompt?: string | undefined;
            outputFormat?: "webp" | "png" | undefined;
        };
        output: {
            variations: ({
                imageUrl: string;
                record: {
                    sessionId: string;
                    generationId: string;
                    parentId?: string;
                    userId: string;
                    imageUrl: string;
                    operationType: string;
                    label?: string;
                    prompt?: string;
                    metadata?: Record<string, unknown>;
                    id: `${string}-${string}-${string}-${string}-${string}`;
                };
            } | null)[];
        };
        meta: object;
    }>;
}>>;
