import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import prisma from "@nPanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  createUploadSchema,
  getUploadsSchema,
  deleteUploadSchema,
  getUploadsResponseSchema,
  imageGenUploadSchema,
} from "./schemas";

/**
 * Transform function to ensure clean data (no Prisma types leak)
 * Converts Prisma types to plain types for API layer
 */
function transformUpload(upload: any): z.infer<typeof imageGenUploadSchema> {
  return {
    id: upload.id,
    fileUrl: upload.fileUrl,
    fileName: upload.fileName,
    fileSize: upload.fileSize,
    mimeType: upload.mimeType,
    fileMetadata: upload.fileMetadata ?? null,
    createdAt: upload.createdAt,
    updatedAt: upload.updatedAt,
  };
}

export const imageGenUploadsRouter = router({
  // Create a new upload
  create: protectedProcedure
    .input(createUploadSchema)
    .output(z.object({ data: imageGenUploadSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Verify mimeType is an image
      if (!input.mimeType.startsWith("image/")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only image files are allowed",
        });
      }

      const upload = await prisma.imageGenUpload.create({
        data: {
          id: randomUUID(),
          userId,
          teamId: input.teamId ?? null,
          fileUrl: input.fileUrl,
          fileKey: input.fileKey,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          fileMetadata: input.fileMetadata ?? undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create activity log
      await prisma.imageGenUploadActivityLog.create({
        data: {
          id: randomUUID(),
          imageGenUploadId: upload.id,
          userId,
          action: "UPLOAD",
          description: `Uploaded image: ${input.fileName}`,
          metadata: {
            fileName: input.fileName,
            fileSize: input.fileSize,
            mimeType: input.mimeType,
          },
          createdAt: new Date(),
        },
      });

      return { data: transformUpload(upload) };
    }),

  // List uploads with pagination
  list: protectedProcedure
    .input(getUploadsSchema)
    .output(getUploadsResponseSchema)
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

      const uploads = await prisma.imageGenUpload.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fileUrl: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          fileMetadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Transform Prisma data to clean API response
      return {
        data: uploads.map(transformUpload),
        nextPage: uploads.length === limit ? page + 1 : null,
      };
    }),

  // Delete an upload
  delete: protectedProcedure
    .input(deleteUploadSchema)
    .output(z.object({ data: z.object({ id: z.string() }) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user has access to this upload
      const existingUpload = await prisma.imageGenUpload.findFirst({
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

      if (!existingUpload) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Upload not found" });
      }

      // Create activity log before deletion
      await prisma.imageGenUploadActivityLog.create({
        data: {
          id: randomUUID(),
          imageGenUploadId: input.id,
          userId,
          action: "DELETE",
          description: `Deleted upload: ${existingUpload.fileName}`,
          metadata: {
            fileName: existingUpload.fileName,
            fileKey: existingUpload.fileKey,
          },
          createdAt: new Date(),
        },
      });

      await prisma.imageGenUpload.delete({
        where: { id: input.id },
      });

      return { data: { id: input.id } };
    }),
});
