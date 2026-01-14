import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import prisma from "@nPanel/db";
import { randomUUID } from "node:crypto";
import {
  getAiGenerationsSchema,
  deleteAiGenerationSchema,
} from "./schemas";

export const imageGenAiGenerationsRouter = router({
  // List AI generations with pagination
  list: protectedProcedure
    .input(getAiGenerationsSchema)
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

      const generations = await prisma.imageGenAiGeneration.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          prompt: true,
          referenceImageUrls: true,
          imageUrl: true,
          imageFileName: true,
          imageSize: true,
          imageMimeType: true,
          imageMetadata: true,
          modelId: true,
          modelName: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        data: generations.map((gen) => ({
          ...gen,
          referenceImageUrls: gen.referenceImageUrls
            ? (JSON.parse(gen.referenceImageUrls as string) as string[])
            : [],
        })),
        nextPage: generations.length === limit ? page + 1 : null,
      };
    }),

  // Delete an AI generation
  delete: protectedProcedure
    .input(deleteAiGenerationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Note: Request headers are not available in tRPC context
      const ipAddress = undefined;
      const userAgent = undefined;

      // Check if user has access to this generation
      const existingGeneration = await prisma.imageGenAiGeneration.findFirst({
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

      if (!existingGeneration) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
      }

      // Create activity log before deletion
      await prisma.imageGenAiGenerationActivityLog.create({
        data: {
          id: randomUUID(),
          imageGenAiGenerationId: input.id,
          userId,
          action: "DELETE",
          description: `Deleted AI generation: ${existingGeneration.imageFileName}`,
          metadata: {
            prompt: existingGeneration.prompt,
            imageFileName: existingGeneration.imageFileName,
            imageKey: existingGeneration.imageKey,
          },
          ipAddress,
          userAgent,
          createdAt: new Date(),
        },
      });

      await prisma.imageGenAiGeneration.delete({
        where: { id: input.id },
      });

      return { data: { id: input.id } };
    }),
});
