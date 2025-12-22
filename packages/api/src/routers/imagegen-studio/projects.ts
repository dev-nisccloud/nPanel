import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import prisma from "@nPanel/db";
import { randomUUID } from "node:crypto";
import {
  createProjectSchema,
  updateProjectSchema,
  getProjectSchema,
  getProjectsSchema,
  deleteProjectSchema,
  duplicateProjectSchema,
} from "./schemas";

export const imageGenProjectsRouter = router({
  // Create a new project
  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const project = await prisma.imageGenProject.create({
        data: {
          id: randomUUID(),
          name: input.name,
          json: input.json,
          width: input.width,
          height: input.height,
          userId,
          teamId: input.teamId ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return { data: project };
    }),

  // Get a single project by ID
  get: protectedProcedure
    .input(getProjectSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const project = await prisma.imageGenProject.findFirst({
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

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      return { data: project };
    }),

  // List projects with pagination
  list: protectedProcedure
    .input(getProjectsSchema)
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

      const projects = await prisma.imageGenProject.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { updatedAt: "desc" },
      });

      return {
        data: projects,
        nextPage: projects.length === limit ? page + 1 : null,
      };
    }),

  // Update a project
  update: protectedProcedure
    .input(updateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { id, ...updateData } = input;

      // Check if user has access to this project
      const existingProject = await prisma.imageGenProject.findFirst({
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

      if (!existingProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const project = await prisma.imageGenProject.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      return { data: project };
    }),

  // Delete a project
  delete: protectedProcedure
    .input(deleteProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user has access to this project
      const existingProject = await prisma.imageGenProject.findFirst({
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

      if (!existingProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      await prisma.imageGenProject.delete({
        where: { id: input.id },
      });

      return { data: { id: input.id } };
    }),

  // Duplicate a project
  duplicate: protectedProcedure
    .input(duplicateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Find the original project
      const originalProject = await prisma.imageGenProject.findFirst({
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

      if (!originalProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Create a duplicate
      const duplicatedProject = await prisma.imageGenProject.create({
        data: {
          id: randomUUID(),
          name: `Copy of ${originalProject.name}`,
          json: originalProject.json,
          width: originalProject.width,
          height: originalProject.height,
          userId,
          teamId: originalProject.teamId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return { data: duplicatedProject };
    }),
});


