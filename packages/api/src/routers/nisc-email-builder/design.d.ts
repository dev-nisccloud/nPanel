export declare const nebDesignRouter: import("@trpc/server").TRPCBuiltRouter<{
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
