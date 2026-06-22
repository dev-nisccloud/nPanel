export declare const zeepoAgentRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    sessions: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                title?: string | undefined;
                teamId?: string | undefined;
            };
            output: {
                data: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    teamId: string | null;
                    status: string;
                    userId: string;
                    title: string | null;
                } | undefined;
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
                    createdAt: Date;
                    updatedAt: Date;
                    teamId: string | null;
                    status: string;
                    userId: string;
                    title: string | null;
                }[];
                total: any;
                page: number;
                limit: number;
            };
            meta: object;
        }>;
        get: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                data: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    teamId: string | null;
                    status: string;
                    userId: string;
                    title: string | null;
                    messages: {
                        id: string;
                        createdAt: Date;
                        metadata: unknown;
                        role: string;
                        content: string | null;
                        toolCalls: unknown;
                        toolCallId: string | null;
                        sessionId: string;
                    }[];
                };
            };
            meta: object;
        }>;
        updateTitle: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                title: string;
            };
            output: {
                success: true;
                title: string;
            };
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                success: true;
            };
            meta: object;
        }>;
    }>>;
    chat: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        sendMessage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                sessionId: string;
                content: string;
                skillId?: string | undefined;
                attachments?: {
                    url: string;
                    name: string;
                    mimeType: string;
                }[] | undefined;
            };
            output: {
                data: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    teamId: string | null;
                    status: string;
                    userId: string;
                    title: string | null;
                    messages: {
                        id: string;
                        createdAt: Date;
                        metadata: unknown;
                        role: string;
                        content: string | null;
                        toolCalls: unknown;
                        toolCallId: string | null;
                        sessionId: string;
                    }[];
                } | undefined;
                lastAssistantPreview: string;
            };
            meta: object;
        }>;
        generateTitle: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                sessionId: string;
            };
            output: {
                title: string;
            };
            meta: object;
        }>;
        editImage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                sessionId: string;
                imageUrl: string;
                prompt: string;
                generationId?: string | undefined;
                parentId?: string | undefined;
                maskDataUrl?: string | undefined;
                outputFormat?: "webp" | "png" | undefined;
                resolution?: "1 MP" | "2 MP" | undefined;
            };
            output: {
                imageUrl: any;
            };
            meta: object;
        }>;
    }>>;
    generate: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getGeneration: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                generationId: string;
            };
            output: {
                data: any;
            };
            meta: object;
        }>;
        listBySession: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                sessionId: string;
            };
            output: {
                data: any[];
            };
            meta: object;
        }>;
    }>>;
    skills: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                data: {
                    id: string;
                    category: string;
                    title: string;
                    description: string;
                }[];
            };
            meta: object;
        }>;
    }>>;
    imageEdits: import("@trpc/server").TRPCBuiltRouter<{
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
                    metadata: unknown;
                    userId: string;
                    sessionId: string;
                    prompt: string | null;
                    imageUrl: string;
                    generationId: string;
                    parentId: string | null;
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
                operationType?: "style" | "instruction" | "original" | "erase" | "background_swap" | "upscale" | "text_edit" | "variation" | undefined;
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
        styleTransfer: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                sessionId: string;
                generationId: string;
                imageUrl: string;
                style: "anime" | "cinematic" | "watercolor" | "oil_painting" | "pixel_art" | "neon" | "pencil_sketch" | "vintage";
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
    billing: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getTokenBalance: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
            };
            output: {
                tokens: number;
                hasSubscription: boolean;
                isAgency: boolean;
                unlimited: boolean;
            };
            meta: object;
        }>;
        listTokenActivity: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
                limit?: number | undefined;
            };
            output: {
                data: {
                    id: string;
                    createdAt: Date;
                    description: string | null;
                    balanceAfter: string;
                    operationType: string;
                    direction: string;
                    tokens: string;
                }[];
            };
            meta: object;
        }>;
        listPurchasePlans: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                displayCurrency?: string | undefined;
            };
            output: {
                data: Array<Record<string, unknown>>;
                productId?: undefined;
                productName?: undefined;
            } | {
                data: {
                    id: string;
                    name: string;
                    description: string | null;
                    zeepoPlanType: {};
                    tokenGrant: number;
                    billingCycle: string | null;
                    isPopular: boolean;
                    isRecommended: boolean;
                    isDefault: boolean;
                    highlights: unknown;
                    displayPrice: number;
                    displayCurrency: string;
                    priceUsd: number;
                    currencyUsd: string;
                }[];
                productId: string;
                productName: string;
            };
            meta: object;
        }>;
    }>>;
}>>;
