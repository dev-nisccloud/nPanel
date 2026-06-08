import type { Context } from "../context";
export declare const creativeAssetsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            teamId: string;
            name: string;
            description?: string | undefined;
            category?: string | undefined;
            status?: "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED" | undefined;
        };
        output: {
            id: string;
            teamId: string;
            name: string;
            description: string | null;
            category: string | null;
            status: string;
            currentInternalVersion: number | null;
            currentPublicVersion: number | null;
            isPublic: boolean;
            createdBy: string;
            lastModifiedBy: string;
            createdAt: Date;
            updatedAt: Date;
            team: {
                id: string;
                name: string;
                slug: string;
            };
        };
        meta: object;
    }>;
    uploadVersion: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            creativeAssetId: string;
            fileUrl: string;
            fileKey: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            fileMetadata?: Record<string, unknown> | undefined;
            versionNotes?: string | undefined;
            changesSummary?: string | undefined;
        };
        output: {
            id: string;
            creativeAssetId: string;
            internalVersionNumber: number;
            publicVersionNumber: number | null;
            isPublic: boolean;
            internalApprovalStatus: string;
            publicApprovalStatus: string;
            fileUrl: string;
            fileKey: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            versionNotes: string | null;
            changesSummary: string | null;
            previousVersionId: string | null;
            createdBy: string;
            internalApprovedBy: string | null;
            internalApprovedAt: Date | null;
            internalRejectedBy: string | null;
            internalRejectedAt: Date | null;
            internalRejectionReason: string | null;
            publicApprovedBy: string | null;
            publicApprovedAt: Date | null;
            publicRejectedBy: string | null;
            publicRejectedAt: Date | null;
            publicRejectionReason: string | null;
            madePublicBy: string | null;
            madePublicAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    approveVersionInternally: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            versionId: string;
        };
        output: {
            id: string;
            creativeAssetId: string;
            internalVersionNumber: number;
            publicVersionNumber: number | null;
            isPublic: boolean;
            internalApprovalStatus: string;
            publicApprovalStatus: string;
            fileUrl: string;
            fileKey: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            versionNotes: string | null;
            changesSummary: string | null;
            previousVersionId: string | null;
            createdBy: string;
            internalApprovedBy: string | null;
            internalApprovedAt: Date | null;
            internalRejectedBy: string | null;
            internalRejectedAt: Date | null;
            internalRejectionReason: string | null;
            publicApprovedBy: string | null;
            publicApprovedAt: Date | null;
            publicRejectedBy: string | null;
            publicRejectedAt: Date | null;
            publicRejectionReason: string | null;
            madePublicBy: string | null;
            madePublicAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    rejectVersionInternally: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            versionId: string;
            rejectionReason?: string | undefined;
        };
        output: {
            id: string;
            creativeAssetId: string;
            internalVersionNumber: number;
            publicVersionNumber: number | null;
            isPublic: boolean;
            internalApprovalStatus: string;
            publicApprovalStatus: string;
            fileUrl: string;
            fileKey: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            versionNotes: string | null;
            changesSummary: string | null;
            previousVersionId: string | null;
            createdBy: string;
            internalApprovedBy: string | null;
            internalApprovedAt: Date | null;
            internalRejectedBy: string | null;
            internalRejectedAt: Date | null;
            internalRejectionReason: string | null;
            publicApprovedBy: string | null;
            publicApprovedAt: Date | null;
            publicRejectedBy: string | null;
            publicRejectedAt: Date | null;
            publicRejectionReason: string | null;
            madePublicBy: string | null;
            madePublicAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    makeVersionPublic: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            versionId: string;
        };
        output: {
            id: string;
            creativeAssetId: string;
            internalVersionNumber: number;
            publicVersionNumber: number | null;
            isPublic: boolean;
            internalApprovalStatus: string;
            publicApprovalStatus: string;
            fileUrl: string;
            fileKey: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            versionNotes: string | null;
            changesSummary: string | null;
            previousVersionId: string | null;
            createdBy: string;
            internalApprovedBy: string | null;
            internalApprovedAt: Date | null;
            internalRejectedBy: string | null;
            internalRejectedAt: Date | null;
            internalRejectionReason: string | null;
            publicApprovedBy: string | null;
            publicApprovedAt: Date | null;
            publicRejectedBy: string | null;
            publicRejectedAt: Date | null;
            publicRejectionReason: string | null;
            madePublicBy: string | null;
            madePublicAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    approveVersionPublicly: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            versionId: string;
        };
        output: {
            id: string;
            creativeAssetId: string;
            internalVersionNumber: number;
            publicVersionNumber: number | null;
            isPublic: boolean;
            internalApprovalStatus: string;
            publicApprovalStatus: string;
            fileUrl: string;
            fileKey: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            versionNotes: string | null;
            changesSummary: string | null;
            previousVersionId: string | null;
            createdBy: string;
            internalApprovedBy: string | null;
            internalApprovedAt: Date | null;
            internalRejectedBy: string | null;
            internalRejectedAt: Date | null;
            internalRejectionReason: string | null;
            publicApprovedBy: string | null;
            publicApprovedAt: Date | null;
            publicRejectedBy: string | null;
            publicRejectedAt: Date | null;
            publicRejectionReason: string | null;
            madePublicBy: string | null;
            madePublicAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    rejectVersionPublicly: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            versionId: string;
            rejectionReason?: string | undefined;
        };
        output: {
            id: string;
            creativeAssetId: string;
            internalVersionNumber: number;
            publicVersionNumber: number | null;
            isPublic: boolean;
            internalApprovalStatus: string;
            publicApprovalStatus: string;
            fileUrl: string;
            fileKey: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            versionNotes: string | null;
            changesSummary: string | null;
            previousVersionId: string | null;
            createdBy: string;
            internalApprovedBy: string | null;
            internalApprovedAt: Date | null;
            internalRejectedBy: string | null;
            internalRejectedAt: Date | null;
            internalRejectionReason: string | null;
            publicApprovedBy: string | null;
            publicApprovedAt: Date | null;
            publicRejectedBy: string | null;
            publicRejectedAt: Date | null;
            publicRejectionReason: string | null;
            madePublicBy: string | null;
            madePublicAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    updateVersionStatus: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            versionId: string;
            status: "PENDING" | "NOT_APPLICABLE" | "APPROVED" | "REJECTED";
        };
        output: {
            id: string;
            creativeAssetId: string;
            internalVersionNumber: number;
            publicVersionNumber: number | null;
            isPublic: boolean;
            internalApprovalStatus: string;
            publicApprovalStatus: string;
            fileUrl: string;
            fileKey: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            versionNotes: string | null;
            changesSummary: string | null;
            previousVersionId: string | null;
            createdBy: string;
            internalApprovedBy: string | null;
            internalApprovedAt: Date | null;
            internalRejectedBy: string | null;
            internalRejectedAt: Date | null;
            internalRejectionReason: string | null;
            publicApprovedBy: string | null;
            publicApprovedAt: Date | null;
            publicRejectedBy: string | null;
            publicRejectedAt: Date | null;
            publicRejectionReason: string | null;
            madePublicBy: string | null;
            madePublicAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    makeVersionPrivate: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            versionId: string;
        };
        output: {
            id: string;
            creativeAssetId: string;
            internalVersionNumber: number;
            publicVersionNumber: number | null;
            isPublic: boolean;
            internalApprovalStatus: string;
            publicApprovalStatus: string;
            fileUrl: string;
            fileKey: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            versionNotes: string | null;
            changesSummary: string | null;
            previousVersionId: string | null;
            createdBy: string;
            internalApprovedBy: string | null;
            internalApprovedAt: Date | null;
            internalRejectedBy: string | null;
            internalRejectedAt: Date | null;
            internalRejectionReason: string | null;
            publicApprovedBy: string | null;
            publicApprovedAt: Date | null;
            publicRejectedBy: string | null;
            publicRejectedAt: Date | null;
            publicRejectionReason: string | null;
            madePublicBy: string | null;
            madePublicAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    getByTeam: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId: string;
        };
        output: {
            id: string;
            teamId: string;
            name: string;
            description: string | null;
            category: string | null;
            status: string;
            currentInternalVersion: number | null;
            currentPublicVersion: number | null;
            isPublic: boolean;
            createdBy: string;
            lastModifiedBy: string;
            createdAt: Date;
            updatedAt: Date;
            team: {
                id: string;
                name: string;
                slug: string;
            };
            versions?: {
                id: string;
                creativeAssetId: string;
                internalVersionNumber: number;
                publicVersionNumber: number | null;
                isPublic: boolean;
                internalApprovalStatus: string;
                publicApprovalStatus: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                versionNotes: string | null;
                changesSummary: string | null;
                previousVersionId: string | null;
                createdBy: string;
                internalApprovedBy: string | null;
                internalApprovedAt: Date | null;
                internalRejectedBy: string | null;
                internalRejectedAt: Date | null;
                internalRejectionReason: string | null;
                publicApprovedBy: string | null;
                publicApprovedAt: Date | null;
                publicRejectedBy: string | null;
                publicRejectedAt: Date | null;
                publicRejectionReason: string | null;
                madePublicBy: string | null;
                madePublicAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
            permissions?: {
                id: string;
                creativeAssetId: string;
                userId: string;
                canView: boolean;
                canEdit: boolean;
                canComment: boolean;
                canApprove: boolean;
                canPublish: boolean;
                canDelete: boolean;
                grantedBy: string;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
            _count?: {
                versions: number;
            } | undefined;
        }[];
        meta: object;
    }>;
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: string;
            teamId: string;
            name: string;
            description: string | null;
            category: string | null;
            status: string;
            currentInternalVersion: number | null;
            currentPublicVersion: number | null;
            isPublic: boolean;
            createdBy: string;
            lastModifiedBy: string;
            createdAt: Date;
            updatedAt: Date;
            team: {
                id: string;
                name: string;
                slug: string;
            };
            versions?: {
                id: string;
                creativeAssetId: string;
                internalVersionNumber: number;
                publicVersionNumber: number | null;
                isPublic: boolean;
                internalApprovalStatus: string;
                publicApprovalStatus: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                versionNotes: string | null;
                changesSummary: string | null;
                previousVersionId: string | null;
                createdBy: string;
                internalApprovedBy: string | null;
                internalApprovedAt: Date | null;
                internalRejectedBy: string | null;
                internalRejectedAt: Date | null;
                internalRejectionReason: string | null;
                publicApprovedBy: string | null;
                publicApprovedAt: Date | null;
                publicRejectedBy: string | null;
                publicRejectedAt: Date | null;
                publicRejectionReason: string | null;
                madePublicBy: string | null;
                madePublicAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
            permissions?: {
                id: string;
                creativeAssetId: string;
                userId: string;
                canView: boolean;
                canEdit: boolean;
                canComment: boolean;
                canApprove: boolean;
                canPublish: boolean;
                canDelete: boolean;
                grantedBy: string;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
            _count?: {
                versions: number;
            } | undefined;
        }[];
        meta: object;
    }>;
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            teamId: string;
            name: string;
            description: string | null;
            category: string | null;
            status: string;
            currentInternalVersion: number | null;
            currentPublicVersion: number | null;
            isPublic: boolean;
            createdBy: string;
            lastModifiedBy: string;
            createdAt: Date;
            updatedAt: Date;
            team: {
                id: string;
                name: string;
                slug: string;
                members?: {
                    userId: string;
                }[] | undefined;
            };
            versions?: {
                id: string;
                creativeAssetId: string;
                internalVersionNumber: number;
                publicVersionNumber: number | null;
                isPublic: boolean;
                internalApprovalStatus: string;
                publicApprovalStatus: string;
                fileUrl: string;
                fileKey: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                versionNotes: string | null;
                changesSummary: string | null;
                previousVersionId: string | null;
                createdBy: string;
                internalApprovedBy: string | null;
                internalApprovedAt: Date | null;
                internalRejectedBy: string | null;
                internalRejectedAt: Date | null;
                internalRejectionReason: string | null;
                publicApprovedBy: string | null;
                publicApprovedAt: Date | null;
                publicRejectedBy: string | null;
                publicRejectedAt: Date | null;
                publicRejectionReason: string | null;
                madePublicBy: string | null;
                madePublicAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
            permissions?: {
                id: string;
                creativeAssetId: string;
                userId: string;
                canView: boolean;
                canEdit: boolean;
                canComment: boolean;
                canApprove: boolean;
                canPublish: boolean;
                canDelete: boolean;
                grantedBy: string;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
        };
        meta: object;
    }>;
    addComment: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            versionId: string;
            content: string;
            isInternal: boolean;
            parentCommentId?: string | undefined;
            mentions?: string[] | undefined;
        };
        output: {
            id: string;
            creativeAssetVersionId: string;
            userId: string;
            content: string;
            isInternal: boolean;
            parentCommentId: string | null;
            mentions: string[];
            replyCount: number;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    getComments: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            versionId: string;
        };
        output: {
            id: string;
            creativeAssetVersionId: string;
            userId: string;
            content: string;
            isInternal: boolean;
            parentCommentId: string | null;
            mentions: string[];
            replyCount: number;
            createdAt: Date;
            updatedAt: Date;
            replies?: {
                id: string;
                creativeAssetVersionId: string;
                userId: string;
                content: string;
                isInternal: boolean;
                parentCommentId: string | null;
                mentions: string[];
                replyCount: number;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
        }[];
        meta: object;
    }>;
    updateComment: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            commentId: string;
            content: string;
        };
        output: {
            id: string;
            creativeAssetVersionId: string;
            userId: string;
            content: string;
            isInternal: boolean;
            parentCommentId: string | null;
            mentions: string[];
            replyCount: number;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    deleteComment: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            commentId: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    grantPermissions: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            creativeAssetId: string;
            userId: string;
            permissions: {
                canView?: boolean | undefined;
                canEdit?: boolean | undefined;
                canComment?: boolean | undefined;
                canApprove?: boolean | undefined;
                canPublish?: boolean | undefined;
                canDelete?: boolean | undefined;
            };
        };
        output: {
            id: string;
            creativeAssetId: string;
            userId: string;
            canView: boolean;
            canEdit: boolean;
            canComment: boolean;
            canApprove: boolean;
            canPublish: boolean;
            canDelete: boolean;
            grantedBy: string;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            name?: string | undefined;
            description?: string | undefined;
            category?: string | undefined;
            status?: "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED" | undefined;
            teamId?: string | undefined;
        };
        output: {
            id: string;
            teamId: string;
            name: string;
            description: string | null;
            category: string | null;
            status: string;
            currentInternalVersion: number | null;
            currentPublicVersion: number | null;
            isPublic: boolean;
            createdBy: string;
            lastModifiedBy: string;
            createdAt: Date;
            updatedAt: Date;
            team: {
                id: string;
                name: string;
                slug: string;
            };
        };
        meta: object;
    }>;
    archive: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            teamId: string;
            name: string;
            description: string | null;
            category: string | null;
            status: string;
            currentInternalVersion: number | null;
            currentPublicVersion: number | null;
            isPublic: boolean;
            createdBy: string;
            lastModifiedBy: string;
            createdAt: Date;
            updatedAt: Date;
            team: {
                id: string;
                name: string;
                slug: string;
            };
        };
        meta: object;
    }>;
    unarchive: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            teamId: string;
            name: string;
            description: string | null;
            category: string | null;
            status: string;
            currentInternalVersion: number | null;
            currentPublicVersion: number | null;
            isPublic: boolean;
            createdBy: string;
            lastModifiedBy: string;
            createdAt: Date;
            updatedAt: Date;
            team: {
                id: string;
                name: string;
                slug: string;
            };
        };
        meta: object;
    }>;
    /** Synchronous AI vision analysis (Replicate Claude Haiku); persists one row per run. Asset creator or super admin. */
    runAiImageAnalysis: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            creativeAssetVersionId: string;
            userContext?: string | undefined;
        };
        output: {
            analysisId: string;
            detail: {
                headline: string;
                modelLabel: string;
                overallRatingScaleMax: number;
                overallRatingValue: number;
                overallRatingReason: string;
                overallRatingBand: string | null;
                confidenceScore: number | null;
                ratingSummary: string;
                overallSummary: string;
                scores: {
                    id: string;
                    label: string;
                    value: number;
                    max: number;
                    note: string;
                }[];
                sections: {
                    title: string;
                    body: string;
                }[];
                recommendations: string[];
            };
        };
        meta: object;
    }>;
    /** History + latest payloads for AI analysis tab (same access as viewing the version comments). */
    listAiImageAnalyses: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            versionId: string;
        };
        output: {
            id: string;
            creativeAssetId: string;
            creativeAssetVersionId: string;
            status: string;
            model: string | null;
            summary: string | null;
            overallRatingScaleMax: number;
            overallRatingValue: number | null;
            overallRatingReason: string | null;
            overallRatingBand: string | null;
            confidenceScore: number | null;
            errorMessage: string | null;
            processingStartedAt: Date | null;
            createdAt: Date;
            completedAt: Date | null;
            userContext: string | null;
            detail: {
                headline: string;
                modelLabel: string;
                overallRatingScaleMax: number;
                overallRatingValue: number;
                overallRatingReason: string;
                overallRatingBand: string | null;
                confidenceScore: number | null;
                ratingSummary: string;
                overallSummary: string;
                scores: {
                    id: string;
                    label: string;
                    value: number;
                    max: number;
                    note: string;
                }[];
                sections: {
                    title: string;
                    body: string;
                }[];
                recommendations: string[];
            } | null;
        }[];
        meta: object;
    }>;
}>>;
