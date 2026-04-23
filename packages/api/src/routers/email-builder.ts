import { TRPCError } from "@trpc/server";
import { and, asc, eq, exists, isNull, or } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { db } from "@npanel/db";
import {
  emailBuilderDesign,
  emailBuilderDesignActivityLog,
} from "@npanel/db/schema/email-builder-design";
import { teamMember } from "@npanel/db/schema/teams";
import { protectedProcedure, router } from "../trpc";

function isAgencySuperAdminRole(role: string | null | undefined): boolean {
    return role === "AGENCY_SUPER_ADMIN";
}

// --- Independent UI/API Schemas ---

const createEmailBuilderDesignSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    json: z.string().min(1, "Design data is required"), // JSON string
    thumbnailUrl: z.string().optional(),
    isPublic: z.boolean().default(false),
    teamId: z.string().optional(),
});

const updateEmailBuilderDesignSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    json: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    isPublic: z.boolean().optional(),
});

const getEmailBuilderDesignSchema = z.object({
    id: z.string(),
});

const getEmailBuilderDesignsSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    teamId: z.string().optional(), // Filter by team
});

const deleteEmailBuilderDesignSchema = z.object({
    id: z.string(),
});

const duplicateEmailBuilderDesignSchema = z.object({
    id: z.string(),
});

// --- Router ---

export const emailBuilderRouter = router({
    // Role helper for agency-side broad read access.
    // Agency users can read globally; mutations stay creator-only.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    
    // Create a new design
    create: protectedProcedure
        .input(createEmailBuilderDesignSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            const now = new Date();

            const [design] = await db.insert(emailBuilderDesign).values({
                id: randomUUID(),
                name: input.name,
                description: input.description ?? null,
                json: input.json,
                thumbnailUrl: input.thumbnailUrl ?? null,
                isPublic: input.isPublic,
                userId,
                teamId: input.teamId ?? null,
                createdAt: now,
                updatedAt: now,
            }).returning();

            if (!design) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create design",
                });
            }

            // Log activity
            await db.insert(emailBuilderDesignActivityLog).values({
                id: randomUUID(),
                emailBuilderDesignId: design.id,
                userId,
                action: "CREATE",
                description: "Created email design",
                createdAt: now,
            });

            return { data: design };
        }),

    // Get a single design by ID
    get: protectedProcedure
        .input(getEmailBuilderDesignSchema)
        .query(async ({ ctx, input }) => {
            const userId = ctx.session?.user?.id;
            const role = ctx.session?.user?.role;
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            const isAgencyUser = ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
            const design = await db.query.emailBuilderDesign.findFirst({
                where: (ebd) =>
                    isAgencyUser
                        ? eq(ebd.id, input.id)
                        : and(
                            eq(ebd.id, input.id),
                            or(
                                eq(ebd.userId, userId),
                                eq(ebd.isPublic, true),
                                or(
                                    isNull(ebd.teamId),
                                    exists(
                                        db
                                            .select()
                                            .from(teamMember)
                                            .where(
                                                and(
                                                    eq(teamMember.teamId, ebd.teamId),
                                                    eq(teamMember.userId, userId),
                                                ),
                                            ),
                                    ),
                                ),
                            ),
                        ),
            });

            if (!design) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Design not found" });
            }

            return { data: design };
        }),

    // List designs with pagination
    list: protectedProcedure
        .input(getEmailBuilderDesignsSchema)
        .query(async ({ ctx, input }) => {
            const userId = ctx.session?.user?.id;
            const role = ctx.session?.user?.role;
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            const { page, limit, teamId } = input;
            const isAgencyUser = ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

            const baseWhere = teamId
                ? isAgencyUser
                    ? eq(emailBuilderDesign.teamId, teamId)
                    : and(
                        eq(emailBuilderDesign.teamId, teamId),
                        exists(
                            db
                                .select()
                                .from(teamMember)
                                .where(
                                    and(
                                        eq(teamMember.teamId, teamId),
                                        eq(teamMember.userId, userId),
                                    ),
                                ),
                        ),
                    )
                : isAgencyUser
                    ? undefined
                    : and(
                        eq(emailBuilderDesign.userId, userId),
                        isNull(emailBuilderDesign.teamId),
                    );

            const designs = await db
                .select({
                    id: emailBuilderDesign.id,
                    name: emailBuilderDesign.name,
                    description: emailBuilderDesign.description,
                    thumbnailUrl: emailBuilderDesign.thumbnailUrl,
                    isPublic: emailBuilderDesign.isPublic,
                    createdAt: emailBuilderDesign.createdAt,
                    updatedAt: emailBuilderDesign.updatedAt,
                    userId: emailBuilderDesign.userId,
                    teamId: emailBuilderDesign.teamId,
                })
                .from(emailBuilderDesign)
                .where(baseWhere ?? undefined)
                .orderBy(asc(emailBuilderDesign.updatedAt))
                .limit(limit)
                .offset((page - 1) * limit);

            return {
                data: designs,
                nextPage: designs.length === limit ? page + 1 : null,
            };
        }),

    // Update a design
    update: protectedProcedure
        .input(updateEmailBuilderDesignSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session?.user?.id;
            const userRole = ctx.session?.user?.role;
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            const { id, ...updateData } = input;

            const existingDesign = await db.query.emailBuilderDesign.findFirst({
                where: (ebd) =>
                    isAgencySuperAdminRole(userRole)
                        ? eq(ebd.id, id)
                        : and(
                            eq(ebd.id, id),
                            eq(ebd.userId, userId),
                        ),
            });

            if (!existingDesign) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Design not found or access denied" });
            }

            const now = new Date();

            const [design] = await db
                .update(emailBuilderDesign)
                .set({
                    ...updateData,
                    updatedAt: now,
                })
                .where(eq(emailBuilderDesign.id, id))
                .returning();

            if (!design) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to update design",
                });
            }

            // Log activity
            await db.insert(emailBuilderDesignActivityLog).values({
                id: randomUUID(),
                emailBuilderDesignId: design.id,
                userId,
                action: "UPDATE",
                description: "Updated email design",
                createdAt: now,
            });

            return { data: design };
        }),

    // Delete a design
    delete: protectedProcedure
        .input(deleteEmailBuilderDesignSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session?.user?.id;
            const userRole = ctx.session?.user?.role;
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            const existingDesign = await db.query.emailBuilderDesign.findFirst({
                where: (ebd) =>
                    isAgencySuperAdminRole(userRole)
                        ? eq(ebd.id, input.id)
                        : and(
                            eq(ebd.id, input.id),
                            eq(ebd.userId, userId),
                        ),
            });

            if (!existingDesign) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Design not found or access denied" });
            }

            await db
                .delete(emailBuilderDesign)
                .where(eq(emailBuilderDesign.id, input.id));

            return { data: { id: input.id } };
        }),

    // Duplicate a design
    duplicate: protectedProcedure
        .input(duplicateEmailBuilderDesignSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session?.user?.id;
            const userRole = ctx.session?.user?.role;
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            const originalDesign = await db.query.emailBuilderDesign.findFirst({
                where: (ebd) =>
                    isAgencySuperAdminRole(userRole)
                        ? eq(ebd.id, input.id)
                        : and(
                            eq(ebd.id, input.id),
                            eq(ebd.userId, userId),
                        ),
            });

            if (!originalDesign) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Design not found" });
            }

            const now = new Date();

            const [duplicatedDesign] = await db.insert(emailBuilderDesign).values({
                id: randomUUID(),
                name: `Copy of ${originalDesign.name}`,
                description: originalDesign.description,
                json: originalDesign.json,
                thumbnailUrl: originalDesign.thumbnailUrl,
                isPublic: false,
                userId,
                teamId: originalDesign.teamId,
                createdAt: now,
                updatedAt: now,
            }).returning();

            if (!duplicatedDesign) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to duplicate design",
                });
            }

            // Log activity
            await db.insert(emailBuilderDesignActivityLog).values({
                id: randomUUID(),
                emailBuilderDesignId: duplicatedDesign.id,
                userId,
                action: "DUPLICATE",
                description: `Duplicated from ${originalDesign.id}`,
                createdAt: now,
            });

            return { data: duplicatedDesign };
        }),
});
