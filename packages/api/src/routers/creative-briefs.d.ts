export declare const creativeBriefsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: string;
            name: string;
            userId: string;
            teamId: string | null;
            status: "DRAFT" | "APPROVED" | "REJECTED" | "REVIEWING";
            background: string;
            objectives: string;
            requirements: string;
            comments: string | null;
            style: string | null;
            copy: string | null;
            mandatoryElements: string | null;
            designPreference: string | null;
            approverUserId: string | null;
            approvedBy: string | null;
            approvedAt: Date | null;
            rejectedBy: string | null;
            rejectedAt: Date | null;
            timelineStartDate: Date | null;
            timelineEndDate: Date | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
            approver?: {
                id: string;
                name: string;
                email: string;
            } | null | undefined;
            referenceImages?: {
                id: string;
                creativeBriefId: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileMetadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
        }[];
        meta: object;
    }>;
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            name: string;
            userId: string;
            teamId: string | null;
            status: "DRAFT" | "APPROVED" | "REJECTED" | "REVIEWING";
            background: string;
            objectives: string;
            requirements: string;
            comments: string | null;
            style: string | null;
            copy: string | null;
            mandatoryElements: string | null;
            designPreference: string | null;
            approverUserId: string | null;
            approvedBy: string | null;
            approvedAt: Date | null;
            rejectedBy: string | null;
            rejectedAt: Date | null;
            timelineStartDate: Date | null;
            timelineEndDate: Date | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
            approver?: {
                id: string;
                name: string;
                email: string;
            } | null | undefined;
            referenceImages?: {
                id: string;
                creativeBriefId: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileMetadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
        };
        meta: object;
    }>;
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            background: string;
            objectives: string;
            requirements: string;
            timelineStartDate: unknown;
            timelineEndDate: unknown;
            teamId?: string | undefined;
            approverUserId?: string | undefined;
            comments?: string | undefined;
            style?: string | undefined;
            copy?: string | undefined;
            mandatoryElements?: string | undefined;
            designPreference?: string | undefined;
            referenceImages?: {
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileMetadata?: unknown;
            }[] | undefined;
        };
        output: {
            id: string;
            name: string;
            userId: string;
            teamId: string | null;
            status: "DRAFT" | "APPROVED" | "REJECTED" | "REVIEWING";
            background: string;
            objectives: string;
            requirements: string;
            comments: string | null;
            style: string | null;
            copy: string | null;
            mandatoryElements: string | null;
            designPreference: string | null;
            approverUserId: string | null;
            approvedBy: string | null;
            approvedAt: Date | null;
            rejectedBy: string | null;
            rejectedAt: Date | null;
            timelineStartDate: Date | null;
            timelineEndDate: Date | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
            approver?: {
                id: string;
                name: string;
                email: string;
            } | null | undefined;
            referenceImages?: {
                id: string;
                creativeBriefId: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileMetadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
        };
        meta: object;
    }>;
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            timelineStartDate: unknown;
            timelineEndDate: unknown;
            name?: string | undefined;
            teamId?: string | undefined;
            background?: string | undefined;
            objectives?: string | undefined;
            requirements?: string | undefined;
            comments?: string | undefined;
            style?: string | undefined;
            copy?: string | undefined;
            mandatoryElements?: string | undefined;
            designPreference?: string | undefined;
            referenceImages?: {
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileMetadata?: unknown;
            }[] | undefined;
        };
        output: {
            id: string;
            name: string;
            userId: string;
            teamId: string | null;
            status: "DRAFT" | "APPROVED" | "REJECTED" | "REVIEWING";
            background: string;
            objectives: string;
            requirements: string;
            comments: string | null;
            style: string | null;
            copy: string | null;
            mandatoryElements: string | null;
            designPreference: string | null;
            approverUserId: string | null;
            approvedBy: string | null;
            approvedAt: Date | null;
            rejectedBy: string | null;
            rejectedAt: Date | null;
            timelineStartDate: Date | null;
            timelineEndDate: Date | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
            approver?: {
                id: string;
                name: string;
                email: string;
            } | null | undefined;
            referenceImages?: {
                id: string;
                creativeBriefId: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileMetadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
        };
        meta: object;
    }>;
    updateStatus: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            status: "DRAFT" | "APPROVED" | "REJECTED" | "REVIEWING";
            comment?: string | undefined;
        };
        output: {
            id: string;
            name: string;
            userId: string;
            teamId: string | null;
            status: "DRAFT" | "APPROVED" | "REJECTED" | "REVIEWING";
            background: string;
            objectives: string;
            requirements: string;
            comments: string | null;
            style: string | null;
            copy: string | null;
            mandatoryElements: string | null;
            designPreference: string | null;
            approverUserId: string | null;
            approvedBy: string | null;
            approvedAt: Date | null;
            rejectedBy: string | null;
            rejectedAt: Date | null;
            timelineStartDate: Date | null;
            timelineEndDate: Date | null;
            createdAt: Date;
            updatedAt: Date;
            user?: {
                id: string;
                name: string;
                email: string;
            } | undefined;
            team?: {
                id: string;
                name: string;
                slug: string;
            } | null | undefined;
            approver?: {
                id: string;
                name: string;
                email: string;
            } | null | undefined;
            referenceImages?: {
                id: string;
                creativeBriefId: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                fileMetadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
        };
        meta: object;
    }>;
    listUsersForApprover: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: string;
            name: string;
            email: string;
        }[];
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
