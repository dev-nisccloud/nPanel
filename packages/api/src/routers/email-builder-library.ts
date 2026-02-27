import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import prisma from "@nPanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";

// --- Zod Schemas (independent from Prisma) ---

const emailBuilderLibraryItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  teamId: z.string().nullable(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  fileUrl: z.string().url(),
  storageKey: z.string().nullable(),
  description: z.string().nullable(),
  metadata: z.unknown().nullable(),
  createdAt: z.date(),
});

const createFromUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().min(0),
  mimeType: z.string().min(1),
  fileUrl: z.string().url("Valid file URL is required"),
  storageKey: z.string().optional(),
  description: z.string().optional(),
  // Keep API-layer flexible; DB enforces JSON shape
  metadata: z.any().optional(),
  teamId: z.string().optional(),
});

const listLibraryItemsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  teamId: z.string().optional(),
  onlyImages: z.boolean().default(true),
  search: z.string().optional(),
});

export const emailBuilderLibraryRouter = router({
  /**
   * Create a library item from an UploadThing upload.
   * This is intentionally decoupled from UploadThing's internal types.
   */
  createFromUpload: protectedProcedure
    .input(createFromUploadSchema)
    .output(
      z.object({
        data: emailBuilderLibraryItemSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { teamId, ...rest } = input;

      // If teamId is provided, ensure the user is a member of that team
      if (teamId) {
        const membership = await prisma.teamMember.findFirst({
          where: {
            teamId,
            userId,
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this team",
          });
        }
      }

      const item = await prisma.emailBuilderLibrary.create({
        data: {
          id: randomUUID(),
          userId,
          teamId: teamId ?? null,
          fileName: rest.fileName,
          fileSize: rest.fileSize,
          mimeType: rest.mimeType,
          fileUrl: rest.fileUrl,
          storageKey: rest.storageKey ?? null,
          description: rest.description ?? null,
          // Store arbitrary JSON metadata without leaking Prisma types into the API layer schema
          metadata: (rest.metadata as unknown) ?? undefined,
          createdAt: new Date(),
        },
      });

      return {
        data: item,
      };
    }),

  /**
   * List library items for the current user (and optionally a specific team).
   * Defaults to images-only, ordered by most recent first.
   */
  list: protectedProcedure
    .input(listLibraryItemsSchema)
    .output(
      z.object({
        data: z.array(emailBuilderLibraryItemSchema),
        nextPage: z.number().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { page, limit, teamId, onlyImages, search } = input;

      // If teamId is provided, ensure the user is a member of that team
      if (teamId) {
        const membership = await prisma.teamMember.findFirst({
          where: {
            teamId,
            userId,
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this team",
          });
        }
      }

      const where: Record<string, unknown> = {
        // Personal library when no team is set; otherwise team-scoped
          ...(teamId
            ? { teamId }
            : {
                userId,
                teamId: null,
              }),
      };

      if (onlyImages) {
        where.mimeType = {
          startsWith: "image/",
        };
      }

      if (search && search.trim().length > 0) {
        where.fileName = {
          contains: search.trim(),
          mode: "insensitive",
        };
      }

      const items = await prisma.emailBuilderLibrary.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        data: items,
        nextPage: items.length === limit ? page + 1 : null,
      };
    }),
});

