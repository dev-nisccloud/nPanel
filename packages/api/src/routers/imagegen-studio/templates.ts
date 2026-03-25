import { TRPCError } from "@trpc/server";
import { and, desc, eq, or } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@npanel/db";
import { imageGenTemplate } from "@npanel/db/schema/imagegen-studio";
import { protectedProcedure, router } from "../../trpc";
import {
  createTemplateSchema,
  updateTemplateSchema,
  getTemplateSchema,
  getTemplatesSchema,
  deleteTemplateSchema,
  imageGenTemplateSchema,
} from "./schemas";

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

      return { data: template as any };
    }),

  get: protectedProcedure
    .input(getTemplateSchema)
    .output(z.object({ data: imageGenTemplateSchema }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const template = await db.query.imageGenTemplate.findFirst({
        where: and(
          eq(imageGenTemplate.id, input.id),
          or(eq(imageGenTemplate.isPublic, true), eq(imageGenTemplate.userId, userId)),
        ),
      });

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      return { data: template as any };
    }),

  list: protectedProcedure
    .input(getTemplatesSchema)
    .output(z.object({ data: z.array(imageGenTemplateSchema) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
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
        .where(eq(imageGenTemplate.isPublic, true))
        .orderBy(desc(imageGenTemplate.updatedAt))
        .limit(limit)
        .offset((page - 1) * limit);

      return { data: templates as any[] };
    }),

  update: protectedProcedure
    .input(updateTemplateSchema)
    .output(z.object({ data: imageGenTemplateSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { id, ...updateData } = input;

      const existingTemplate = await db.query.imageGenTemplate.findFirst({
        where: and(eq(imageGenTemplate.id, id), eq(imageGenTemplate.userId, userId)),
      });

      if (!existingTemplate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found or you don't have permission to update it",
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

      return { data: template as any };
    }),

  delete: protectedProcedure
    .input(deleteTemplateSchema)
    .output(z.object({ data: z.object({ id: z.string() }) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const existingTemplate = await db.query.imageGenTemplate.findFirst({
        where: and(
          eq(imageGenTemplate.id, input.id),
          eq(imageGenTemplate.userId, userId),
        ),
      });

      if (!existingTemplate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found or you don't have permission to delete it",
        });
      }

      await db.delete(imageGenTemplate).where(eq(imageGenTemplate.id, input.id));

      return { data: { id: input.id } };
    }),
});
