export declare const niscEmailBuilderRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    design: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                teamId?: string | undefined;
                brandKitId?: string | undefined;
            };
            output: {
                id: `${string}-${string}-${string}-${string}-${string}`;
                sessionId: `${string}-${string}-${string}-${string}-${string}`;
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
                    isPublic: boolean;
                    description: string | null;
                    id: string;
                    name: string;
                    thumbnailUrl: string | null;
                    workflowPhase: string;
                    updatedAt: Date;
                    createdAt: Date;
                    userId: string;
                    teamId: string | null;
                }[];
                nextPage: number | null;
            };
            meta: object;
        }>;
        get: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                designId: string;
            };
            output: {
                id: string;
                name: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                metadata: unknown;
                thumbnailUrl: string | null;
                saveStatus: string;
                lastSaveError: string | null;
                aiStatus: string;
                clientVersion: number;
                lastSavedAt: Date | null;
                subject: string | null;
                preheader: string | null;
                htmlContent: string;
                textContent: string | null;
                brandKitId: string | null;
                brief: unknown;
                creativeDesignUrl: string | null;
                creativeDesignPrompt: string | null;
                designPlan: unknown;
                currentVersionId: string | null;
                workflowPhase: string;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    teamId: string | null;
                    designId: string;
                    messages: {
                        id: string;
                        role: string;
                        createdAt: Date;
                        metadata: unknown;
                        sessionId: string;
                        content: string;
                    }[];
                } | null;
                versions: {
                    id: string;
                    createdAt: Date;
                    designId: string;
                    htmlContent: string;
                    textContent: string | null;
                    versionNumber: number;
                    changeSummary: string | null;
                    trigger: string;
                    messageId: string | null;
                    validationReport: unknown;
                }[];
            };
            meta: object;
        }>;
        updateMeta: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                designId: string;
                name?: string | undefined;
                subject?: string | undefined;
                preheader?: string | undefined;
                brandKitId?: string | null | undefined;
            };
            output: {
                success: boolean;
            };
            meta: object;
        }>;
        delete: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                designId?: string | undefined;
                id?: string | undefined;
            };
            output: {
                data: {
                    id: string;
                };
            };
            meta: object;
        }>;
        duplicate: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                designId?: string | undefined;
                id?: string | undefined;
            };
            output: {
                data: {
                    id: string;
                    name: string;
                    status: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    teamId: string | null;
                    metadata: unknown;
                    thumbnailUrl: string | null;
                    saveStatus: string;
                    lastSaveError: string | null;
                    aiStatus: string;
                    clientVersion: number;
                    lastSavedAt: Date | null;
                    subject: string | null;
                    preheader: string | null;
                    htmlContent: string;
                    textContent: string | null;
                    brandKitId: string | null;
                    brief: unknown;
                    creativeDesignUrl: string | null;
                    creativeDesignPrompt: string | null;
                    designPlan: unknown;
                    currentVersionId: string | null;
                    workflowPhase: string;
                };
            };
            meta: object;
        }>;
        saveHtmlContent: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                designId: string;
                html: string;
                clientVersion?: number | undefined;
            };
            output: {
                success: boolean;
                data: {
                    id: string;
                    name: string;
                    userId: string;
                    teamId: string | null;
                    status: string;
                    subject: string | null;
                    preheader: string | null;
                    htmlContent: string;
                    textContent: string | null;
                    thumbnailUrl: string | null;
                    brandKitId: string | null;
                    brief: unknown;
                    metadata: unknown;
                    creativeDesignUrl: string | null;
                    creativeDesignPrompt: string | null;
                    designPlan: unknown;
                    currentVersionId: string | null;
                    workflowPhase: string;
                    aiStatus: string;
                    saveStatus: string;
                    lastSaveError: string | null;
                    clientVersion: number;
                    lastSavedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
                version: number;
            };
            meta: object;
        }>;
        saveHtml: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                designId: string;
                html: string;
                changeSummary?: string | undefined;
                inPlace?: boolean | undefined;
                clientVersion?: number | undefined;
            };
            output: {
                success: boolean;
                skipped: boolean;
                versionId: string | null;
                htmlContent: string;
                warnings: string[];
            };
            meta: object;
        }>;
        exportHtml: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                designId: string;
            };
            output: {
                html: string;
                text: string | null;
                subject: string | null;
                preheader: string | null;
            };
            meta: object;
        }>;
        restoreVersion: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                designId: string;
                versionId: string;
            };
            output: {
                success: boolean;
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
        startBuild: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                designId: string;
                brief: {
                    companyName?: string | undefined;
                    productName?: string | undefined;
                    audience?: string | undefined;
                    goal?: string | undefined;
                    tone?: string | undefined;
                    emailType?: string | undefined;
                    instructions?: string | undefined;
                    brandColors?: string[] | undefined;
                    ctaUrl?: string | undefined;
                    websiteUrl?: string | undefined;
                    logoUrl?: string | undefined;
                    companyContext?: string | undefined;
                    webSearchFound?: boolean | undefined;
                };
            };
            output: {
                jobId: `${string}-${string}-${string}-${string}-${string}`;
                brandPreview: {
                    logoUrl: string | null;
                    brandColors: string[];
                    companyContext: string | null;
                    webSearchFound: boolean;
                    warnings: string[];
                } | null;
            };
            meta: object;
        }>;
        approveBuild: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                designId: string;
            };
            output: {
                jobId: `${string}-${string}-${string}-${string}-${string}`;
            };
            meta: object;
        }>;
        retryHtmlBuild: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                designId: string;
            };
            output: {
                jobId: `${string}-${string}-${string}-${string}-${string}`;
            };
            meta: object;
        }>;
        sendMessage: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                designId: string;
                message: string;
                currentHtml?: string | undefined;
                intent?: "edit" | "full_revamp" | undefined;
            };
            output: {
                jobId: null;
                refused: true;
                intent?: undefined;
            } | {
                jobId: `${string}-${string}-${string}-${string}-${string}`;
                intent: "edit" | "full_revamp";
                refused?: undefined;
            };
            meta: object;
        }>;
        getRevisionUndoState: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                designId: string;
            };
            output: {
                available: boolean;
                canUndo: boolean;
                canRedo: boolean;
            };
            meta: object;
        }>;
        undoAiRevision: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                designId: string;
            };
            output: {
                html: string;
                success: boolean;
            };
            meta: object;
        }>;
        redoAiRevision: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                designId: string;
            };
            output: {
                html: string;
                success: boolean;
            };
            meta: object;
        }>;
        generateVariation: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                designId: string;
            };
            output: {
                jobId: `${string}-${string}-${string}-${string}-${string}`;
            };
            meta: object;
        }>;
        selectVariation: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                designId: string;
                variationId: string;
            };
            output: {
                url: string;
            };
            meta: object;
        }>;
        jobStatus: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                designId: string;
            };
            output: {
                aiStatus: string;
                workflowPhase: string;
                creativeDesignUrl: string | null;
                job: {
                    id: string;
                    type: string;
                    status: string;
                    errorMessage: string | null;
                } | null;
            };
            meta: object;
        }>;
    }>>;
    brandKit: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                teamId?: string | undefined;
            };
            output: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                teamId: string | null;
                logoAssetId: string | null;
                colors: unknown;
                fonts: unknown;
                footerLegal: string | null;
                socialLinks: unknown;
            }[];
            meta: object;
        }>;
        create: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
                teamId?: string | undefined;
                colors?: Record<string, string> | undefined;
                footerLegal?: string | undefined;
                logoAssetId?: string | undefined;
            };
            output: {
                id: `${string}-${string}-${string}-${string}-${string}`;
            };
            meta: object;
        }>;
    }>>;
    brand: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        previewFromWebsite: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                websiteUrl: string;
                companyHint?: string | undefined;
            };
            output: import("../../lib/nisc-email-builder/website-brand-extract").WebsiteBrandEnrichment;
            meta: object;
        }>;
    }>>;
    mediaLibrary: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        createFromUpload: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileUrl: string;
                storageKey?: string | undefined;
                description?: string | undefined;
                metadata?: unknown;
                teamId?: string | undefined;
            };
            output: {
                data: {
                    id: string;
                    userId: string;
                    teamId: string | null;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileUrl: string;
                    storageKey: string | null;
                    description: string | null;
                    metadata: unknown;
                    createdAt: Date;
                };
            };
            meta: object;
        }>;
        list: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                page?: number | undefined;
                limit?: number | undefined;
                teamId?: string | undefined;
                onlyImages?: boolean | undefined;
                search?: string | undefined;
            };
            output: {
                data: {
                    id: string;
                    userId: string;
                    teamId: string | null;
                    fileName: string;
                    fileSize: number;
                    mimeType: string;
                    fileUrl: string;
                    storageKey: string | null;
                    description: string | null;
                    metadata: unknown;
                    createdAt: Date;
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
                success: boolean;
            };
            meta: object;
        }>;
    }>>;
}>>;
