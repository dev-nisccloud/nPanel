import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { and, asc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { team } from "@npanel/db/schema/teams";
import { creativeBrief, creativeBriefActivityLog, creativeBriefReferenceImage, } from "@npanel/db/schema/creative-briefs";
// ============================================================================
// ZOD SCHEMAS - Independent from database schema (no shared types)
// ============================================================================
// Reference image schema
const creativeBriefReferenceImageSchema = z.object({
    id: z.string(),
    creativeBriefId: z.string(),
    fileUrl: z.string(),
    fileKey: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    fileMetadata: z.unknown().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
// Response schemas
const creativeBriefSchema = z.object({
    id: z.string(),
    name: z.string(),
    userId: z.string(),
    teamId: z.string().nullable(),
    status: z.enum(["DRAFT", "REVIEWING", "APPROVED", "REJECTED"]),
    background: z.string(),
    objectives: z.string(),
    requirements: z.string(),
    comments: z.string().nullable(),
    style: z.string().nullable(),
    copy: z.string().nullable(),
    mandatoryElements: z.string().nullable(),
    designPreference: z.string().nullable(),
    approverUserId: z.string().nullable(),
    approvedBy: z.string().nullable(),
    approvedAt: z.date().nullable(),
    rejectedBy: z.string().nullable(),
    rejectedAt: z.date().nullable(),
    timelineStartDate: z.date().nullable(),
    timelineEndDate: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
    }).optional(),
    team: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
    }).nullable().optional(),
    approver: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
    }).nullable().optional(),
    referenceImages: z.array(creativeBriefReferenceImageSchema).optional(),
});
// Input schemas
// Note: Dates come as strings from tRPC serialization, so we need to convert them
const createCreativeBriefInputSchema = z.object({
    name: z.string().min(1).max(255),
    teamId: z.string().optional(),
    approverUserId: z.string().optional(),
    background: z.string().min(1),
    objectives: z.string().min(1),
    requirements: z.string().min(1),
    comments: z.string().optional(),
    style: z.string().optional(),
    copy: z.string().optional(),
    mandatoryElements: z.string().optional(),
    designPreference: z.string().optional(),
    timelineStartDate: z.preprocess((val) => {
        if (val === undefined || val === null || val === "")
            return undefined;
        if (val instanceof Date)
            return val;
        if (typeof val === "string") {
            const date = new Date(val);
            return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
    }, z.date().optional()),
    timelineEndDate: z.preprocess((val) => {
        if (val === undefined || val === null || val === "")
            return undefined;
        if (val instanceof Date)
            return val;
        if (typeof val === "string") {
            const date = new Date(val);
            return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
    }, z.date().optional()),
    referenceImages: z.array(z.object({
        fileUrl: z.string(),
        fileKey: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        fileMetadata: z.unknown().optional(),
    })).optional(),
});
const updateCreativeBriefInputSchema = z.object({
    id: z.string(),
    name: z.string().min(1).max(255).optional(),
    teamId: z.string().optional(),
    background: z.string().min(1).optional(),
    objectives: z.string().min(1).optional(),
    requirements: z.string().min(1).optional(),
    comments: z.string().optional(),
    style: z.string().optional(),
    copy: z.string().optional(),
    mandatoryElements: z.string().optional(),
    designPreference: z.string().optional(),
    timelineStartDate: z.preprocess((val) => {
        if (val === undefined || val === null || val === "")
            return undefined;
        if (val instanceof Date)
            return val;
        if (typeof val === "string") {
            const date = new Date(val);
            return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
    }, z.date().optional()),
    timelineEndDate: z.preprocess((val) => {
        if (val === undefined || val === null || val === "")
            return undefined;
        if (val instanceof Date)
            return val;
        if (typeof val === "string") {
            const date = new Date(val);
            return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
    }, z.date().optional()),
    referenceImages: z.array(z.object({
        fileUrl: z.string(),
        fileKey: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        fileMetadata: z.unknown().optional(),
    })).optional(),
});
// ============================================================================
// TRANSFORM FUNCTIONS - Convert DB types to API response types
// ============================================================================
function transformReferenceImage(image) {
    return {
        id: image.id,
        creativeBriefId: image.creativeBriefId,
        fileUrl: image.fileUrl,
        fileKey: image.fileKey,
        fileName: image.fileName,
        fileSize: image.fileSize,
        mimeType: image.mimeType,
        fileMetadata: image.fileMetadata ?? null,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
    };
}
function transformBrief(brief) {
    const result = {
        id: brief.id,
        name: brief.name,
        userId: brief.userId,
        teamId: brief.teamId,
        status: brief.status,
        background: brief.background,
        objectives: brief.objectives,
        requirements: brief.requirements,
        comments: brief.comments,
        style: brief.style ?? null,
        copy: brief.copy ?? null,
        mandatoryElements: brief.mandatoryElements ?? null,
        designPreference: brief.designPreference ?? null,
        approverUserId: brief.approverUserId ?? null,
        approvedBy: brief.approvedBy,
        approvedAt: brief.approvedAt,
        rejectedBy: brief.rejectedBy,
        rejectedAt: brief.rejectedAt,
        timelineStartDate: brief.timelineStartDate,
        timelineEndDate: brief.timelineEndDate,
        createdAt: brief.createdAt,
        updatedAt: brief.updatedAt,
    };
    if (brief.user) {
        result.user = {
            id: brief.user.id,
            name: brief.user.name,
            email: brief.user.email,
        };
    }
    if (brief.team !== undefined) {
        result.team = brief.team ? {
            id: brief.team.id,
            name: brief.team.name,
            slug: brief.team.slug,
        } : null;
    }
    if (brief.approver !== undefined) {
        result.approver = brief.approver ? {
            id: brief.approver.id,
            name: brief.approver.name,
            email: brief.approver.email,
        } : null;
    }
    if (brief.referenceImages !== undefined) {
        result.referenceImages = brief.referenceImages.map(transformReferenceImage);
    }
    return result;
}
/**
 * Get authenticated user - optimized to use session data
 * Only queries database to verify user exists if needed
 */
async function getAuthenticatedUser(ctx) {
    const user = ctx.session?.user;
    if (!user?.id) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in",
        });
    }
    // Optimize: If user.id is in session, we can trust it (set by auth hooks)
    // Only need to verify user exists if we're doing additional validation
    // For most cases, we can just return the session user id
    // If we need to verify existence, we can query, but it's usually not necessary
    // since the session is already authenticated by the auth middleware
    // Return session user id directly - no need to query database
    // The session is already validated by the auth middleware
    return { id: user.id };
}
export const creativeBriefsRouter = router({
    // Get all creative briefs for the authenticated user
    getAll: protectedProcedure
        .output(z.array(creativeBriefSchema))
        .query(async ({ ctx }) => {
        const user = await getAuthenticatedUser(ctx);
        const briefs = await db.query.creativeBrief.findMany({
            where: eq(creativeBrief.userId, user.id),
            with: {
                user: true,
                team: true,
                referenceImages: {
                    orderBy: (ref, { asc }) => [asc(ref.createdAt)],
                },
            },
            orderBy: (cb, { desc }) => [desc(cb.createdAt)],
        });
        return briefs.map(transformBrief);
    }),
    // Get a single creative brief by ID
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .output(creativeBriefSchema)
        .query(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const brief = await db.query.creativeBrief.findFirst({
            where: and(eq(creativeBrief.id, input.id), eq(creativeBrief.userId, user.id)),
            with: {
                user: true,
                team: true,
                approver: true,
                referenceImages: {
                    orderBy: (ref, { asc }) => [asc(ref.createdAt)],
                },
            },
        });
        if (!brief) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Creative brief not found",
            });
        }
        return transformBrief(brief);
    }),
    // Create a new creative brief
    create: protectedProcedure
        .input(createCreativeBriefInputSchema)
        .output(creativeBriefSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Batch: Validate team and date range in parallel (if both are needed)
        // This reduces connection usage when both validations are needed
        const [teamRecord, dateRangeValid] = await Promise.all([
            // Only query team if teamId is provided
            input.teamId
                ? db.query.team.findFirst({
                    where: eq(team.id, input.teamId),
                })
                : Promise.resolve(null),
            // Validate date range (synchronous check, no DB query)
            Promise.resolve(input.timelineStartDate && input.timelineEndDate
                ? input.timelineEndDate >= input.timelineStartDate
                : true),
        ]);
        if (input.teamId && !teamRecord) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Team not found",
            });
        }
        if (!dateRangeValid) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "End date must be after start date",
            });
        }
        // Batch: Create brief, reference images, and log activity in a transaction
        // This reduces connection usage from 3-4 sequential queries to 1 transaction
        const brief = await db.transaction(async (tx) => {
            const briefId = crypto.randomUUID();
            await tx.insert(creativeBrief).values({
                id: briefId,
                name: input.name,
                userId: user.id,
                teamId: input.teamId ?? null,
                status: "DRAFT",
                background: input.background,
                objectives: input.objectives,
                requirements: input.requirements,
                comments: input.comments ?? null,
                style: input.style ?? null,
                copy: input.copy ?? null,
                mandatoryElements: input.mandatoryElements ?? null,
                designPreference: input.designPreference ?? null,
                approverUserId: input.approverUserId ?? null,
                timelineStartDate: input.timelineStartDate ?? null,
                timelineEndDate: input.timelineEndDate ?? null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            // Create reference images if provided
            if (input.referenceImages && input.referenceImages.length > 0) {
                await tx.insert(creativeBriefReferenceImage).values(input.referenceImages.map((img) => ({
                    id: crypto.randomUUID(),
                    creativeBriefId: briefId,
                    fileUrl: img.fileUrl,
                    fileKey: img.fileKey,
                    fileName: img.fileName,
                    fileSize: img.fileSize,
                    mimeType: img.mimeType,
                    fileMetadata: img.fileMetadata ?? null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })));
            }
            // Log activity
            await tx.insert(creativeBriefActivityLog).values({
                id: crypto.randomUUID(),
                creativeBriefId: briefId,
                userId: user.id,
                action: "CREATE",
                description: `Created creative brief "${input.name}"`,
                comment: null,
                metadata: input.referenceImages && input.referenceImages.length > 0
                    ? { referenceImagesCount: input.referenceImages.length }
                    : null,
                ipAddress: null,
                userAgent: null,
                createdAt: new Date(),
            });
            const createdBrief = await tx.query.creativeBrief.findFirst({
                where: eq(creativeBrief.id, briefId),
                with: {
                    user: true,
                    team: true,
                    approver: true,
                    referenceImages: {
                        orderBy: (ref, { asc }) => [asc(ref.createdAt)],
                    },
                },
            });
            if (!createdBrief) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to load created brief" });
            }
            return createdBrief;
        });
        return transformBrief(brief);
    }),
    // Update a creative brief
    update: protectedProcedure
        .input(updateCreativeBriefInputSchema)
        .output(creativeBriefSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Batch: Check brief existence, validate team, and date range
        // This reduces connection usage by parallelizing independent checks
        const [existingBrief, teamRecord] = await Promise.all([
            db.query.creativeBrief.findFirst({
                where: and(eq(creativeBrief.id, input.id), eq(creativeBrief.userId, user.id)),
            }),
            // Only query team if teamId is provided
            input.teamId
                ? db.query.team.findFirst({
                    where: eq(team.id, input.teamId),
                })
                : Promise.resolve(null),
        ]);
        if (!existingBrief) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Creative brief not found",
            });
        }
        if (input.teamId && !teamRecord) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Team not found",
            });
        }
        // Validate date range (synchronous check, no DB query)
        const timelineStartDate = input.timelineStartDate ?? existingBrief.timelineStartDate;
        const timelineEndDate = input.timelineEndDate ?? existingBrief.timelineEndDate;
        if (timelineStartDate && timelineEndDate) {
            if (timelineEndDate < timelineStartDate) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "End date must be after start date",
                });
            }
        }
        // Batch: Update brief, handle reference images, and log activity in a transaction
        // This reduces connection usage from 3-4 sequential queries to 1 transaction
        const updatedBrief = await db.transaction(async (tx) => {
            // Update brief
            await tx.update(creativeBrief).set({
                ...(input.name !== undefined && { name: input.name }),
                ...(input.teamId !== undefined && { teamId: input.teamId ?? null }),
                ...(input.background !== undefined && { background: input.background }),
                ...(input.objectives !== undefined && { objectives: input.objectives }),
                ...(input.requirements !== undefined && { requirements: input.requirements }),
                ...(input.comments !== undefined && { comments: input.comments ?? null }),
                ...(input.timelineStartDate !== undefined && { timelineStartDate: input.timelineStartDate ?? null }),
                ...(input.timelineEndDate !== undefined && { timelineEndDate: input.timelineEndDate ?? null }),
                updatedAt: new Date(),
            }).where(eq(creativeBrief.id, input.id));
            // Handle reference images update
            if (input.referenceImages !== undefined) {
                // Delete existing reference images
                await tx
                    .delete(creativeBriefReferenceImage)
                    .where(eq(creativeBriefReferenceImage.creativeBriefId, input.id));
                // Create new reference images
                if (input.referenceImages.length > 0) {
                    await tx.insert(creativeBriefReferenceImage).values(input.referenceImages.map((img) => ({
                        id: crypto.randomUUID(),
                        creativeBriefId: input.id,
                        fileUrl: img.fileUrl,
                        fileKey: img.fileKey,
                        fileName: img.fileName,
                        fileSize: img.fileSize,
                        mimeType: img.mimeType,
                        fileMetadata: img.fileMetadata ?? null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })));
                }
            }
            // Log activity
            await tx.insert(creativeBriefActivityLog).values({
                id: crypto.randomUUID(),
                creativeBriefId: input.id,
                userId: user.id,
                action: "UPDATE",
                description: "Creative brief updated",
                comment: null,
                metadata: {
                    updatedFields: Object.keys(input).filter((key) => key !== "id" && key !== "referenceImages"),
                },
                ipAddress: null,
                userAgent: null,
                createdAt: new Date(),
            });
            // Reload brief with updated reference images and relations
            const reloadedBrief = await tx.query.creativeBrief.findFirst({
                where: eq(creativeBrief.id, input.id),
                with: {
                    user: true,
                    team: true,
                    approver: true,
                    referenceImages: {
                        orderBy: (ref, { asc }) => [asc(ref.createdAt)],
                    },
                },
            });
            if (!reloadedBrief) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to reload brief after update",
                });
            }
            return reloadedBrief;
        });
        return transformBrief(updatedBrief);
    }),
    // Update brief status (rejection/approval/needs-revision) with optional comment logged to activity
    updateStatus: protectedProcedure
        .input(z.object({
        id: z.string(),
        status: z.enum(["DRAFT", "REVIEWING", "APPROVED", "REJECTED"]),
        comment: z.string().optional(),
    }))
        .output(creativeBriefSchema)
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        const existingBrief = await db.query.creativeBrief.findFirst({
            where: and(eq(creativeBrief.id, input.id), eq(creativeBrief.userId, user.id)),
        });
        if (!existingBrief) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Creative brief not found",
            });
        }
        const updatedBrief = await db.transaction(async (tx) => {
            const updateData = {
                status: input.status,
                updatedAt: new Date(),
            };
            if (input.status === "APPROVED") {
                updateData.approvedBy = user.id;
                updateData.approvedAt = new Date();
                updateData.rejectedBy = null;
                updateData.rejectedAt = null;
            }
            else if (input.status === "REJECTED") {
                updateData.rejectedBy = user.id;
                updateData.rejectedAt = new Date();
                updateData.approvedBy = null;
                updateData.approvedAt = null;
            }
            await tx.update(creativeBrief).set(updateData).where(eq(creativeBrief.id, input.id));
            await tx.insert(creativeBriefActivityLog).values({
                id: crypto.randomUUID(),
                creativeBriefId: input.id,
                userId: user.id,
                action: "STATUS_CHANGE",
                description: `Status changed to ${input.status}${input.comment ? ": " + input.comment : ""}`,
                comment: input.comment ?? null,
                metadata: { previousStatus: existingBrief.status, newStatus: input.status },
                ipAddress: null,
                userAgent: null,
                createdAt: new Date(),
            });
            const reloaded = await tx.query.creativeBrief.findFirst({
                where: eq(creativeBrief.id, input.id),
                with: {
                    user: true,
                    team: true,
                    approver: true,
                    referenceImages: { orderBy: (ref, { asc }) => [asc(ref.createdAt)] },
                },
            });
            if (!reloaded)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Brief not found after update" });
            return reloaded;
        });
        return transformBrief(updatedBrief);
    }),
    // List users for approver combobox (all users in system)
    listUsersForApprover: protectedProcedure
        .output(z.array(z.object({ id: z.string(), name: z.string(), email: z.string() })))
        .query(async ({ ctx }) => {
        await getAuthenticatedUser(ctx);
        const users = await db
            .select({ id: user.id, name: user.name, email: user.email })
            .from(user)
            .orderBy(asc(user.name));
        return users;
    }),
    // Delete a creative brief
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
        const user = await getAuthenticatedUser(ctx);
        // Check if brief exists and user owns it
        const existingBrief = await db.query.creativeBrief.findFirst({
            where: and(eq(creativeBrief.id, input.id), eq(creativeBrief.userId, user.id)),
        });
        if (!existingBrief) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Creative brief not found",
            });
        }
        // Delete brief (cascade will delete reference images and activity logs)
        await db.delete(creativeBrief).where(eq(creativeBrief.id, input.id));
        // Log activity (before deletion, but activity log will be deleted by cascade)
        // We can log this in a separate table if needed, but for now we'll skip it
        // since the activity log will be deleted by cascade
        return { success: true };
    }),
});
