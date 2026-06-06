export declare const nebChatRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /** Step 1: generate Nano Banana creative mockup */
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
    /** Step 2: user approved mockup → build HTML + hydrate images */
    approveBuild: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            designId: string;
        };
        output: {
            jobId: `${string}-${string}-${string}-${string}-${string}`;
        };
        meta: object;
    }>;
    /** Regenerate HTML from the approved creative mockup (new build variation). */
    retryHtmlBuild: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            designId: string;
        };
        output: {
            jobId: `${string}-${string}-${string}-${string}-${string}`;
        };
        meta: object;
    }>;
    /** Zeepo-style chat - routes by workflow phase */
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
    /** Generate another design variation - reuses stored brief + webContext */
    generateVariation: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            designId: string;
        };
        output: {
            jobId: `${string}-${string}-${string}-${string}-${string}`;
        };
        meta: object;
    }>;
    /** Select which variation to use for building the HTML email */
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
