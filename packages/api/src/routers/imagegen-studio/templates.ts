import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import prisma from "@nPanel/db";
import { randomUUID } from "node:crypto";
import {
  createTemplateSchema,
  updateTemplateSchema,
  getTemplateSchema,
  getTemplatesSchema,
  deleteTemplateSchema,
} from "./schemas";

export const imageGenTemplatesRouter = router({
  // Create a new template
  create: protectedProcedure
    .input(createTemplateSchema)
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

      return { data: template };
    }),

  // Get a single template by ID
  get: protectedProcedure
    .input(getTemplateSchema)
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

      return { data: template };
    }),

  // List public templates with pagination
  list: protectedProcedure
    .input(getTemplatesSchema)
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
      });

      return { data: templates };
    }),

  // Update a template (only owner can update)
  update: protectedProcedure
    .input(updateTemplateSchema)
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

      return { data: template };
    }),

  // Delete a template (only owner can delete)
  delete: protectedProcedure
    .input(deleteTemplateSchema)
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


