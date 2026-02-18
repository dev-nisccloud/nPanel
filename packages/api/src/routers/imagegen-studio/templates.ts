import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import prisma from "@nPanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  createTemplateSchema,
  updateTemplateSchema,
  getTemplateSchema,
  getTemplatesSchema,
  deleteTemplateSchema,
  imageGenTemplateSchema,
} from "./schemas";

export const imageGenTemplatesRouter = router({
  // Create a new template
  create: protectedProcedure
    .input(createTemplateSchema)
    .output(z.object({ data: imageGenTemplateSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const template = await prisma.imageGenTemplate.create({
        data: {
          id: randomUUID(),
          name: input.name,
          json: input.json,
          width: input.width,
          height: input.height,
          isPublic: input.isPublic,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return { data: template as any };
    }),

  // Get a single template by ID
  get: protectedProcedure
    .input(getTemplateSchema)
    .output(z.object({ data: imageGenTemplateSchema }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const template = await prisma.imageGenTemplate.findFirst({
        where: {
          id: input.id,
          OR: [{ isPublic: true }, { userId }],
        },
      });

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      return { data: template as any };
    }),

  // List public templates with pagination
  list: protectedProcedure
    .input(getTemplatesSchema)
    .output(z.object({ data: z.array(imageGenTemplateSchema) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { page, limit } = input;

      const templates = await prisma.imageGenTemplate.findMany({
        where: {
          isPublic: true,
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          width: true,
          height: true,
          thumbnailUrl: true,
          json: true, // Keep json for templates as it's needed when creating a project from template
          createdAt: true,
          updatedAt: true,
          isPublic: true,
          userId: true,
        },
      });

      return { data: templates as any[] };
    }),

  // Update a template (only owner can update)
  update: protectedProcedure
    .input(updateTemplateSchema)
    .output(z.object({ data: imageGenTemplateSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { id, ...updateData } = input;

      // Check if user owns this template
      const existingTemplate = await prisma.imageGenTemplate.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingTemplate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found or you don't have permission to update it",
        });
      }

      const template = await prisma.imageGenTemplate.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      return { data: template as any };
    }),

  // Delete a template (only owner can delete)
  delete: protectedProcedure
    .input(deleteTemplateSchema)
    .output(z.object({ data: z.object({ id: z.string() }) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user owns this template
      const existingTemplate = await prisma.imageGenTemplate.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!existingTemplate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found or you don't have permission to delete it",
        });
      }

      await prisma.imageGenTemplate.delete({
        where: { id: input.id },
      });

      return { data: { id: input.id } };
    }),
});


