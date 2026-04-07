import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@npanel/db";
import { imageGenProject } from "@npanel/db/schema/imagegen-studio";
import { protectedProcedure, router } from "../../trpc";
import { createProjectSchema, updateProjectSchema, getProjectSchema, getProjectsSchema, deleteProjectSchema, duplicateProjectSchema, imageGenProjectSchema, } from "./schemas";
import { getUserTeamIds, orUserOrTeamMember, personalScope } from "./team-scope";
export const imageGenProjectsRouter = router({
    create: protectedProcedure
        .input(createProjectSchema)
        .output(z.object({ data: imageGenProjectSchema }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const now = new Date();
        const id = randomUUID();
        await db.insert(imageGenProject).values({
            id,
            name: input.name,
            json: input.json,
            width: input.width,
            height: input.height,
            userId,
            teamId: input.teamId ?? null,
            thumbnailUrl: null,
            createdAt: now,
            updatedAt: now,
        });
        const project = await db.query.imageGenProject.findFirst({
            where: eq(imageGenProject.id, id),
        });
        if (!project) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create project",
            });
        }
        return { data: project };
    }),
    get: protectedProcedure
        .input(getProjectSchema)
        .output(z.object({ data: imageGenProjectSchema }))
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const userTeamIds = await getUserTeamIds(userId);
        const project = await db.query.imageGenProject.findFirst({
            where: and(eq(imageGenProject.id, input.id), orUserOrTeamMember(imageGenProject.userId, imageGenProject.teamId, userId, userTeamIds)),
        });
        if (!project) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        return { data: project };
    }),
    list: protectedProcedure
        .input(getProjectsSchema)
        .output(z.object({
        data: z.array(imageGenProjectSchema.omit({ json: true })),
        nextPage: z.number().int().nullable(),
    }))
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const { page, limit, teamId } = input;
        const userTeamIds = await getUserTeamIds(userId);
        let whereCond;
        if (teamId) {
            if (!userTeamIds.includes(teamId)) {
                return { data: [], nextPage: null };
            }
            whereCond = eq(imageGenProject.teamId, teamId);
        }
        else {
            whereCond = personalScope(imageGenProject.userId, imageGenProject.teamId, userId);
        }
        const projects = await db
            .select({
            id: imageGenProject.id,
            name: imageGenProject.name,
            width: imageGenProject.width,
            height: imageGenProject.height,
            thumbnailUrl: imageGenProject.thumbnailUrl,
            createdAt: imageGenProject.createdAt,
            updatedAt: imageGenProject.updatedAt,
            userId: imageGenProject.userId,
            teamId: imageGenProject.teamId,
        })
            .from(imageGenProject)
            .where(whereCond)
            .orderBy(desc(imageGenProject.updatedAt))
            .limit(limit)
            .offset((page - 1) * limit);
        return {
            data: projects,
            nextPage: projects.length === limit ? page + 1 : null,
        };
    }),
    update: protectedProcedure
        .input(updateProjectSchema)
        .output(z.object({ data: imageGenProjectSchema }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const { id, ...updateData } = input;
        const userTeamIds = await getUserTeamIds(userId);
        const existingProject = await db.query.imageGenProject.findFirst({
            where: and(eq(imageGenProject.id, id), orUserOrTeamMember(imageGenProject.userId, imageGenProject.teamId, userId, userTeamIds)),
        });
        if (!existingProject) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        await db
            .update(imageGenProject)
            .set({
            ...updateData,
            updatedAt: new Date(),
        })
            .where(eq(imageGenProject.id, id));
        const project = await db.query.imageGenProject.findFirst({
            where: eq(imageGenProject.id, id),
        });
        if (!project) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        return { data: project };
    }),
    delete: protectedProcedure
        .input(deleteProjectSchema)
        .output(z.object({ data: z.object({ id: z.string() }) }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const userTeamIds = await getUserTeamIds(userId);
        const existingProject = await db.query.imageGenProject.findFirst({
            where: and(eq(imageGenProject.id, input.id), orUserOrTeamMember(imageGenProject.userId, imageGenProject.teamId, userId, userTeamIds)),
        });
        if (!existingProject) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        await db.delete(imageGenProject).where(eq(imageGenProject.id, input.id));
        return { data: { id: input.id } };
    }),
    duplicate: protectedProcedure
        .input(duplicateProjectSchema)
        .output(z.object({ data: imageGenProjectSchema }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const userTeamIds = await getUserTeamIds(userId);
        const originalProject = await db.query.imageGenProject.findFirst({
            where: and(eq(imageGenProject.id, input.id), orUserOrTeamMember(imageGenProject.userId, imageGenProject.teamId, userId, userTeamIds)),
        });
        if (!originalProject) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        const now = new Date();
        const newId = randomUUID();
        await db.insert(imageGenProject).values({
            id: newId,
            name: `Copy of ${originalProject.name}`,
            json: originalProject.json,
            width: originalProject.width,
            height: originalProject.height,
            userId,
            teamId: originalProject.teamId,
            thumbnailUrl: originalProject.thumbnailUrl,
            createdAt: now,
            updatedAt: now,
        });
        const duplicatedProject = await db.query.imageGenProject.findFirst({
            where: eq(imageGenProject.id, newId),
        });
        if (!duplicatedProject) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to duplicate project",
            });
        }
        return { data: duplicatedProject };
    }),
});
