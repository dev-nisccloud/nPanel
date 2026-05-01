import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@npanel/db";
import { zeepoCanvasProject, zeepoCanvasActivityLog } from "@npanel/db/schema/zeepo-canvas";
import { protectedProcedure, router } from "../../trpc";
import {
  createProjectSchema,
  updateProjectSchema,
  getProjectSchema,
  getProjectsSchema,
  deleteProjectSchema,
  duplicateProjectSchema,
  zeepoCanvasProjectSchema,
} from "./schemas";
import { getUserTeamIds, orUserOrTeamMember, personalScope } from "../imagegen-studio/team-scope";

const isAgencyUserRole = (role: string | null | undefined) =>
  ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

const isAgencySuperAdminRole = (role: string | null | undefined) =>
  role === "AGENCY_SUPER_ADMIN";

export const zeepoCanvasProjectsRouter = router({
  create: protectedProcedure
    .input(createProjectSchema)
    .output(z.object({ data: zeepoCanvasProjectSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      if (input.teamId && !isAgencyUserRole(userRole)) {
        const userTeamIds = await getUserTeamIds(userId);
        if (!userTeamIds.includes(input.teamId)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this team" });
        }
      }

      const now = new Date();
      const id = randomUUID();
      await db.insert(zeepoCanvasProject).values({
        id,
        name: input.name,
        canvasJson: input.canvasJson ?? { nodes: [], edges: [] },
        width: input.width,
        height: input.height,
        userId,
        teamId: input.teamId ?? null,
        thumbnailUrl: null,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(zeepoCanvasActivityLog).values({
        id: randomUUID(),
        projectId: id,
        userId,
        action: "CREATE",
        description: `Created canvas project: ${input.name}`,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.req.header("user-agent") ?? null,
      });

      const project = await db.query.zeepoCanvasProject.findFirst({
        where: eq(zeepoCanvasProject.id, id),
      });
      if (!project) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create canvas project",
        });
      }

      return { data: project as any };
    }),

  get: protectedProcedure
    .input(getProjectSchema)
    .output(z.object({ data: zeepoCanvasProjectSchema }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const userTeamIds = await getUserTeamIds(userId);
      const project = await db.query.zeepoCanvasProject.findFirst({
        where: isAgencyUserRole(userRole)
          ? eq(zeepoCanvasProject.id, input.id)
          : and(
              eq(zeepoCanvasProject.id, input.id),
              orUserOrTeamMember(
                zeepoCanvasProject.userId,
                zeepoCanvasProject.teamId,
                userId,
                userTeamIds,
              ),
            ),
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Canvas project not found" });
      }

      return { data: project as any };
    }),

  list: protectedProcedure
    .input(getProjectsSchema)
    .output(
      z.object({
        data: z.array(zeepoCanvasProjectSchema.omit({ canvasJson: true })),
        nextPage: z.number().int().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { page, limit, teamId } = input;
      const userTeamIds = await getUserTeamIds(userId);

      let whereCond;
      if (teamId) {
        if (isAgencyUserRole(userRole)) {
          whereCond = eq(zeepoCanvasProject.teamId, teamId);
        } else {
          if (!userTeamIds.includes(teamId)) {
            return { data: [], nextPage: null };
          }
          whereCond = eq(zeepoCanvasProject.teamId, teamId);
        }
      } else if (isAgencyUserRole(userRole)) {
        whereCond = undefined;
      } else {
        whereCond = personalScope(zeepoCanvasProject.userId, zeepoCanvasProject.teamId, userId);
      }

      const projects = await db
        .select({
          id: zeepoCanvasProject.id,
          name: zeepoCanvasProject.name,
          width: zeepoCanvasProject.width,
          height: zeepoCanvasProject.height,
          thumbnailUrl: zeepoCanvasProject.thumbnailUrl,
          createdAt: zeepoCanvasProject.createdAt,
          updatedAt: zeepoCanvasProject.updatedAt,
          userId: zeepoCanvasProject.userId,
          teamId: zeepoCanvasProject.teamId,
        })
        .from(zeepoCanvasProject)
        .where(whereCond ?? undefined)
        .orderBy(desc(zeepoCanvasProject.updatedAt))
        .limit(limit)
        .offset((page - 1) * limit);

      return {
        data: projects as any[],
        nextPage: projects.length === limit ? page + 1 : null,
      };
    }),

  update: protectedProcedure
    .input(updateProjectSchema)
    .output(z.object({ data: zeepoCanvasProjectSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { id, ...updateData } = input;
      const existingProject = await db.query.zeepoCanvasProject.findFirst({
        where: eq(zeepoCanvasProject.id, id),
      });

      if (!existingProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Canvas project not found" });
      }
      if (!isAgencySuperAdminRole(userRole) && existingProject.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can update it" });
      }

      await db
        .update(zeepoCanvasProject)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(zeepoCanvasProject.id, id));

      const project = await db.query.zeepoCanvasProject.findFirst({
        where: eq(zeepoCanvasProject.id, id),
      });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Canvas project not found" });
      }

      return { data: project as any };
    }),

  delete: protectedProcedure
    .input(deleteProjectSchema)
    .output(z.object({ data: z.object({ id: z.string() }) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const existingProject = await db.query.zeepoCanvasProject.findFirst({
        where: eq(zeepoCanvasProject.id, input.id),
      });

      if (!existingProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Canvas project not found" });
      }
      if (!isAgencySuperAdminRole(userRole) && existingProject.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can delete it" });
      }

      await db.delete(zeepoCanvasProject).where(eq(zeepoCanvasProject.id, input.id));

      return { data: { id: input.id } };
    }),

  duplicate: protectedProcedure
    .input(duplicateProjectSchema)
    .output(z.object({ data: zeepoCanvasProjectSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const userTeamIds = await getUserTeamIds(userId);
      const originalProject = await db.query.zeepoCanvasProject.findFirst({
        where: isAgencyUserRole(userRole)
          ? eq(zeepoCanvasProject.id, input.id)
          : and(
              eq(zeepoCanvasProject.id, input.id),
              orUserOrTeamMember(
                zeepoCanvasProject.userId,
                zeepoCanvasProject.teamId,
                userId,
                userTeamIds,
              ),
            ),
      });

      if (!originalProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Canvas project not found" });
      }

      const now = new Date();
      const newId = randomUUID();
      await db.insert(zeepoCanvasProject).values({
        id: newId,
        name: `Copy of ${originalProject.name}`,
        canvasJson: originalProject.canvasJson,
        width: originalProject.width,
        height: originalProject.height,
        userId,
        teamId: originalProject.teamId,
        thumbnailUrl: originalProject.thumbnailUrl,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(zeepoCanvasActivityLog).values({
        id: randomUUID(),
        projectId: newId,
        userId,
        action: "CREATE",
        description: `Duplicated canvas project from: ${originalProject.name}`,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.req.header("user-agent") ?? null,
      });

      const duplicatedProject = await db.query.zeepoCanvasProject.findFirst({
        where: eq(zeepoCanvasProject.id, newId),
      });
      if (!duplicatedProject) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to duplicate project",
        });
      }

      return { data: duplicatedProject as any };
    }),
});
