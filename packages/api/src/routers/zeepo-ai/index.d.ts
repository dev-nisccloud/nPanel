export declare const zeepoAiRouter: import("@trpc/server").TRPCBuiltRouter<{
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
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                metadata: unknown;
                title: string | null;
            } | undefined;
            meta: object;
        }>;
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                page?: number | undefined;
                limit?: number | undefined;
                teamId?: string | undefined;
            };
            output: {
                sessions: {
                    id: string;
                    status: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    teamId: string | null;
                    metadata: unknown;
                    title: string | null;
                }[];
                page: number;
                limit: number;
                total: number;
            };
            meta: object;
        }>;
        listLibrary: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                page?: number | undefined;
                limit?: number | undefined;
                teamId?: string | undefined;
                kind?: "image" | "all" | "document" | "presentation" | undefined;
            };
            output: {
                items: {
                    sessionTitle: string;
                    isEditHistory: boolean;
                    id: string;
                    status: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    teamId: string | null;
                    metadata: unknown;
                    completedAt: Date | null;
                    qstashMessageId: string | null;
                    startedAt: Date | null;
                    sessionId: string;
                    messageId: string | null;
                    errorMessage: string | null;
                    kind: string;
                    provider: string;
                    modelId: string;
                    providerRequestId: string | null;
                    parentGenerationId: string | null;
                    tokensDebited: string | null;
                    providerCostUsdMicros: number | null;
                    prompt: string | null;
                    inputs: unknown;
                    outputs: unknown;
                }[];
                page: number;
                limit: number;
                total: number;
            } | {
                items: ({
                    sessionTitle: string;
                    isEditHistory: false;
                    id: string;
                    status: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    teamId: string | null;
                    metadata: unknown;
                    completedAt: Date | null;
                    qstashMessageId: string | null;
                    startedAt: Date | null;
                    sessionId: string;
                    messageId: string | null;
                    errorMessage: string | null;
                    kind: string;
                    provider: string;
                    modelId: string;
                    providerRequestId: string | null;
                    parentGenerationId: string | null;
                    tokensDebited: string | null;
                    providerCostUsdMicros: number | null;
                    prompt: string | null;
                    inputs: unknown;
                    outputs: unknown;
                } | {
                    id: string;
                    sessionId: string;
                    userId: string;
                    teamId: string | null;
                    messageId: string | null;
                    kind: "image";
                    provider: string;
                    status: "COMPLETED";
                    progress: null;
                    errorMessage: null;
                    url: string;
                    thumbnailUrl: null;
                    title: string;
                    description: string | null;
                    prompt: string | null;
                    outputs: {
                        imageUrl: string;
                    };
                    metadata: {
                        operationType: string;
                        parentGenerationId: string;
                        isEditHistory: boolean;
                    };
                    tokensDebited: string | null;
                    providerCostUsdMicros: number | null;
                    modelId: string | null;
                    providerRequestId: string | null;
                    parentGenerationId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    sessionTitle: string;
                    isEditHistory: true;
                })[];
                page: number;
                limit: number;
                total: number;
            };
            meta: object;
        }>;
        openSupportTicket: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                sessionId: string;
                phone?: string | null | undefined;
                intent?: "support" | "sales" | undefined;
            };
            output: {
                _tool: "create_support_ticket";
                ok: true;
                alreadyOpen: boolean;
                ticketId: string;
                ticketNumber: string;
                intent: import("../../lib/create-ai-support-ticket").AiSupportTicketIntent;
                subject: string;
            };
            meta: object;
        }>;
        get: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                id: string;
            };
            output: {
                session: {
                    id: string;
                    status: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    teamId: string | null;
                    metadata: unknown;
                    title: string | null;
                };
                messages: {
                    id: string;
                    role: string;
                    status: string;
                    createdAt: Date;
                    metadata: unknown;
                    sessionId: string;
                    content: string | null;
                    reasoning: string | null;
                    toolCalls: unknown;
                    toolCallId: string | null;
                    inputTokens: number | null;
                    outputTokens: number | null;
                    cacheReadTokens: number | null;
                    cacheWriteTokens: number | null;
                }[];
                generations: {
                    id: string;
                    status: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    teamId: string | null;
                    metadata: unknown;
                    completedAt: Date | null;
                    qstashMessageId: string | null;
                    startedAt: Date | null;
                    sessionId: string;
                    messageId: string | null;
                    errorMessage: string | null;
                    kind: string;
                    provider: string;
                    modelId: string;
                    providerRequestId: string | null;
                    parentGenerationId: string | null;
                    tokensDebited: string | null;
                    providerCostUsdMicros: number | null;
                    prompt: string | null;
                    inputs: unknown;
                    outputs: unknown;
                }[];
                attachments: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    userId: string;
                    metadata: unknown;
                    sessionId: string;
                    messageId: string | null;
                    url: string;
                    storageKey: string | null;
                    mimeType: string;
                    sizeBytes: number | null;
                }[];
                toolInvocations: {
                    id: string;
                    status: string;
                    createdAt: Date;
                    messageId: string | null;
                    toolName: string;
                    result: unknown;
                }[];
            };
            meta: object;
        }>;
        updateTitle: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                title: string;
            };
            output: {
                id: string;
                title: string;
            };
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
            };
            output: {
                ok: boolean;
            };
            meta: object;
        }>;
        checkWelcomeEligibility: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId?: string | undefined;
            };
            output: {
                eligible: boolean;
                reason?: string;
                tokensIfGranted: number;
            };
            meta: object;
        }>;
        claimWelcomeGrant: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                teamId: string;
            };
            output: import("../../lib/zeepo-ai-free-token-grant").FreeTokenGrantResult;
            meta: object;
        }>;
    }>>;
    messages: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        feedback: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                messageId: string;
                feedback: "like" | "dislike" | "clear";
            };
            output: {
                ok: boolean;
                feedback: "like" | "dislike" | null;
            };
            meta: object;
        }>;
        registerAttachment: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                sessionId: string;
                url: string;
                name: string;
                mimeType: string;
                storageKey?: string | undefined;
                sizeBytes?: number | undefined;
            };
            output: {
                id: `${string}-${string}-${string}-${string}-${string}`;
                url: string;
                name: string;
                mimeType: string;
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
                id: string;
                category: string;
                title: string;
                description: string;
                available: boolean;
                starterPrompt: string | null;
            }[];
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
                teamId?: string | undefined;
            };
            output: {
                unlimited: boolean;
                tokens: number | null;
                hasSubscription: boolean;
                isAgency: boolean;
                walletInitialized: boolean;
                hasQualifyingService: boolean;
                welcomeEligible: boolean;
                welcomeTokenGrant: any;
                subscriptionId?: undefined;
            } | {
                unlimited: boolean;
                tokens: number;
                hasSubscription: boolean;
                subscriptionId: string | null;
                isAgency: boolean;
                walletInitialized: boolean;
                hasQualifyingService: boolean;
                welcomeEligible: boolean;
                welcomeTokenGrant: any;
            };
            meta: object;
        }>;
        listTokenActivity: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId: string;
                limit?: number | undefined;
            };
            output: {
                id: string;
                createdAt: Date;
                description: string | null;
                modelId: string | null;
                operationType: string;
                direction: string;
                tokens: string;
                balanceAfter: string;
            }[];
            meta: object;
        }>;
        listUsageActivity: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                from: unknown;
                to: unknown;
                page?: number | undefined;
                limit?: number | undefined;
                provider?: "google" | "anthropic" | "all" | undefined;
                eventType?: "generation" | "other" | "all" | "chat_turn" | "image_edit" | undefined;
                status?: "failed" | "succeeded" | "partial" | "all" | "cancelled" | undefined;
                teamId?: string | undefined;
                groupBy?: "user" | "team" | undefined;
                surface?: "all" | "support_fab" | "zeepo_ai" | undefined;
            };
            output: {
                groupBy: "user" | "team";
                items: {
                    groupBy: "user";
                    userId: string;
                    userName: string | null;
                    userEmail: string | null;
                    teamId: string | null;
                    teamName: string | null;
                    teamSlug: string | null;
                    events: number;
                    inputTokens: number;
                    outputTokens: number;
                    providerCostUsd: number;
                    tokensDebited: number;
                    failed: number;
                    teamsTouched: number;
                    usersTouched: number;
                    lastAt: Date;
                }[] | {
                    groupBy: "team";
                    userId: string | null;
                    userName: string | null;
                    userEmail: string | null;
                    teamId: string | null;
                    teamName: string;
                    teamSlug: string | null;
                    events: number;
                    inputTokens: number;
                    outputTokens: number;
                    providerCostUsd: number;
                    tokensDebited: number;
                    failed: number;
                    teamsTouched: number;
                    usersTouched: number;
                    lastAt: Date;
                }[];
                page: number;
                limit: number;
                total: number;
                summary: {
                    events: number;
                    inputTokens: number;
                    outputTokens: number;
                    providerCostUsd: number;
                    tokensDebited: number;
                    failed: number;
                    avgLatencyMs: number;
                    liveAiSupport: {
                        events: number;
                        providerCostUsd: number;
                        inputTokens: number;
                        outputTokens: number;
                    };
                    zeepoAi: {
                        events: number;
                        providerCostUsd: number;
                        inputTokens: number;
                        outputTokens: number;
                    };
                };
                byProvider: {
                    provider: string;
                    events: number;
                    providerCostUsd: number;
                    inputTokens: number;
                    outputTokens: number;
                }[];
                byEventType: {
                    eventType: string;
                    events: number;
                    providerCostUsd: number;
                }[];
                byModel: {
                    modelId: string;
                    provider: string;
                    events: number;
                    providerCostUsd: number;
                }[];
            };
            meta: object;
        }>;
        listPaygPacks: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                currency: string | null;
                metadata: unknown;
                description: string | null;
                sortOrder: number;
                highlights: unknown;
                productId: string;
                pricingModel: string;
                billingCycle: string | null;
                price: string | null;
                setupFee: string | null;
                cost: string | null;
                costCurrency: string | null;
                commissionRate: string | null;
                commissionBase: string | null;
                commissionBaseDescription: string | null;
                planFeatures: unknown;
                isPopular: boolean;
                isRecommended: boolean;
                isDefault: boolean;
                pleskServicePlanId: string | null;
                pleskFilterId: string | null;
                pleskIpAddress: string | null;
                hostingType: string | null;
            }[];
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
                    zeepoPlanType: string;
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
                productId: any;
                productName: string;
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
    cloudPlans: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                kind: "vps" | "vds" | "dedicated";
                search?: string | undefined;
                limit?: number | undefined;
                cursor?: number | undefined;
                ramGb?: number | undefined;
                cores?: number | undefined;
                cpu?: "intel" | "amd" | undefined;
                diskGb?: number | undefined;
                location?: string | undefined;
            };
            output: import("../../lib/agent-internal-tools").CloudPlansResult;
            meta: object;
        }>;
    }>>;
}>>;
export { streamZeepoAiTurn } from "./stream-turn";
export { streamTurnBodySchema } from "./schemas";
export type { ZeepoAiStreamEvent } from "./stream-turn";
