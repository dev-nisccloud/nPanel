import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, inArray, isNull, sql } from "@npanel/db";
import Replicate from "replicate";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { creativeAsset, creativeAssetActivityLog, creativeAssetAiAnalysis, creativeAssetComment, creativeAssetPermission, creativeAssetVersion, creativeAssetVersionActivityLog, } from "@npanel/db/schema/creative-assets";
import { team, teamMember } from "@npanel/db/schema/teams";
import { env } from "@npanel/env/server";
import { CREATIVE_ASSET_IMAGE_ANALYSIS_MODEL, invokeCreativeAssetImageAnalysis } from "../lib/creative-asset-image-analysis-ai";
import { protectedProcedure, router } from "../trpc";
// ============================================================================
// ZOD SCHEMAS - Independent from database schema (no shared types)
// ============================================================================
// Response schemas
const creativeAssetVersionSchema = z.object({
    id: z.string(),
    creativeAssetId: z.string(),
    internalVersionNumber: z.number(),
    publicVersionNumber: z.number().nullable(),
    isPublic: z.boolean(),
    internalApprovalStatus: z.string(),
    publicApprovalStatus: z.string(),
    fileUrl: z.string(),
    fileKey: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    versionNotes: z.string().nullable(),
    changesSummary: z.string().nullable(),
    previousVersionId: z.string().nullable(),
    createdBy: z.string(),
    internalApprovedBy: z.string().nullable(),
    internalApprovedAt: z.date().nullable(),
    internalRejectedBy: z.string().nullable(),
    internalRejectedAt: z.date().nullable(),
    internalRejectionReason: z.string().nullable(),
    publicApprovedBy: z.string().nullable(),
    publicApprovedAt: z.date().nullable(),
    publicRejectedBy: z.string().nullable(),
    publicRejectedAt: z.date().nullable(),
    publicRejectionReason: z.string().nullable(),
    madePublicBy: z.string().nullable(),
    madePublicAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
const creativeAssetPermissionSchema = z.object({
    id: z.string(),
    creativeAssetId: z.string(),
    userId: z.string(),
    canView: z.boolean(),
    canEdit: z.boolean(),
    canComment: z.boolean(),
    canApprove: z.boolean(),
    canPublish: z.boolean(),
    canDelete: z.boolean(),
    grantedBy: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
const creativeAssetSchema = z.object({
    id: z.string(),
    teamId: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    category: z.string().nullable(),
    status: z.string(),
    currentInternalVersion: z.number().nullable(),
    currentPublicVersion: z.number().nullable(),
    isPublic: z.boolean(),
    createdBy: z.string(),
    lastModifiedBy: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    team: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
    }),
});
const commentSchema = z.object({
    id: z.string(),
    creativeAssetVersionId: z.string(),
    userId: z.string(),
    content: z.string(),
    isInternal: z.boolean(),
    parentCommentId: z.string().nullable(),
    mentions: z.array(z.string()),
    replyCount: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
const creativeAssetAiDetailSchema = z.object({
    headline: z.string(),
    modelLabel: z.string(),
    overallRatingScaleMax: z.number(),
    overallRatingValue: z.number(),
    overallRatingReason: z.string(),
    overallRatingBand: z.string().nullable(),
    confidenceScore: z.number().nullable(),
    ratingSummary: z.string(),
    overallSummary: z.string(),
    scores: z.array(z.object({
        id: z.string(),
        label: z.string(),
        value: z.number(),
        max: z.number(),
        note: z.string(),
    })),
    sections: z.array(z.object({ title: z.string(), body: z.string() })),
    recommendations: z.array(z.string()),
});
const creativeAssetAiAnalysisListItemSchema = z.object({
    id: z.string(),
    creativeAssetId: z.string(),
    creativeAssetVersionId: z.string(),
    status: z.string(),
    model: z.string().nullable(),
    summary: z.string().nullable(),
    overallRatingScaleMax: z.number(),
    overallRatingValue: z.number().nullable(),
    overallRatingReason: z.string().nullable(),
    overallRatingBand: z.string().nullable(),
    confidenceScore: z.number().nullable(),
    errorMessage: z.string().nullable(),
    processingStartedAt: z.date().nullable(),
    createdAt: z.date(),
    completedAt: z.date().nullable(),
    userContext: z.string().nullable(),
    detail: creativeAssetAiDetailSchema.nullable(),
});
const runCreativeAssetAiImageAnalysisOutputSchema = z.object({
    analysisId: z.string(),
    detail: creativeAssetAiDetailSchema,
});
// ============================================================================
// Helper Functions
// ============================================================================
// Transform functions to ensure clean data (no Prisma types leak)
// These convert Prisma enum types to plain strings for API layer
function transformVersion(version) {
    return {
        id: version.id,
        creativeAssetId: version.creativeAssetId,
        internalVersionNumber: version.internalVersionNumber,
        publicVersionNumber: version.publicVersionNumber,
        isPublic: version.isPublic,
        internalApprovalStatus: version.internalApprovalStatus,
        publicApprovalStatus: version.publicApprovalStatus,
        fileUrl: version.fileUrl,
        fileKey: version.fileKey,
        fileName: version.fileName,
        fileSize: version.fileSize,
        mimeType: version.mimeType,
        fileMetadata: version.fileMetadata ?? null,
        versionNotes: version.versionNotes,
        changesSummary: version.changesSummary,
        previousVersionId: version.previousVersionId,
        createdBy: version.createdBy,
        internalApprovedBy: version.internalApprovedBy,
        internalApprovedAt: version.internalApprovedAt,
        internalRejectedBy: version.internalRejectedBy,
        internalRejectedAt: version.internalRejectedAt,
        internalRejectionReason: version.internalRejectionReason,
        publicApprovedBy: version.publicApprovedBy,
        publicApprovedAt: version.publicApprovedAt,
        publicRejectedBy: version.publicRejectedBy,
        publicRejectedAt: version.publicRejectedAt,
        publicRejectionReason: version.publicRejectionReason,
        madePublicBy: version.madePublicBy,
        madePublicAt: version.madePublicAt,
        createdAt: version.createdAt,
        updatedAt: version.updatedAt,
    };
}
function transformAsset(asset) {
    const result = {
        id: asset.id,
        teamId: asset.teamId,
        name: asset.name,
        description: asset.description,
        category: asset.category,
        status: asset.status, // Convert enum to string
        currentInternalVersion: asset.currentInternalVersion,
        currentPublicVersion: asset.currentPublicVersion,
        isPublic: asset.isPublic,
        createdBy: asset.createdBy,
        lastModifiedBy: asset.lastModifiedBy,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
        team: {
            id: asset.team.id,
            name: asset.team.name,
            slug: asset.team.slug,
        },
    };
    if (asset.versions !== undefined) {
        result.versions = asset.versions.map(transformVersion);
    }
    if (asset.permissions !== undefined) {
        result.permissions = asset.permissions;
    }
    if (asset._count !== undefined) {
        result._count = asset._count;
    }
    return result;
}
function transformComment(comment) {
    return {
        id: comment.id,
        creativeAssetVersionId: comment.creativeAssetVersionId,
        userId: comment.userId,
        content: comment.content,
        isInternal: comment.isInternal,
        parentCommentId: comment.parentCommentId,
        mentions: Array.isArray(comment.mentions)
            ? comment.mentions
            : [],
        replyCount: comment.replyCount || 0,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        replies: comment.replies ? comment.replies.map(transformComment) : undefined,
    };
}
function coerceDecimalLikeToNumber(val) {
    if (val == null)
        return null;
    if (typeof val === "number")
        return Number.isFinite(val) ? val : null;
    const n = Number.parseFloat(String(val));
    return Number.isFinite(n) ? n : null;
}
function coerceDetailFromResultJson(row) {
    if (row.status !== "COMPLETED" || row.result == null || typeof row.result !== "object")
        return null;
    const raw = row.result;
    const { userContext: _ctx, ...detailPayload } = raw;
    const parsed = creativeAssetAiDetailSchema.safeParse(detailPayload);
    return parsed.success ? parsed.data : null;
}
function extractUserContextFromResult(row) {
    if (row.result == null || typeof row.result !== "object")
        return null;
    const raw = row.result.userContext;
    if (typeof raw !== "string")
        return null;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function mapCreativeAiAnalysisRow(row) {
    const detail = coerceDetailFromResultJson(row);
    return {
        id: row.id,
        creativeAssetId: row.creativeAssetId,
        creativeAssetVersionId: row.creativeAssetVersionId,
        status: row.status,
        model: row.model ?? null,
        summary: row.summary ?? null,
        overallRatingScaleMax: row.overallRatingScaleMax,
        overallRatingValue: coerceDecimalLikeToNumber(row.overallRatingValue),
        overallRatingReason: row.overallRatingReason ?? null,
        overallRatingBand: row.overallRatingBand ?? null,
        confidenceScore: coerceDecimalLikeToNumber(row.confidenceScore),
        errorMessage: row.errorMessage ?? null,
        processingStartedAt: row.processingStartedAt ?? null,
        createdAt: row.createdAt,
        completedAt: row.completedAt ?? null,
        userContext: extractUserContextFromResult(row),
        detail,
    };
}
/**
 * Get authenticated user - optimized to use session data
 * Only queries database for fields not available in session
 */
async function getAuthenticatedUser(ctx) {
    const user = ctx.session?.user;
    if (!user?.id) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in",
        });
    }
    // Optimize: Use role from session if available (set by auth hooks)
    // This avoids unnecessary database queries
    const sessionRole = user.role;
    const sessionName = user.name;
    const sessionEmail = user.email;
    // If we have all needed data in session, return it directly
    if (sessionRole && sessionName && sessionEmail) {
        return { id: user.id, role: sessionRole };
    }
    // Fallback: load user row when session is missing role (or other fields)
    const [dbUser] = await db
        .select({
        id: userTable.id,
        role: userTable.role,
        email: userTable.email,
        name: userTable.name,
    })
        .from(userTable)
        .where(eq(userTable.id, user.id))
        .limit(1);
    if (!dbUser) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
        });
    }
    return {
        id: user.id,
        role: (sessionRole || dbUser.role),
    };
}
// Helper to check if user is agency user
const isAgencyUser = (role) => {
    return ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);
};
const isAgencySuperAdmin = (role) => role === "AGENCY_SUPER_ADMIN";
function assertOwnerOrSuperAdmin(ownerUserId, actorUserId, actorRole, resource) {
    if (!isAgencySuperAdmin(actorRole) && ownerUserId !== actorUserId) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: `Only the ${resource} creator can modify it`,
        });
    }
}
/** Agency mutations: asset creator or super admin only (permission rows do not grant mutate). */
function assertCreativeAssetAgencyMutate(assetCreatedBy, userId, userRole) {
    if (!isAgencyUser(userRole)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only agency users can perform this action",
        });
    }
    assertOwnerOrSuperAdmin(assetCreatedBy, userId, userRole, "asset");
}
// Helper to check if user is customer
const isCustomer = (role) => {
    return role === "CUSTOMER";
};
export const creativeAssetsRouter = router({
    // Create a new creative asset
    create: protectedProcedure
        .input(z.object({
        teamId: z.string(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        category: z.string().optional(),
        status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "ARCHIVED"]).optional(),
    }))
        .output(creativeAssetSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Only agency users can create creative assets
        if (!isAgencyUser(user.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only agency users can create creative assets",
            });
        }
        const [teamRow] = await db
            .select()
            .from(team)
            .where(eq(team.id, input.teamId))
            .limit(1);
        if (!teamRow) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Team not found",
            });
        }
        const assetId = crypto.randomUUID();
        const now = new Date();
        const asset = await db.transaction(async (tx) => {
            await tx.insert(creativeAsset).values({
                id: assetId,
                teamId: input.teamId,
                name: input.name,
                description: input.description ?? null,
                category: input.category ?? null,
                status: input.status ?? "DRAFT",
                currentInternalVersion: null,
                currentPublicVersion: null,
                isPublic: false,
                createdBy: user.id,
                lastModifiedBy: user.id,
                createdAt: now,
                updatedAt: now,
            });
            await tx.insert(creativeAssetPermission).values({
                id: crypto.randomUUID(),
                creativeAssetId: assetId,
                userId: user.id,
                canView: true,
                canEdit: true,
                canComment: true,
                canApprove: true,
                canPublish: true,
                canDelete: true,
                grantedBy: user.id,
                createdAt: now,
                updatedAt: now,
            });
            await tx.insert(creativeAssetActivityLog).values({
                id: crypto.randomUUID(),
                creativeAssetId: assetId,
                userId: user.id,
                action: "CREATE",
                description: `Created creative asset: ${input.name}`,
                metadata: { teamId: input.teamId },
                ipAddress: null,
                userAgent: null,
                createdAt: now,
            });
            const [row] = await tx
                .select()
                .from(creativeAsset)
                .where(eq(creativeAsset.id, assetId))
                .limit(1);
            if (!row)
                throw new Error("creative asset insert failed");
            return { ...row, team: teamRow };
        });
        return transformAsset(asset);
    }),
    // Upload a new version
    uploadVersion: protectedProcedure
        .input(z.object({
        creativeAssetId: z.string(),
        fileUrl: z.string().url(),
        fileKey: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        fileMetadata: z.record(z.string(), z.unknown()).optional(),
        versionNotes: z.string().optional(),
        changesSummary: z.string().optional(),
    }))
        .output(creativeAssetVersionSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const asset = await db.query.creativeAsset.findFirst({
            where: eq(creativeAsset.id, input.creativeAssetId),
            with: {
                permissions: true,
                versions: {
                    orderBy: (v, { desc: d }) => [d(v.internalVersionNumber)],
                    limit: 1,
                },
            },
        });
        if (!asset) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Creative asset not found",
            });
        }
        if (isAgencyUser(user.role)) {
            assertCreativeAssetAgencyMutate(asset.createdBy, user.id, user.role);
        }
        else {
            // Customers cannot upload versions
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only agency users can upload new versions",
            });
        }
        // Get the latest version to set previousVersionId
        const latestVersion = asset.versions[0];
        const newInternalVersion = (asset.currentInternalVersion ?? 0) + 1;
        const versionId = crypto.randomUUID();
        const now = new Date();
        const version = await db.transaction(async (tx) => {
            await tx.insert(creativeAssetVersion).values({
                id: versionId,
                creativeAssetId: input.creativeAssetId,
                internalVersionNumber: newInternalVersion,
                publicVersionNumber: null,
                isPublic: false,
                internalApprovalStatus: "PENDING",
                publicApprovalStatus: "NOT_APPLICABLE",
                fileUrl: input.fileUrl,
                fileKey: input.fileKey,
                fileName: input.fileName,
                fileSize: input.fileSize,
                mimeType: input.mimeType,
                fileMetadata: input.fileMetadata ?? null,
                versionNotes: input.versionNotes ?? null,
                changesSummary: input.changesSummary ?? null,
                previousVersionId: latestVersion?.id ?? null,
                internalApprovedBy: null,
                internalApprovedAt: null,
                internalRejectedBy: null,
                internalRejectedAt: null,
                internalRejectionReason: null,
                publicApprovedBy: null,
                publicApprovedAt: null,
                publicRejectedBy: null,
                publicRejectedAt: null,
                publicRejectionReason: null,
                madePublicBy: null,
                madePublicAt: null,
                createdBy: user.id,
                createdAt: now,
                updatedAt: now,
            });
            await tx
                .update(creativeAsset)
                .set({
                currentInternalVersion: newInternalVersion,
                lastModifiedBy: user.id,
                updatedAt: now,
            })
                .where(eq(creativeAsset.id, input.creativeAssetId));
            await tx.insert(creativeAssetVersionActivityLog).values({
                id: crypto.randomUUID(),
                creativeAssetVersionId: versionId,
                userId: user.id,
                action: "CREATE",
                description: `Uploaded version ${newInternalVersion}`,
                metadata: { fileName: input.fileName },
                ipAddress: null,
                userAgent: null,
                createdAt: now,
            });
            const [row] = await tx
                .select()
                .from(creativeAssetVersion)
                .where(eq(creativeAssetVersion.id, versionId))
                .limit(1);
            if (!row)
                throw new Error("version insert failed");
            return row;
        });
        return transformVersion(version);
    }),
    // Approve version internally (agency)
    approveVersionInternally: protectedProcedure
        .input(z.object({
        versionId: z.string(),
    }))
        .output(creativeAssetVersionSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Only agency users can approve internally
        if (!isAgencyUser(user.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only agency users can approve versions internally",
            });
        }
        const version = await db.query.creativeAssetVersion.findFirst({
            where: eq(creativeAssetVersion.id, input.versionId),
            with: {
                creativeAsset: {
                    with: { permissions: true },
                },
            },
        });
        if (!version) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Version not found",
            });
        }
        assertCreativeAssetAgencyMutate(version.creativeAsset.createdBy, user.id, user.role);
        const now = new Date();
        let updateVersionData = {
            internalApprovalStatus: "APPROVED",
            internalApprovedBy: user.id,
            internalApprovedAt: now,
            internalRejectedBy: null,
            internalRejectedAt: null,
            internalRejectionReason: null,
            updatedAt: now,
        };
        if (!version.isPublic) {
            const [latestPublicVersion] = await db
                .select()
                .from(creativeAssetVersion)
                .where(and(eq(creativeAssetVersion.creativeAssetId, version.creativeAssetId), eq(creativeAssetVersion.isPublic, true)))
                .orderBy(desc(creativeAssetVersion.publicVersionNumber))
                .limit(1);
            const nextPublicVersion = latestPublicVersion
                ? (latestPublicVersion.publicVersionNumber ?? 0) + 1
                : 1;
            updateVersionData = {
                ...updateVersionData,
                isPublic: true,
                publicVersionNumber: nextPublicVersion,
                publicApprovalStatus: "PENDING",
                madePublicBy: user.id,
                madePublicAt: now,
            };
            await db.transaction(async (tx) => {
                await tx
                    .update(creativeAsset)
                    .set({
                    isPublic: true,
                    currentPublicVersion: nextPublicVersion,
                    lastModifiedBy: user.id,
                    updatedAt: now,
                })
                    .where(eq(creativeAsset.id, version.creativeAssetId));
                await tx.insert(creativeAssetVersionActivityLog).values({
                    id: crypto.randomUUID(),
                    creativeAssetVersionId: version.id,
                    userId: user.id,
                    action: "APPROVE_INTERNAL",
                    description: `Approved version ${version.internalVersionNumber} internally and made it public as version ${nextPublicVersion}`,
                    ipAddress: null,
                    userAgent: null,
                    createdAt: now,
                });
                await tx
                    .update(creativeAssetVersion)
                    .set(updateVersionData)
                    .where(eq(creativeAssetVersion.id, input.versionId));
            });
        }
        else {
            await db.transaction(async (tx) => {
                await tx.insert(creativeAssetVersionActivityLog).values({
                    id: crypto.randomUUID(),
                    creativeAssetVersionId: version.id,
                    userId: user.id,
                    action: "APPROVE_INTERNAL",
                    description: `Approved version ${version.internalVersionNumber} internally`,
                    ipAddress: null,
                    userAgent: null,
                    createdAt: now,
                });
                await tx
                    .update(creativeAssetVersion)
                    .set(updateVersionData)
                    .where(eq(creativeAssetVersion.id, input.versionId));
            });
        }
        const [updatedVersion] = await db
            .select()
            .from(creativeAssetVersion)
            .where(eq(creativeAssetVersion.id, input.versionId))
            .limit(1);
        if (!updatedVersion) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Version not found after update",
            });
        }
        return transformVersion(updatedVersion);
    }),
    // Reject version internally (agency)
    rejectVersionInternally: protectedProcedure
        .input(z.object({
        versionId: z.string(),
        rejectionReason: z.string().optional(),
    }))
        .output(creativeAssetVersionSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Only agency users can reject internally
        if (!isAgencyUser(user.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only agency users can reject versions internally",
            });
        }
        const version = await db.query.creativeAssetVersion.findFirst({
            where: eq(creativeAssetVersion.id, input.versionId),
            with: {
                creativeAsset: {
                    with: { permissions: true },
                },
            },
        });
        if (!version) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Version not found",
            });
        }
        assertCreativeAssetAgencyMutate(version.creativeAsset.createdBy, user.id, user.role);
        const now = new Date();
        const [updatedVersion] = await db
            .update(creativeAssetVersion)
            .set({
            internalApprovalStatus: "REJECTED",
            internalRejectedBy: user.id,
            internalRejectedAt: now,
            internalRejectionReason: input.rejectionReason ?? null,
            internalApprovedBy: null,
            internalApprovedAt: null,
            updatedAt: now,
        })
            .where(eq(creativeAssetVersion.id, input.versionId))
            .returning();
        if (!updatedVersion) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Version not found",
            });
        }
        await db.insert(creativeAssetVersionActivityLog).values({
            id: crypto.randomUUID(),
            creativeAssetVersionId: version.id,
            userId: user.id,
            action: "REJECT_INTERNAL",
            description: `Rejected version ${version.internalVersionNumber} internally`,
            metadata: { reason: input.rejectionReason },
            ipAddress: null,
            userAgent: null,
            createdAt: now,
        });
        return transformVersion(updatedVersion);
    }),
    // Make version public (agency)
    makeVersionPublic: protectedProcedure
        .input(z.object({
        versionId: z.string(),
    }))
        .output(creativeAssetVersionSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Only agency users can make versions public
        if (!isAgencyUser(user.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only agency users can make versions public",
            });
        }
        const version = await db.query.creativeAssetVersion.findFirst({
            where: eq(creativeAssetVersion.id, input.versionId),
            with: {
                creativeAsset: {
                    with: {
                        permissions: true,
                        versions: {
                            where: (v, { eq }) => eq(v.isPublic, true),
                            orderBy: (v, { desc: d }) => [d(v.publicVersionNumber)],
                            limit: 1,
                        },
                    },
                },
            },
        });
        if (!version) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Version not found",
            });
        }
        assertCreativeAssetAgencyMutate(version.creativeAsset.createdBy, user.id, user.role);
        // Must be approved internally first
        if (version.internalApprovalStatus !== "APPROVED") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Version must be approved internally before making it public",
            });
        }
        const latestPublicVersion = version.creativeAsset.versions[0];
        const nextPublicVersion = latestPublicVersion
            ? (latestPublicVersion.publicVersionNumber ?? 0) + 1
            : 1;
        const now = new Date();
        const [updatedVersion] = await db
            .update(creativeAssetVersion)
            .set({
            isPublic: true,
            publicVersionNumber: nextPublicVersion,
            publicApprovalStatus: "PENDING",
            madePublicBy: user.id,
            madePublicAt: now,
            updatedAt: now,
        })
            .where(eq(creativeAssetVersion.id, input.versionId))
            .returning();
        if (!updatedVersion) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
        }
        await db
            .update(creativeAsset)
            .set({
            isPublic: true,
            currentPublicVersion: nextPublicVersion,
            lastModifiedBy: user.id,
            updatedAt: now,
        })
            .where(eq(creativeAsset.id, version.creativeAssetId));
        await db.insert(creativeAssetVersionActivityLog).values({
            id: crypto.randomUUID(),
            creativeAssetVersionId: version.id,
            userId: user.id,
            action: "MAKE_PUBLIC",
            description: `Made version ${version.internalVersionNumber} public as version ${nextPublicVersion}`,
            ipAddress: null,
            userAgent: null,
            createdAt: now,
        });
        return transformVersion(updatedVersion);
    }),
    // Approve version publicly (customer)
    approveVersionPublicly: protectedProcedure
        .input(z.object({
        versionId: z.string(),
    }))
        .output(creativeAssetVersionSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Only customers can approve publicly
        if (!isCustomer(user.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only customers can approve versions publicly",
            });
        }
        const version = await db.query.creativeAssetVersion.findFirst({
            where: eq(creativeAssetVersion.id, input.versionId),
            with: {
                creativeAsset: {
                    with: {
                        team: {
                            with: { members: true },
                        },
                    },
                },
            },
        });
        if (!version) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Version not found",
            });
        }
        // Check if version is public
        if (!version.isPublic) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "This version is not public yet",
            });
        }
        // Check if user is member of the team
        const isMember = version.creativeAsset.team.members.some((m) => m.userId === user.id);
        if (!isMember) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You are not a member of this team",
            });
        }
        const now = new Date();
        const [updatedVersion] = await db
            .update(creativeAssetVersion)
            .set({
            publicApprovalStatus: "APPROVED",
            publicApprovedBy: user.id,
            publicApprovedAt: now,
            publicRejectedBy: null,
            publicRejectedAt: null,
            publicRejectionReason: null,
            updatedAt: now,
        })
            .where(eq(creativeAssetVersion.id, input.versionId))
            .returning();
        if (!updatedVersion) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
        }
        await db.insert(creativeAssetVersionActivityLog).values({
            id: crypto.randomUUID(),
            creativeAssetVersionId: version.id,
            userId: user.id,
            action: "APPROVE_PUBLIC",
            description: `Approved public version ${version.publicVersionNumber}`,
            ipAddress: null,
            userAgent: null,
            createdAt: now,
        });
        return transformVersion(updatedVersion);
    }),
    // Reject version publicly (customer)
    rejectVersionPublicly: protectedProcedure
        .input(z.object({
        versionId: z.string(),
        rejectionReason: z.string().optional(),
    }))
        .output(creativeAssetVersionSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Only customers can reject publicly
        if (!isCustomer(user.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only customers can reject versions publicly",
            });
        }
        const version = await db.query.creativeAssetVersion.findFirst({
            where: eq(creativeAssetVersion.id, input.versionId),
            with: {
                creativeAsset: {
                    with: {
                        team: {
                            with: { members: true },
                        },
                    },
                },
            },
        });
        if (!version) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Version not found",
            });
        }
        // Check if version is public
        if (!version.isPublic) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "This version is not public yet",
            });
        }
        // Check if user is member of the team
        const isMember = version.creativeAsset.team.members.some((m) => m.userId === user.id);
        if (!isMember) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You are not a member of this team",
            });
        }
        const now = new Date();
        const [updatedVersion] = await db
            .update(creativeAssetVersion)
            .set({
            publicApprovalStatus: "REJECTED",
            publicRejectedBy: user.id,
            publicRejectedAt: now,
            publicRejectionReason: input.rejectionReason ?? null,
            publicApprovedBy: null,
            publicApprovedAt: null,
            updatedAt: now,
        })
            .where(eq(creativeAssetVersion.id, input.versionId))
            .returning();
        if (!updatedVersion) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
        }
        await db.insert(creativeAssetVersionActivityLog).values({
            id: crypto.randomUUID(),
            creativeAssetVersionId: version.id,
            userId: user.id,
            action: "REJECT_PUBLIC",
            description: `Rejected public version ${version.publicVersionNumber}`,
            metadata: { reason: input.rejectionReason },
            ipAddress: null,
            userAgent: null,
            createdAt: now,
        });
        return transformVersion(updatedVersion);
    }),
    // Update version approval status
    updateVersionStatus: protectedProcedure
        .input(z.object({
        versionId: z.string(),
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "NOT_APPLICABLE"]),
    }))
        .output(creativeAssetVersionSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Only agency users can update version status
        if (!isAgencyUser(user.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only agency users can update version status",
            });
        }
        const version = await db.query.creativeAssetVersion.findFirst({
            where: eq(creativeAssetVersion.id, input.versionId),
            with: {
                creativeAsset: {
                    with: { permissions: true },
                },
            },
        });
        if (!version) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Version not found",
            });
        }
        assertCreativeAssetAgencyMutate(version.creativeAsset.createdBy, user.id, user.role);
        const now = new Date();
        let updateData = {
            internalApprovalStatus: input.status,
            updatedAt: now,
        };
        if (input.status === "APPROVED") {
            if (!version.isPublic) {
                const [latestPublicVersion] = await db
                    .select()
                    .from(creativeAssetVersion)
                    .where(and(eq(creativeAssetVersion.creativeAssetId, version.creativeAssetId), eq(creativeAssetVersion.isPublic, true)))
                    .orderBy(desc(creativeAssetVersion.publicVersionNumber))
                    .limit(1);
                const nextPublicVersion = latestPublicVersion
                    ? (latestPublicVersion.publicVersionNumber ?? 0) + 1
                    : 1;
                updateData = {
                    ...updateData,
                    internalApprovedBy: user.id,
                    internalApprovedAt: now,
                    internalRejectedBy: null,
                    internalRejectedAt: null,
                    internalRejectionReason: null,
                    isPublic: true,
                    publicVersionNumber: nextPublicVersion,
                    publicApprovalStatus: "PENDING",
                    madePublicBy: user.id,
                    madePublicAt: now,
                };
                await db
                    .update(creativeAsset)
                    .set({
                    isPublic: true,
                    currentPublicVersion: nextPublicVersion,
                    lastModifiedBy: user.id,
                    updatedAt: now,
                })
                    .where(eq(creativeAsset.id, version.creativeAssetId));
            }
            else {
                updateData = {
                    ...updateData,
                    internalApprovedBy: user.id,
                    internalApprovedAt: now,
                    internalRejectedBy: null,
                    internalRejectedAt: null,
                    internalRejectionReason: null,
                };
            }
        }
        else if (input.status === "REJECTED") {
            updateData = {
                ...updateData,
                internalRejectedBy: user.id,
                internalRejectedAt: now,
                internalApprovedBy: null,
                internalApprovedAt: null,
            };
        }
        else if (input.status === "PENDING") {
            updateData = {
                ...updateData,
                internalApprovedBy: null,
                internalApprovedAt: null,
                internalRejectedBy: null,
                internalRejectedAt: null,
                internalRejectionReason: null,
            };
        }
        else if (input.status === "NOT_APPLICABLE") {
            updateData = {
                ...updateData,
                internalApprovedBy: null,
                internalApprovedAt: null,
                internalRejectedBy: null,
                internalRejectedAt: null,
                internalRejectionReason: null,
            };
        }
        const [updatedVersion] = await db
            .update(creativeAssetVersion)
            .set(updateData)
            .where(eq(creativeAssetVersion.id, input.versionId))
            .returning();
        if (!updatedVersion) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
        }
        const actionMap = {
            PENDING: "SET_STATUS_PENDING",
            APPROVED: "APPROVE_INTERNAL",
            REJECTED: "REJECT_INTERNAL",
            NOT_APPLICABLE: "ARCHIVE_VERSION",
        };
        await db.insert(creativeAssetVersionActivityLog).values({
            id: crypto.randomUUID(),
            creativeAssetVersionId: version.id,
            userId: user.id,
            action: actionMap[input.status] || "UPDATE_STATUS",
            description: `Updated version ${version.internalVersionNumber} status to ${input.status}`,
            ipAddress: null,
            userAgent: null,
            createdAt: now,
        });
        return transformVersion(updatedVersion);
    }),
    // Make version private (unpublish)
    makeVersionPrivate: protectedProcedure
        .input(z.object({
        versionId: z.string(),
    }))
        .output(creativeAssetVersionSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Only agency users can make versions private
        if (!isAgencyUser(user.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only agency users can make versions private",
            });
        }
        const version = await db.query.creativeAssetVersion.findFirst({
            where: eq(creativeAssetVersion.id, input.versionId),
            with: {
                creativeAsset: {
                    with: { permissions: true },
                },
            },
        });
        if (!version) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Version not found",
            });
        }
        const permission = version.creativeAsset.permissions.find((p) => p.userId === user.id);
        assertCreativeAssetAgencyMutate(version.creativeAsset.createdBy, user.id, user.role, permission, "canPublish", "You don't have permission to make versions private");
        // Must be public to make it private
        if (!version.isPublic) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Version is not public",
            });
        }
        const now = new Date();
        const [updatedVersion] = await db
            .update(creativeAssetVersion)
            .set({
            isPublic: false,
            publicVersionNumber: null,
            publicApprovalStatus: "NOT_APPLICABLE",
            madePublicBy: null,
            madePublicAt: null,
            updatedAt: now,
        })
            .where(eq(creativeAssetVersion.id, input.versionId))
            .returning();
        if (!updatedVersion) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
        }
        const asset = await db.query.creativeAsset.findFirst({
            where: eq(creativeAsset.id, version.creativeAssetId),
            with: {
                versions: {
                    where: (v, { eq }) => eq(v.isPublic, true),
                    orderBy: (v, { desc: d }) => [d(v.publicVersionNumber)],
                    limit: 1,
                },
            },
        });
        if (asset) {
            const latestPublicVersion = asset.versions[0];
            await db
                .update(creativeAsset)
                .set({
                isPublic: !!latestPublicVersion,
                currentPublicVersion: latestPublicVersion?.publicVersionNumber ?? null,
                lastModifiedBy: user.id,
                updatedAt: now,
            })
                .where(eq(creativeAsset.id, version.creativeAssetId));
        }
        await db.insert(creativeAssetVersionActivityLog).values({
            id: crypto.randomUUID(),
            creativeAssetVersionId: version.id,
            userId: user.id,
            action: "MAKE_PRIVATE",
            description: `Made version ${version.internalVersionNumber} private`,
            ipAddress: null,
            userAgent: null,
            createdAt: now,
        });
        return transformVersion(updatedVersion);
    }),
    // Get all assets for a team
    getByTeam: protectedProcedure
        .input(z.object({
        teamId: z.string(),
    }))
        .output(z.array(creativeAssetSchema.extend({
        versions: z.array(creativeAssetVersionSchema).optional(),
        permissions: z.array(creativeAssetPermissionSchema).optional(),
        _count: z.object({
            versions: z.number(),
        }).optional(),
    })))
        .query(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const [membership] = await db
            .select()
            .from(teamMember)
            .where(and(eq(teamMember.teamId, input.teamId), eq(teamMember.userId, user.id)))
            .limit(1);
        const isAgency = isAgencyUser(user.role);
        if (!isAgency && !membership) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You don't have access to this team",
            });
        }
        const assets = await db.query.creativeAsset.findMany({
            where: eq(creativeAsset.teamId, input.teamId),
            with: {
                team: true,
                versions: isAgency
                    ? { orderBy: (v, { desc: d }) => [d(v.createdAt)] }
                    : {
                        where: (v, { eq }) => eq(v.isPublic, true),
                        orderBy: (v, { desc: d }) => [d(v.createdAt)],
                    },
                ...(isAgency ? { permissions: true } : {}),
            },
            orderBy: (a, { desc: d }) => [d(a.createdAt)],
        });
        const assetIds = assets.map((a) => a.id);
        const versionCountRows = assetIds.length > 0
            ? await db
                .select({
                creativeAssetId: creativeAssetVersion.creativeAssetId,
                c: count(),
            })
                .from(creativeAssetVersion)
                .where(inArray(creativeAssetVersion.creativeAssetId, assetIds))
                .groupBy(creativeAssetVersion.creativeAssetId)
            : [];
        const versionCountMap = new Map(versionCountRows.map((r) => [r.creativeAssetId, r.c]));
        const withCounts = assets.map((a) => ({
            ...a,
            _count: { versions: versionCountMap.get(a.id) ?? 0 },
        }));
        return withCounts.map(transformAsset);
    }),
    // Get all assets for the current user (across all teams)
    getAll: protectedProcedure
        .output(z.array(creativeAssetSchema.extend({
        versions: z.array(creativeAssetVersionSchema).optional(),
        permissions: z.array(creativeAssetPermissionSchema).optional(),
        _count: z.object({
            versions: z.number(),
        }).optional(),
    })))
        .query(async ({ ctx }) => {
        const user = await getAuthenticatedUser(ctx);
        const isAgency = isAgencyUser(user.role);
        if (isAgency) {
            const assets = await db.query.creativeAsset.findMany({
                with: {
                    team: true,
                    versions: { orderBy: (v, { desc: d }) => [d(v.createdAt)] },
                    permissions: true,
                },
                orderBy: (a, { desc: d }) => [d(a.createdAt)],
            });
            const assetIds = assets.map((a) => a.id);
            const versionCountRows = assetIds.length > 0
                ? await db
                    .select({
                    creativeAssetId: creativeAssetVersion.creativeAssetId,
                    c: count(),
                })
                    .from(creativeAssetVersion)
                    .where(inArray(creativeAssetVersion.creativeAssetId, assetIds))
                    .groupBy(creativeAssetVersion.creativeAssetId)
                : [];
            const versionCountMap = new Map(versionCountRows.map((r) => [r.creativeAssetId, r.c]));
            return assets.map((a) => transformAsset({
                ...a,
                _count: { versions: versionCountMap.get(a.id) ?? 0 },
            }));
        }
        const teamMemberships = await db
            .select({ teamId: teamMember.teamId })
            .from(teamMember)
            .where(eq(teamMember.userId, user.id));
        const teamIds = teamMemberships.map((tm) => tm.teamId);
        if (teamIds.length === 0) {
            return [];
        }
        const customerAssets = await db
            .select({ id: creativeAsset.id })
            .from(creativeAsset)
            .where(inArray(creativeAsset.teamId, teamIds));
        const assetIds = customerAssets.map((a) => a.id);
        if (assetIds.length === 0) {
            return [];
        }
        const assets = await db.query.creativeAsset.findMany({
            where: inArray(creativeAsset.id, assetIds),
            with: {
                team: true,
                versions: {
                    where: (v, { eq: eqFn }) => eqFn(v.isPublic, true),
                    orderBy: (v, { desc: d }) => [d(v.createdAt)],
                },
            },
            orderBy: (a, { desc: d }) => [d(a.createdAt)],
        });
        const versionCountRows = await db
            .select({
            creativeAssetId: creativeAssetVersion.creativeAssetId,
            c: count(),
        })
            .from(creativeAssetVersion)
            .where(inArray(creativeAssetVersion.creativeAssetId, assetIds))
            .groupBy(creativeAssetVersion.creativeAssetId);
        const versionCountMap = new Map(versionCountRows.map((r) => [r.creativeAssetId, r.c]));
        return assets.map((a) => transformAsset({
            ...a,
            _count: { versions: versionCountMap.get(a.id) ?? 0 },
        }));
    }),
    // Get asset details
    getById: protectedProcedure
        .input(z.object({
        id: z.string(),
    }))
        .output(creativeAssetSchema.extend({
        team: z.object({
            id: z.string(),
            name: z.string(),
            slug: z.string(),
            members: z.array(z.object({
                userId: z.string(),
            })).optional(),
        }),
        versions: z.array(creativeAssetVersionSchema).optional(),
        permissions: z.array(creativeAssetPermissionSchema).optional(),
    }))
        .query(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const asset = await db.query.creativeAsset.findFirst({
            where: eq(creativeAsset.id, input.id),
            with: {
                team: {
                    with: { members: true },
                },
                versions: {
                    orderBy: (v, { desc: d }) => [d(v.internalVersionNumber)],
                },
                permissions: true,
            },
        });
        if (!asset) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Asset not found",
            });
        }
        const isAgency = isAgencyUser(user.role);
        if (!isAgency) {
            const isMember = asset.team.members.some((m) => m.userId === user.id);
            if (!isMember) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You don't have access to this asset",
                });
            }
            asset.versions = asset.versions.filter((v) => v.isPublic);
        }
        // Transform and return
        const transformed = transformAsset(asset);
        return {
            ...transformed,
            team: {
                id: asset.team.id,
                name: asset.team.name,
                slug: asset.team.slug,
                members: asset.team.members,
            },
            versions: asset.versions.map(transformVersion),
            permissions: asset.permissions,
        };
    }),
    // Add comment to version
    addComment: protectedProcedure
        .input(z.object({
        versionId: z.string(),
        content: z.string().min(1),
        isInternal: z.boolean(),
        parentCommentId: z.string().optional(),
        mentions: z.array(z.string()).optional(),
    }))
        .output(commentSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const version = await db.query.creativeAssetVersion.findFirst({
            where: eq(creativeAssetVersion.id, input.versionId),
            with: {
                creativeAsset: {
                    with: {
                        permissions: true,
                        team: {
                            with: { members: true },
                        },
                    },
                },
            },
        });
        if (!version) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Version not found",
            });
        }
        const isAgency = isAgencyUser(user.role);
        if (isAgency) {
            assertCreativeAssetAgencyMutate(version.creativeAsset.createdBy, user.id, user.role);
        }
        else {
            // Customers can only comment on public versions
            if (!version.isPublic) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "This version is not public yet",
                });
            }
            // Check if customer is team member
            const isMember = version.creativeAsset.team.members.some((m) => m.userId === user.id);
            if (!isMember) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You don't have access to this version",
                });
            }
            // Customers can only add public comments
            if (input.isInternal) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Customers cannot add internal comments",
                });
            }
        }
        // Agency users cannot add public comments to non-public versions
        if (isAgency && !input.isInternal && !version.isPublic) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Cannot add public comments to versions that are not public yet",
            });
        }
        const commentId = crypto.randomUUID();
        const now = new Date();
        const mentionsPayload = input.mentions ?? [];
        await db.insert(creativeAssetComment).values({
            id: commentId,
            creativeAssetVersionId: input.versionId,
            userId: user.id,
            content: input.content,
            isInternal: input.isInternal,
            parentCommentId: input.parentCommentId ?? null,
            isResolved: false,
            resolvedBy: null,
            resolvedAt: null,
            replyCount: 0,
            mentions: mentionsPayload,
            createdAt: now,
            updatedAt: now,
            editedAt: null,
        });
        if (input.parentCommentId) {
            await db
                .update(creativeAssetComment)
                .set({
                replyCount: sql `${creativeAssetComment.replyCount} + 1`,
            })
                .where(eq(creativeAssetComment.id, input.parentCommentId));
        }
        const [comment] = await db
            .select()
            .from(creativeAssetComment)
            .where(eq(creativeAssetComment.id, commentId))
            .limit(1);
        if (!comment) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Comment create failed" });
        }
        return transformComment(comment);
    }),
    // Get comments for a version
    getComments: protectedProcedure
        .input(z.object({
        versionId: z.string(),
    }))
        .output(z.array(commentSchema.extend({
        replies: z.array(commentSchema).optional(),
    })))
        .query(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const version = await db.query.creativeAssetVersion.findFirst({
            where: eq(creativeAssetVersion.id, input.versionId),
            with: {
                creativeAsset: {
                    with: {
                        permissions: true,
                        team: {
                            with: { members: true },
                        },
                    },
                },
            },
        });
        if (!version) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Version not found",
            });
        }
        const isAgency = isAgencyUser(user.role);
        if (!isAgency) {
            // Customers can only view public versions
            if (!version.isPublic) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "This version is not public yet",
                });
            }
            // Check if customer is team member
            const isMember = version.creativeAsset.team.members.some((m) => m.userId === user.id);
            if (!isMember) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You don't have access to this version",
                });
            }
        }
        const topWhere = and(eq(creativeAssetComment.creativeAssetVersionId, input.versionId), isNull(creativeAssetComment.parentCommentId), ...(isAgency ? [] : [eq(creativeAssetComment.isInternal, false)]));
        const comments = await db.query.creativeAssetComment.findMany({
            where: topWhere,
            with: {
                replies: {
                    orderBy: (c, { asc: a }) => [a(c.createdAt)],
                    ...(isAgency
                        ? {}
                        : { where: (c, { eq }) => eq(c.isInternal, false) }),
                },
            },
            orderBy: (c, { asc: a }) => [a(c.createdAt)],
        });
        return comments.map(transformComment);
    }),
    // Update a comment
    updateComment: protectedProcedure
        .input(z.object({
        commentId: z.string(),
        content: z.string().min(1),
    }))
        .output(commentSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const [comment] = await db
            .select()
            .from(creativeAssetComment)
            .where(eq(creativeAssetComment.id, input.commentId))
            .limit(1);
        if (!comment) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Comment not found",
            });
        }
        if (comment.userId !== user.id && !isAgencySuperAdmin(user.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You can only edit your own comments",
            });
        }
        const now = new Date();
        const [updatedComment] = await db
            .update(creativeAssetComment)
            .set({
            content: input.content,
            updatedAt: now,
            editedAt: now,
        })
            .where(eq(creativeAssetComment.id, input.commentId))
            .returning();
        if (!updatedComment) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
        }
        return transformComment(updatedComment);
    }),
    // Delete a comment
    deleteComment: protectedProcedure
        .input(z.object({
        commentId: z.string(),
    }))
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const comment = await db.query.creativeAssetComment.findFirst({
            where: eq(creativeAssetComment.id, input.commentId),
            with: { parentComment: true },
        });
        if (!comment) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Comment not found",
            });
        }
        if (comment.userId !== user.id && !isAgencySuperAdmin(user.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You can only delete your own comments",
            });
        }
        if (comment.parentCommentId) {
            await db
                .update(creativeAssetComment)
                .set({
                replyCount: sql `GREATEST(${creativeAssetComment.replyCount} - 1, 0)`,
            })
                .where(eq(creativeAssetComment.id, comment.parentCommentId));
        }
        await db
            .delete(creativeAssetComment)
            .where(eq(creativeAssetComment.id, input.commentId));
        return { success: true };
    }),
    // Grant permissions to agency user
    grantPermissions: protectedProcedure
        .input(z.object({
        creativeAssetId: z.string(),
        userId: z.string(),
        permissions: z.object({
            canView: z.boolean().optional(),
            canEdit: z.boolean().optional(),
            canComment: z.boolean().optional(),
            canApprove: z.boolean().optional(),
            canPublish: z.boolean().optional(),
            canDelete: z.boolean().optional(),
        }),
    }))
        .output(creativeAssetPermissionSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Only agency admins and super admins can grant permissions
        if (user.role !== "AGENCY_ADMIN" && user.role !== "AGENCY_SUPER_ADMIN") {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only agency admins can grant permissions",
            });
        }
        const [targetUserRow] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.id, input.userId))
            .limit(1);
        if (!targetUserRow || !isAgencyUser(targetUserRow.role)) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Target user must be an agency user",
            });
        }
        const [assetRow] = await db
            .select()
            .from(creativeAsset)
            .where(eq(creativeAsset.id, input.creativeAssetId))
            .limit(1);
        if (!assetRow) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Asset not found",
            });
        }
        assertOwnerOrSuperAdmin(assetRow.createdBy, user.id, user.role, "asset");
        const p = input.permissions;
        const now = new Date();
        const insertValues = {
            id: crypto.randomUUID(),
            creativeAssetId: input.creativeAssetId,
            userId: input.userId,
            canView: p.canView ?? true,
            canEdit: p.canEdit ?? false,
            canComment: p.canComment ?? true,
            canApprove: p.canApprove ?? false,
            canPublish: p.canPublish ?? false,
            canDelete: p.canDelete ?? false,
            grantedBy: user.id,
            createdAt: now,
            updatedAt: now,
        };
        const updateSet = { updatedAt: now };
        if (p.canView !== undefined)
            updateSet.canView = p.canView;
        if (p.canEdit !== undefined)
            updateSet.canEdit = p.canEdit;
        if (p.canComment !== undefined)
            updateSet.canComment = p.canComment;
        if (p.canApprove !== undefined)
            updateSet.canApprove = p.canApprove;
        if (p.canPublish !== undefined)
            updateSet.canPublish = p.canPublish;
        if (p.canDelete !== undefined)
            updateSet.canDelete = p.canDelete;
        const [permission] = await db
            .insert(creativeAssetPermission)
            .values(insertValues)
            .onConflictDoUpdate({
            target: [
                creativeAssetPermission.creativeAssetId,
                creativeAssetPermission.userId,
            ],
            set: updateSet,
        })
            .returning();
        if (!permission) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Permission upsert failed",
            });
        }
        await db.insert(creativeAssetActivityLog).values({
            id: crypto.randomUUID(),
            creativeAssetId: input.creativeAssetId,
            userId: user.id,
            action: "EDIT_PERMISSIONS",
            description: `Updated permissions for user ${input.userId}`,
            metadata: { targetUserId: input.userId, permissions: input.permissions },
            ipAddress: null,
            userAgent: null,
            createdAt: now,
        });
        return permission;
    }),
    // Update a creative asset
    update: protectedProcedure
        .input(z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "ARCHIVED"]).optional(),
        teamId: z.string().optional(),
    }))
        .output(creativeAssetSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Only agency users can update creative assets
        if (!isAgencyUser(user.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only agency users can update creative assets",
            });
        }
        const asset = await db.query.creativeAsset.findFirst({
            where: eq(creativeAsset.id, input.id),
            with: {
                permissions: true,
                team: true,
            },
        });
        if (!asset) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Creative asset not found",
            });
        }
        const permission = asset.permissions.find((p) => p.userId === user.id);
        assertCreativeAssetAgencyMutate(asset.createdBy, user.id, user.role, permission, "canEdit", "You don't have permission to update this asset");
        // Verify team exists if teamId is being updated
        if (input.teamId && input.teamId !== asset.teamId) {
            const [teamRow] = await db
                .select()
                .from(team)
                .where(eq(team.id, input.teamId))
                .limit(1);
            if (!teamRow) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Team not found",
                });
            }
        }
        // Build update data object
        const updateData = {
            lastModifiedBy: user.id,
            updatedAt: new Date(),
        };
        if (input.name !== undefined)
            updateData.name = input.name;
        if (input.description !== undefined)
            updateData.description = input.description || null;
        if (input.category !== undefined)
            updateData.category = input.category || null;
        if (input.status !== undefined)
            updateData.status = input.status;
        if (input.teamId !== undefined)
            updateData.teamId = input.teamId;
        await db
            .update(creativeAsset)
            .set(updateData)
            .where(eq(creativeAsset.id, input.id));
        const updatedAsset = await db.query.creativeAsset.findFirst({
            where: eq(creativeAsset.id, input.id),
            with: { team: true },
        });
        if (!updatedAsset) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Creative asset not found",
            });
        }
        const logNow = new Date();
        await db.insert(creativeAssetActivityLog).values({
            id: crypto.randomUUID(),
            creativeAssetId: asset.id,
            userId: user.id,
            action: "UPDATE",
            description: `Updated creative asset: ${updatedAsset.name}`,
            metadata: {
                previousValues: {
                    name: asset.name,
                    description: asset.description,
                    category: asset.category,
                    status: asset.status,
                    teamId: asset.teamId,
                },
                newValues: updateData,
            },
            ipAddress: null,
            userAgent: null,
            createdAt: logNow,
        });
        return transformAsset(updatedAsset);
    }),
    // Archive a creative asset
    archive: protectedProcedure
        .input(z.object({
        id: z.string(),
    }))
        .output(creativeAssetSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Only agency users can archive creative assets
        if (!isAgencyUser(user.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only agency users can archive creative assets",
            });
        }
        const asset = await db.query.creativeAsset.findFirst({
            where: eq(creativeAsset.id, input.id),
            with: {
                permissions: true,
                team: true,
            },
        });
        if (!asset) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Creative asset not found",
            });
        }
        assertOwnerOrSuperAdmin(asset.createdBy, user.id, user.role, "asset");
        const now = new Date();
        await db
            .update(creativeAsset)
            .set({
            status: "ARCHIVED",
            lastModifiedBy: user.id,
            updatedAt: now,
        })
            .where(eq(creativeAsset.id, input.id));
        const updatedAsset = await db.query.creativeAsset.findFirst({
            where: eq(creativeAsset.id, input.id),
            with: { team: true },
        });
        if (!updatedAsset) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Creative asset not found",
            });
        }
        await db.insert(creativeAssetActivityLog).values({
            id: crypto.randomUUID(),
            creativeAssetId: asset.id,
            userId: user.id,
            action: "ARCHIVE",
            description: `Archived creative asset: ${asset.name}`,
            metadata: { previousStatus: asset.status },
            ipAddress: null,
            userAgent: null,
            createdAt: now,
        });
        return transformAsset(updatedAsset);
    }),
    // Unarchive a creative asset (change status from ARCHIVED to DRAFT)
    unarchive: protectedProcedure
        .input(z.object({
        id: z.string(),
    }))
        .output(creativeAssetSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Only agency users can unarchive creative assets
        if (!isAgencyUser(user.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only agency users can unarchive creative assets",
            });
        }
        const asset = await db.query.creativeAsset.findFirst({
            where: eq(creativeAsset.id, input.id),
            with: {
                permissions: true,
                team: true,
            },
        });
        if (!asset) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Creative asset not found",
            });
        }
        assertOwnerOrSuperAdmin(asset.createdBy, user.id, user.role, "asset");
        if (asset.status !== "ARCHIVED") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Asset is not archived",
            });
        }
        const now = new Date();
        await db
            .update(creativeAsset)
            .set({
            status: "DRAFT",
            lastModifiedBy: user.id,
            updatedAt: now,
        })
            .where(eq(creativeAsset.id, input.id));
        const updatedAsset = await db.query.creativeAsset.findFirst({
            where: eq(creativeAsset.id, input.id),
            with: { team: true },
        });
        if (!updatedAsset) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Creative asset not found",
            });
        }
        await db.insert(creativeAssetActivityLog).values({
            id: crypto.randomUUID(),
            creativeAssetId: asset.id,
            userId: user.id,
            action: "UNARCHIVE",
            description: `Unarchived creative asset: ${asset.name}`,
            metadata: { previousStatus: asset.status },
            ipAddress: null,
            userAgent: null,
            createdAt: now,
        });
        return transformAsset(updatedAsset);
    }),
    /** Synchronous AI vision analysis (Replicate Claude Haiku); persists one row per run. Asset creator or super admin. */
    runAiImageAnalysis: protectedProcedure
        .input(z.object({
        creativeAssetVersionId: z.string(),
        userContext: z
            .string()
            .trim()
            .max(4000, "Context must be at most 4000 characters")
            .optional(),
    }))
        .output(runCreativeAssetAiImageAnalysisOutputSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        if (!isAgencyUser(user.role)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only agency users can run AI image analysis",
            });
        }
        if (!env.REPLICATE_API_TOKEN?.trim()) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "AI analysis is not configured (missing Replicate API token)",
            });
        }
        const version = await db.query.creativeAssetVersion.findFirst({
            where: eq(creativeAssetVersion.id, input.creativeAssetVersionId),
            with: {
                creativeAsset: {
                    with: {
                        permissions: true,
                        team: {
                            with: { members: true },
                        },
                    },
                },
            },
        });
        if (!version) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Version not found",
            });
        }
        assertCreativeAssetAgencyMutate(version.creativeAsset.createdBy, user.id, user.role);
        if (!version.mimeType?.toLowerCase().startsWith("image/")) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "AI analysis supports image MIME types only",
            });
        }
        const analysisId = crypto.randomUUID();
        const now = new Date();
        await db.insert(creativeAssetAiAnalysis).values({
            id: analysisId,
            creativeAssetId: version.creativeAssetId,
            creativeAssetVersionId: version.id,
            requestedBy: user.id,
            status: "PROCESSING",
            model: CREATIVE_ASSET_IMAGE_ANALYSIS_MODEL,
            summary: null,
            overallRatingScaleMax: 10,
            overallRatingValue: null,
            overallRatingReason: null,
            overallRatingBand: null,
            confidenceScore: null,
            result: null,
            errorMessage: null,
            processingStartedAt: now,
            createdAt: now,
            completedAt: null,
        });
        const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
        const trimmedContext = input.userContext?.trim() || null;
        try {
            const { detail } = await invokeCreativeAssetImageAnalysis({
                replicate,
                imageUrl: version.fileUrl,
                fileName: version.fileName,
                mimeType: version.mimeType,
                internalVersionNumber: version.internalVersionNumber,
                userContext: trimmedContext,
            });
            const completedAt = new Date();
            const confidenceStr = detail.confidenceScore != null && Number.isFinite(detail.confidenceScore)
                ? detail.confidenceScore.toFixed(4)
                : null;
            await db
                .update(creativeAssetAiAnalysis)
                .set({
                status: "COMPLETED",
                summary: detail.ratingSummary,
                model: CREATIVE_ASSET_IMAGE_ANALYSIS_MODEL,
                overallRatingScaleMax: detail.overallRatingScaleMax,
                overallRatingValue: detail.overallRatingValue.toFixed(2),
                overallRatingReason: detail.overallRatingReason,
                overallRatingBand: detail.overallRatingBand ?? null,
                confidenceScore: confidenceStr,
                result: {
                    ...detail,
                    ...(trimmedContext ? { userContext: trimmedContext } : {}),
                },
                errorMessage: null,
                completedAt,
            })
                .where(eq(creativeAssetAiAnalysis.id, analysisId));
            return { analysisId, detail };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : "Creative asset AI analysis failed";
            const lower = msg.toLowerCase();
            await db
                .update(creativeAssetAiAnalysis)
                .set({
                status: "FAILED",
                errorMessage: msg,
                completedAt: new Date(),
            })
                .where(eq(creativeAssetAiAnalysis.id, analysisId));
            if (lower.includes("429") || lower.includes("rate limit")) {
                throw new TRPCError({
                    code: "TOO_MANY_REQUESTS",
                    message: "AI is temporarily busy. Please wait and try again.",
                });
            }
            if (lower.includes("timed out")) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "The AI request took too long. Try again; very large images may need a smaller export.",
                });
            }
            console.error("[creativeAssets.runAiImageAnalysis] failed:", e);
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: msg,
            });
        }
    }),
    /** History + latest payloads for AI analysis tab (same access as viewing the version comments). */
    listAiImageAnalyses: protectedProcedure
        .input(z.object({
        versionId: z.string(),
    }))
        .output(z.array(creativeAssetAiAnalysisListItemSchema))
        .query(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const version = await db.query.creativeAssetVersion.findFirst({
            where: eq(creativeAssetVersion.id, input.versionId),
            with: {
                creativeAsset: {
                    with: {
                        permissions: true,
                        team: {
                            with: { members: true },
                        },
                    },
                },
            },
        });
        if (!version) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Version not found",
            });
        }
        const isAgency = isAgencyUser(user.role);
        if (!isAgency) {
            if (!version.isPublic) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "This version is not public yet",
                });
            }
            const isMember = version.creativeAsset.team.members.some((m) => m.userId === user.id);
            if (!isMember) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You don't have access to this version",
                });
            }
        }
        const rows = await db.query.creativeAssetAiAnalysis.findMany({
            where: eq(creativeAssetAiAnalysis.creativeAssetVersionId, input.versionId),
            orderBy: (t, { desc: d }) => [d(t.createdAt)],
        });
        return rows.map(mapCreativeAiAnalysisRow);
    }),
});
