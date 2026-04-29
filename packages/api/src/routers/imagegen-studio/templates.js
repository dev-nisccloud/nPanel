import { TRPCError } from "@trpc/server";
import { and, desc, eq, or } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@npanel/db";
import { imageGenTemplate } from "@npanel/db/schema/imagegen-studio";
import { protectedProcedure, router } from "../../trpc";
import { createTemplateSchema, updateTemplateSchema, getTemplateSchema, getTemplatesSchema, deleteTemplateSchema, imageGenTemplateSchema, } from "./schemas";
const isAgencyUserRole = (role) => ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
const isAgencySuperAdminRole = (role) => role === "AGENCY_SUPER_ADMIN";
export const imageGenTemplatesRouter = router({
    create: protectedProcedure
        .input(createTemplateSchema)
        .output(z.object({ data: imageGenTemplateSchema }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const now = new Date();
        const id = randomUUID();
        await db.insert(imageGenTemplate).values({
            id,
            name: input.name,
            json: input.json,
            width: input.width,
            height: input.height,
            isPublic: input.isPublic,
            userId,
            thumbnailUrl: null,
            createdAt: now,
            updatedAt: now,
        });
        const template = await db.query.imageGenTemplate.findFirst({
            where: eq(imageGenTemplate.id, id),
        });
        if (!template) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create template",
            });
        }
        return { data: template };
    }),
    get: protectedProcedure
        .input(getTemplateSchema)
        .output(z.object({ data: imageGenTemplateSchema }))
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        const userRole = ctx.session?.user?.role;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const template = await db.query.imageGenTemplate.findFirst({
            where: and(eq(imageGenTemplate.id, input.id), isAgencyUserRole(userRole)
                ? eq(imageGenTemplate.id, input.id)
                : or(eq(imageGenTemplate.isPublic, true), eq(imageGenTemplate.userId, userId))),
        });
        if (!template) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
        }
        return { data: template };
    }),
    list: protectedProcedure
        .input(getTemplatesSchema)
        .output(z.object({ data: z.array(imageGenTemplateSchema) }))
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        const userRole = ctx.session?.user?.role;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const { page, limit } = input;
        const templates = await db
            .select({
            id: imageGenTemplate.id,
            name: imageGenTemplate.name,
            width: imageGenTemplate.width,
            height: imageGenTemplate.height,
            thumbnailUrl: imageGenTemplate.thumbnailUrl,
            json: imageGenTemplate.json,
            createdAt: imageGenTemplate.createdAt,
            updatedAt: imageGenTemplate.updatedAt,
            isPublic: imageGenTemplate.isPublic,
            userId: imageGenTemplate.userId,
        })
            .from(imageGenTemplate)
            .where(isAgencyUserRole(userRole)
            ? undefined
            : eq(imageGenTemplate.isPublic, true))
            .orderBy(desc(imageGenTemplate.updatedAt))
            .limit(limit)
            .offset((page - 1) * limit);
        return { data: templates };
    }),
    update: protectedProcedure
        .input(updateTemplateSchema)
        .output(z.object({ data: imageGenTemplateSchema }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        const userRole = ctx.session?.user?.role;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const { id, ...updateData } = input;
        const existingTemplate = await db.query.imageGenTemplate.findFirst({
            where: eq(imageGenTemplate.id, id),
        });
        if (!existingTemplate) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Template not found or you don't have permission to update it",
            });
        }
        if (!isAgencySuperAdminRole(userRole) && existingTemplate.userId !== userId) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only the template owner can update it",
            });
        }
        await db
            .update(imageGenTemplate)
            .set({
            ...updateData,
            updatedAt: new Date(),
        })
            .where(eq(imageGenTemplate.id, id));
        const template = await db.query.imageGenTemplate.findFirst({
            where: eq(imageGenTemplate.id, id),
        });
        if (!template) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
        }
        return { data: template };
    }),
    delete: protectedProcedure
        .input(deleteTemplateSchema)
        .output(z.object({ data: z.object({ id: z.string() }) }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        const userRole = ctx.session?.user?.role;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const existingTemplate = await db.query.imageGenTemplate.findFirst({
            where: eq(imageGenTemplate.id, input.id),
        });
        if (!existingTemplate) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Template not found or you don't have permission to delete it",
            });
        }
        if (!isAgencySuperAdminRole(userRole) && existingTemplate.userId !== userId) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only the template owner can delete it",
            });
        }
        await db.delete(imageGenTemplate).where(eq(imageGenTemplate.id, input.id));
        return { data: { id: input.id } };
    }),
});
