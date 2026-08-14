export declare const zeepoAiImageEditsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
                provider: string | null;
                modelId: string | null;
                providerRequestId: string | null;
                tokensDebited: string | null;
                providerCostUsdMicros: number | null;
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
                createdAt: string;
                sessionId: string;
                generationId: string;
                parentId?: string | null;
                userId: string;
                imageUrl: string;
                operationType: string;
                label?: string;
                prompt?: string;
                provider?: string;
                modelId?: string;
                providerRequestId?: string | null;
                metadata?: Record<string, unknown>;
                id: `${string}-${string}-${string}-${string}-${string}`;
            };
            imageUrl: string;
        };
        meta: object;
    }>;
    instruct: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            generationId: string;
            imageUrl: string;
            prompt: string;
            parentId?: string | undefined;
            maskDataUrl?: string | undefined;
        };
        output: {
            imageUrl: string;
            record: {
                createdAt: string;
                sessionId: string;
                generationId: string;
                parentId?: string | null;
                userId: string;
                imageUrl: string;
                operationType: string;
                label?: string;
                prompt?: string;
                provider?: string;
                modelId?: string;
                providerRequestId?: string | null;
                metadata?: Record<string, unknown>;
                id: `${string}-${string}-${string}-${string}-${string}`;
            };
        };
        meta: object;
    }>;
    styleTransfer: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            generationId: string;
            imageUrl: string;
            style: "watercolor" | "oil_painting" | "cinematic" | "anime" | "pixel_art" | "neon" | "pencil_sketch" | "vintage";
            parentId?: string | undefined;
            customPrompt?: string | undefined;
        };
        output: {
            imageUrl: string;
            record: {
                createdAt: string;
                sessionId: string;
                generationId: string;
                parentId?: string | null;
                userId: string;
                imageUrl: string;
                operationType: string;
                label?: string;
                prompt?: string;
                provider?: string;
                modelId?: string;
                providerRequestId?: string | null;
                metadata?: Record<string, unknown>;
                id: `${string}-${string}-${string}-${string}-${string}`;
            };
        };
        meta: object;
    }>;
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
                createdAt: string;
                sessionId: string;
                generationId: string;
                parentId?: string | null;
                userId: string;
                imageUrl: string;
                operationType: string;
                label?: string;
                prompt?: string;
                provider?: string;
                modelId?: string;
                providerRequestId?: string | null;
                metadata?: Record<string, unknown>;
                id: `${string}-${string}-${string}-${string}-${string}`;
            };
        };
        meta: object;
    }>;
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
                createdAt: string;
                sessionId: string;
                generationId: string;
                parentId?: string | null;
                userId: string;
                imageUrl: string;
                operationType: string;
                label?: string;
                prompt?: string;
                provider?: string;
                modelId?: string;
                providerRequestId?: string | null;
                metadata?: Record<string, unknown>;
                id: `${string}-${string}-${string}-${string}-${string}`;
            };
        };
        meta: object;
    }>;
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
                createdAt: string;
                sessionId: string;
                generationId: string;
                parentId?: string | null;
                userId: string;
                imageUrl: string;
                operationType: string;
                label?: string;
                prompt?: string;
                provider?: string;
                modelId?: string;
                providerRequestId?: string | null;
                metadata?: Record<string, unknown>;
                id: `${string}-${string}-${string}-${string}-${string}`;
            };
        };
        meta: object;
    }>;
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
                createdAt: string;
                sessionId: string;
                generationId: string;
                parentId?: string | null;
                userId: string;
                imageUrl: string;
                operationType: string;
                label?: string;
                prompt?: string;
                provider?: string;
                modelId?: string;
                providerRequestId?: string | null;
                metadata?: Record<string, unknown>;
                id: `${string}-${string}-${string}-${string}-${string}`;
            };
        };
        meta: object;
    }>;
    generateVariations: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            generationId: string;
            imageUrl: string;
            parentId?: string | undefined;
            prompt?: string | undefined;
            count?: number | undefined;
        };
        output: {
            variations: {
                imageUrl: string;
                record: {
                    createdAt: string;
                    sessionId: string;
                    generationId: string;
                    parentId?: string | null;
                    userId: string;
                    imageUrl: string;
                    operationType: string;
                    label?: string;
                    prompt?: string;
                    provider?: string;
                    modelId?: string;
                    providerRequestId?: string | null;
                    metadata?: Record<string, unknown>;
                    id: `${string}-${string}-${string}-${string}-${string}`;
                };
            }[];
        };
        meta: object;
    }>;
}>>;
