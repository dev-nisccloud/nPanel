import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import prisma from "@npanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";

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
    // Create a new design
    create: protectedProcedure
        .input(createEmailBuilderDesignSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            const design = await prisma.emailBuilderDesign.create({
                data: {
                    id: randomUUID(),
                    name: input.name,
                    description: input.description,
                    json: input.json,
                    thumbnailUrl: input.thumbnailUrl,
                    isPublic: input.isPublic,
                    userId,
                    teamId: input.teamId ?? null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            // Log activity
            await prisma.emailBuilderDesignActivityLog.create({
                data: {
                    id: randomUUID(),
                    emailBuilderDesignId: design.id,
                    userId,
                    action: "CREATE",
                    description: "Created email design",
                    createdAt: new Date(),
                },
            });

            return { data: design };
        }),

    // Get a single design by ID
    get: protectedProcedure
        .input(getEmailBuilderDesignSchema)
        .query(async ({ ctx, input }) => {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            const design = await prisma.emailBuilderDesign.findFirst({
                where: {
                    id: input.id,
                    OR: [
                        { userId },
                        {
                            team: {
                                members: {
                                    some: { userId },
                                },
                            },
                        },
                        { isPublic: true },
                    ],
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            image: true,
                        }
                    }
                }
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
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            const { page, limit, teamId } = input;

            const where = teamId
                ? {
                    teamId,
                    team: {
                        members: {
                            some: { userId },
                        },
                    },
                }
                : {
                    userId,
                    teamId: null,
                };

            const designs = await prisma.emailBuilderDesign.findMany({
                where,
                take: limit,
                skip: (page - 1) * limit,
                orderBy: { updatedAt: "desc" },
                // We exclude 'json' from list view for performance, mirroring common patterns
                select: {
                    id: true,
                    name: true,
                    description: true,
                    thumbnailUrl: true,
                    isPublic: true,
                    createdAt: true,
                    updatedAt: true,
                    userId: true,
                    teamId: true,
                },
            });

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
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            const { id, ...updateData } = input;

            const existingDesign = await prisma.emailBuilderDesign.findFirst({
                where: {
                    id,
                    OR: [
                        { userId },
                        {
                            team: {
                                members: {
                                    some: { userId },
                                },
                            },
                        },
                    ],
                },
            });

            if (!existingDesign) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Design not found or access denied" });
            }

            const design = await prisma.emailBuilderDesign.update({
                where: { id },
                data: {
                    ...updateData,
                    updatedAt: new Date(),
                },
            });

            // Log activity
            await prisma.emailBuilderDesignActivityLog.create({
                data: {
                    id: randomUUID(),
                    emailBuilderDesignId: design.id,
                    userId,
                    action: "UPDATE",
                    description: "Updated email design",
                    createdAt: new Date(),
                },
            });

            return { data: design };
        }),

    // Delete a design
    delete: protectedProcedure
        .input(deleteEmailBuilderDesignSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            const existingDesign = await prisma.emailBuilderDesign.findFirst({
                where: {
                    id: input.id,
                    OR: [
                        { userId },
                        {
                            team: {
                                members: {
                                    some: { userId },
                                },
                            },
                        },
                    ],
                },
            });

            if (!existingDesign) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Design not found or access denied" });
            }

            await prisma.emailBuilderDesign.delete({
                where: { id: input.id },
            });

            return { data: { id: input.id } };
        }),

    // Duplicate a design
    duplicate: protectedProcedure
        .input(duplicateEmailBuilderDesignSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            const originalDesign = await prisma.emailBuilderDesign.findFirst({
                where: {
                    id: input.id,
                    OR: [
                        { userId },
                        {
                            team: {
                                members: {
                                    some: { userId },
                                },
                            },
                        },
                        { isPublic: true },
                    ],
                },
            });

            if (!originalDesign) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Design not found" });
            }

            const duplicatedDesign = await prisma.emailBuilderDesign.create({
                data: {
                    id: randomUUID(),
                    name: `Copy of ${originalDesign.name}`,
                    description: originalDesign.description,
                    json: originalDesign.json,
                    thumbnailUrl: originalDesign.thumbnailUrl,
                    isPublic: false, // Duplicates should probably be private by default
                    userId,
                    teamId: originalDesign.teamId, // Copy to same team if applicable? Or personal? Stick to user's context usually, but here matching orig is safe for now
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            // Log activity
            await prisma.emailBuilderDesignActivityLog.create({
                data: {
                    id: randomUUID(),
                    emailBuilderDesignId: duplicatedDesign.id,
                    userId,
                    action: "DUPLICATE",
                    description: `Duplicated from ${originalDesign.id}`,
                    createdAt: new Date(),
                },
            });

            return { data: duplicatedDesign };
        }),
});
