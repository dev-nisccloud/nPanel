import { TRPCError } from "@trpc/server";
import { and, asc, eq, exists, isNull, or, desc } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@npanel/db";
import { emailBuilderDesign, emailBuilderDesignActivityLog, emailBuilderOperation, } from "@npanel/db/schema/email-builder-design";
import { teamMember } from "@npanel/db/schema/teams";
import { protectedProcedure, router } from "../trpc";
function isAgencySuperAdminRole(role) {
    return role === "AGENCY_SUPER_ADMIN";
}
function isAgencyUserRole(role) {
    return ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
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
const generateWithAiSchema = z.object({
    designId: z.string(),
    companyName: z.string().optional(),
    productName: z.string().optional(),
    audience: z.string().min(1, "Audience is required"),
    goal: z.string().min(1, "Goal is required"),
    tone: z.string().min(1, "Tone is required"),
    emailType: z.string().optional(),
    imageCount: z.number().min(0).max(5).default(1),
    brandColors: z.array(z.string()).optional(),
    instructions: z.string().optional(),
});
const getAiStatusSchema = z.object({
    designId: z.string(),
});
// New schemas for resilient operations
const saveDesignContentSchema = z.object({
    designId: z.string(),
    json: z.string().min(1, "Design data is required"),
    clientVersion: z.number().optional(),
});
const getOperationsSchema = z.object({
    designId: z.string(),
    status: z.enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
    limit: z.number().min(1).max(50).default(10),
});
const createOperationSchema = z.object({
    designId: z.string(),
    operationType: z.enum(["AUTO_SAVE", "AI_GENERATION", "IMAGE_UPLOAD"]),
    payload: z.any().optional(),
    status: z.enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
});
const getDesignHtmlSchema = z.object({
    designId: z.string(),
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
        const userRole = ctx.session?.user?.role;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        if (input.teamId && !isAgencyUserRole(userRole)) {
            const membership = await db.query.teamMember.findFirst({
                where: and(eq(teamMember.teamId, input.teamId), eq(teamMember.userId, userId)),
            });
            if (!membership) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team",
                });
            }
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
        const isAgencyUser = isAgencyUserRole(role);
        const design = await db.query.emailBuilderDesign.findFirst({
            where: (ebd) => isAgencyUser
                ? eq(ebd.id, input.id)
                : and(eq(ebd.id, input.id), or(eq(ebd.userId, userId), eq(ebd.isPublic, true), exists(db
                    .select()
                    .from(teamMember)
                    .where(and(eq(teamMember.teamId, ebd.teamId), eq(teamMember.userId, userId)))))),
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
        const isAgencyUser = isAgencyUserRole(role);
        const baseWhere = teamId
            ? isAgencyUser
                ? eq(emailBuilderDesign.teamId, teamId)
                : and(eq(emailBuilderDesign.teamId, teamId), exists(db
                    .select()
                    .from(teamMember)
                    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))))
            : isAgencyUser
                ? undefined
                : or(and(eq(emailBuilderDesign.userId, userId), isNull(emailBuilderDesign.teamId)), exists(db
                    .select()
                    .from(teamMember)
                    .where(and(eq(teamMember.teamId, emailBuilderDesign.teamId), eq(teamMember.userId, userId)))));
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
    // Update a design (legacy - use saveContent for better resilience)
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
            where: (ebd) => isAgencySuperAdminRole(userRole)
                ? eq(ebd.id, id)
                : and(eq(ebd.id, id), eq(ebd.userId, userId)),
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
            lastSavedAt: now,
            saveStatus: "SAVED",
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
    // Save design content immediately (like Zeepo message persistence)
    // This provides network interruption resilience
    saveContent: protectedProcedure
        .input(saveDesignContentSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const existingDesign = await db.query.emailBuilderDesign.findFirst({
            where: and(eq(emailBuilderDesign.id, input.designId), eq(emailBuilderDesign.userId, userId)),
        });
        if (!existingDesign) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Design not found" });
        }
        const now = new Date();
        const newVersion = (existingDesign.clientVersion || 0) + 1;
        // Create operation record for tracking
        const operationId = randomUUID();
        await db.insert(emailBuilderOperation).values({
            id: operationId,
            designId: input.designId,
            userId,
            teamId: existingDesign.teamId,
            operationType: "AUTO_SAVE",
            status: "PROCESSING",
            payload: { json: input.json },
            clientVersion: input.clientVersion,
            createdAt: now,
            startedAt: now,
        });
        try {
            // Immediate persistence to database
            const [design] = await db
                .update(emailBuilderDesign)
                .set({
                json: input.json,
                updatedAt: now,
                lastSavedAt: now,
                saveStatus: "SAVED",
                clientVersion: newVersion,
                lastSaveError: null,
            })
                .where(eq(emailBuilderDesign.id, input.designId))
                .returning();
            // Mark operation as completed
            await db
                .update(emailBuilderOperation)
                .set({
                status: "COMPLETED",
                completedAt: now,
                updatedAt: now,
            })
                .where(eq(emailBuilderOperation.id, operationId));
            return {
                success: true,
                data: design,
                operationId,
                version: newVersion,
            };
        }
        catch (error) {
            // Mark operation as failed
            await db
                .update(emailBuilderOperation)
                .set({
                status: "FAILED",
                errorMessage: error instanceof Error ? error.message : "Unknown error",
                completedAt: now,
                updatedAt: now,
            })
                .where(eq(emailBuilderOperation.id, operationId));
            // Update design with error state
            await db
                .update(emailBuilderDesign)
                .set({
                saveStatus: "SAVE_FAILED",
                lastSaveError: error instanceof Error ? error.message : "Unknown error",
                updatedAt: now,
            })
                .where(eq(emailBuilderDesign.id, input.designId));
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to save design",
                cause: error,
            });
        }
    }),
    // Get operations for a design (for debugging and status tracking)
    getOperations: protectedProcedure
        .input(getOperationsSchema)
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const conditions = [
            eq(emailBuilderOperation.designId, input.designId),
            eq(emailBuilderOperation.userId, userId),
        ];
        if (input.status) {
            conditions.push(eq(emailBuilderOperation.status, input.status));
        }
        const operations = await db.query.emailBuilderOperation.findMany({
            where: and(...conditions),
            orderBy: [desc(emailBuilderOperation.createdAt)],
            limit: input.limit,
        });
        return { data: operations };
    }),
    // Create/update an operation (for tracking uploads, exports, etc.)
    createOperation: protectedProcedure
        .input(createOperationSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        // Verify user has access to this design
        const design = await db.query.emailBuilderDesign.findFirst({
            where: and(eq(emailBuilderDesign.id, input.designId), eq(emailBuilderDesign.userId, userId)),
        });
        if (!design) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Design not found" });
        }
        const now = new Date();
        const operationId = randomUUID();
        const [operation] = await db.insert(emailBuilderOperation).values({
            id: operationId,
            designId: input.designId,
            userId,
            teamId: design.teamId,
            operationType: input.operationType,
            status: input.status || "QUEUED",
            payload: input.payload,
            createdAt: now,
            ...(input.status === "PROCESSING" ? { startedAt: now } : {}),
            ...(input.status === "COMPLETED" || input.status === "FAILED" ? { completedAt: now } : {}),
        }).returning();
        return { data: operation };
    }),
    // Get design HTML for client-side export
    getDesignHtml: protectedProcedure
        .input(getDesignHtmlSchema)
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        // Verify user has access to this design
        const design = await db.query.emailBuilderDesign.findFirst({
            where: and(eq(emailBuilderDesign.id, input.designId), eq(emailBuilderDesign.userId, userId)),
        });
        if (!design) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Design not found" });
        }
        return {
            success: true,
            data: {
                html: design.json, // Return the JSON/HTML content
                name: design.name,
            },
        };
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
            where: (ebd) => isAgencySuperAdminRole(userRole)
                ? eq(ebd.id, input.id)
                : and(eq(ebd.id, input.id), eq(ebd.userId, userId)),
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
            where: (ebd) => isAgencySuperAdminRole(userRole)
                ? eq(ebd.id, input.id)
                : and(eq(ebd.id, input.id), eq(ebd.userId, userId)),
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
    // Trigger AI generation
    generateWithAi: protectedProcedure
        .input(generateWithAiSchema)
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const design = await db.query.emailBuilderDesign.findFirst({
            where: and(eq(emailBuilderDesign.id, input.designId), eq(emailBuilderDesign.userId, userId)),
        });
        if (!design) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Design not found" });
        }
        const { designId, ...aiContext } = input;
        // Update design with AI context and status
        await db.update(emailBuilderDesign)
            .set({
            aiStatus: "PROCESSING",
            aiContext,
            updatedAt: new Date(),
        })
            .where(eq(emailBuilderDesign.id, designId));
        // Enqueue background job
        const { enqueueEmailBuilderAiGeneration } = await import("../lib/qstash/email-builder-ai");
        await enqueueEmailBuilderAiGeneration(designId);
        return { success: true };
    }),
    // Get AI status
    getAiStatus: protectedProcedure
        .input(getAiStatusSchema)
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const design = await db.query.emailBuilderDesign.findFirst({
            where: and(eq(emailBuilderDesign.id, input.designId), eq(emailBuilderDesign.userId, userId)),
            columns: {
                aiStatus: true,
                isAiGenerated: true,
            },
        });
        if (!design) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Design not found" });
        }
        return { data: design };
    }),
});
