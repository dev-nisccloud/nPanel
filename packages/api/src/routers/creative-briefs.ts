import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import prisma from "@nPanel/db";

// ============================================================================
// TYPESCRIPT TYPES - Independent from Prisma, mirroring database structure
// ============================================================================

// Status enums as TypeScript types
type CreativeBriefStatusType = "DRAFT" | "REVIEWING" | "APPROVED" | "REJECTED";

// Database model types (matching Prisma schema structure but independent)
interface DbCreativeBriefReferenceImage {
  id: string;
  creativeBriefId: string;
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileMetadata?: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DbTeam {
  id: string;
  name: string;
  slug: string;
}

interface DbUser {
  id: string;
  name: string;
  email: string;
}

interface DbCreativeBrief {
  id: string;
  name: string;
  userId: string;
  teamId: string | null;
  status: CreativeBriefStatusType;
  background: string;
  objectives: string;
  requirements: string;
  comments: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  timelineStartDate: Date | null;
  timelineEndDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: DbUser;
  team?: DbTeam | null;
  referenceImages?: DbCreativeBriefReferenceImage[];
}

// ============================================================================
// ZOD SCHEMAS - Independent from database schema (no shared types)
// ============================================================================

// Reference image schema
const creativeBriefReferenceImageSchema = z.object({
  id: z.string(),
  creativeBriefId: z.string(),
  fileUrl: z.string(),
  fileKey: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  fileMetadata: z.unknown().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Response schemas
const creativeBriefSchema = z.object({
  id: z.string(),
  name: z.string(),
  userId: z.string(),
  teamId: z.string().nullable(),
  status: z.enum(["DRAFT", "REVIEWING", "APPROVED", "REJECTED"]),
  background: z.string(),
  objectives: z.string(),
  requirements: z.string(),
  comments: z.string().nullable(),
  approvedBy: z.string().nullable(),
  approvedAt: z.date().nullable(),
  rejectedBy: z.string().nullable(),
  rejectedAt: z.date().nullable(),
  timelineStartDate: z.date().nullable(),
  timelineEndDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).optional(),
  team: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }).nullable().optional(),
  referenceImages: z.array(creativeBriefReferenceImageSchema).optional(),
});

// Input schemas
const createCreativeBriefInputSchema = z.object({
  name: z.string().min(1).max(255),
  teamId: z.string().optional(),
  background: z.string().min(1),
  objectives: z.string().min(1),
  requirements: z.string().min(1),
  comments: z.string().optional(),
  timelineStartDate: z.date().optional(),
  timelineEndDate: z.date().optional(),
  referenceImages: z.array(z.object({
    fileUrl: z.string(),
    fileKey: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    fileMetadata: z.unknown().optional(),
  })).optional(),
});

const updateCreativeBriefInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255).optional(),
  teamId: z.string().optional(),
  background: z.string().min(1).optional(),
  objectives: z.string().min(1).optional(),
  requirements: z.string().min(1).optional(),
  comments: z.string().optional(),
  timelineStartDate: z.date().optional(),
  timelineEndDate: z.date().optional(),
  referenceImages: z.array(z.object({
    fileUrl: z.string(),
    fileKey: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    fileMetadata: z.unknown().optional(),
  })).optional(),
});

// ============================================================================
// TRANSFORM FUNCTIONS - Convert DB types to API response types
// ============================================================================

function transformReferenceImage(image: DbCreativeBriefReferenceImage) {
  return {
    id: image.id,
    creativeBriefId: image.creativeBriefId,
    fileUrl: image.fileUrl,
    fileKey: image.fileKey,
    fileName: image.fileName,
    fileSize: image.fileSize,
    mimeType: image.mimeType,
    fileMetadata: image.fileMetadata ?? null,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
  };
}

function transformBrief(brief: DbCreativeBrief) {
  const result: {
    id: string;
    name: string;
    userId: string;
    teamId: string | null;
    status: "DRAFT" | "REVIEWING" | "APPROVED" | "REJECTED";
    background: string;
    objectives: string;
    requirements: string;
    comments: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    timelineStartDate: Date | null;
    timelineEndDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    user?: { id: string; name: string; email: string };
    team?: { id: string; name: string; slug: string } | null;
    referenceImages?: ReturnType<typeof transformReferenceImage>[];
  } = {
    id: brief.id,
    name: brief.name,
    userId: brief.userId,
    teamId: brief.teamId,
    status: brief.status as "DRAFT" | "REVIEWING" | "APPROVED" | "REJECTED",
    background: brief.background,
    objectives: brief.objectives,
    requirements: brief.requirements,
    comments: brief.comments,
    approvedBy: brief.approvedBy,
    approvedAt: brief.approvedAt,
    rejectedBy: brief.rejectedBy,
    rejectedAt: brief.rejectedAt,
    timelineStartDate: brief.timelineStartDate,
    timelineEndDate: brief.timelineEndDate,
    createdAt: brief.createdAt,
    updatedAt: brief.updatedAt,
  };

  if (brief.user) {
    result.user = {
      id: brief.user.id,
      name: brief.user.name,
      email: brief.user.email,
    };
  }

  if (brief.team !== undefined) {
    result.team = brief.team ? {
      id: brief.team.id,
      name: brief.team.name,
      slug: brief.team.slug,
    } : null;
  }

  if (brief.referenceImages !== undefined) {
    result.referenceImages = brief.referenceImages.map(transformReferenceImage);
  }

  return result;
}

// Helper to get authenticated user from context
async function getAuthenticatedUser(ctx: { session: { user?: { id: string } } | null }) {
  const user = ctx.session?.user;
  if (!user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true },
  });

  if (!dbUser) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  return { id: user.id };
}

// Helper to log activity
async function logActivity(
  briefId: string,
  userId: string,
  action: string,
  description?: string | null,
  metadata?: unknown,
) {
  await prisma.creativeBriefActivityLog.create({
    data: {
      id: crypto.randomUUID(),
      creativeBriefId: briefId,
      userId,
      action,
      description: description ?? null,
      metadata: metadata ?? null,
      createdAt: new Date(),
    } as any, // Type assertion for JsonValue compatibility
  });
}

export const creativeBriefsRouter = router({
  // Get all creative briefs for the authenticated user
  getAll: protectedProcedure
    .output(z.array(creativeBriefSchema))
    .query(async ({ ctx }) => {
      const user = await getAuthenticatedUser(ctx);

      const briefs = await prisma.creativeBrief.findMany({
        where: {
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          referenceImages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return briefs.map(transformBrief);
    }),

  // Get a single creative brief by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(creativeBriefSchema)
    .query(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);

      const brief = await prisma.creativeBrief.findFirst({
        where: {
          id: input.id,
          userId: user.id, // Ensure user owns the brief
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          referenceImages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (!brief) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Creative brief not found",
        });
      }

      return transformBrief(brief);
    }),

  // Create a new creative brief
  create: protectedProcedure
    .input(createCreativeBriefInputSchema)
    .output(creativeBriefSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);

      // Validate team if provided
      if (input.teamId) {
        const team = await prisma.team.findUnique({
          where: { id: input.teamId },
        });

        if (!team) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team not found",
          });
        }
      }

      // Validate date range
      if (input.timelineStartDate && input.timelineEndDate) {
        if (input.timelineEndDate < input.timelineStartDate) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "End date must be after start date",
          });
        }
      }

      const brief = await prisma.creativeBrief.create({
        data: {
          id: crypto.randomUUID(),
          name: input.name,
          userId: user.id,
          teamId: input.teamId ?? null,
          status: "DRAFT",
          background: input.background,
          objectives: input.objectives,
          requirements: input.requirements,
          comments: input.comments ?? null,
          timelineStartDate: input.timelineStartDate ?? null,
          timelineEndDate: input.timelineEndDate ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          referenceImages: true,
        },
      });

      // Create reference images if provided
      if (input.referenceImages && input.referenceImages.length > 0) {
        await prisma.creativeBriefReferenceImage.createMany({
          data: input.referenceImages.map((img) => ({
            id: crypto.randomUUID(),
            creativeBriefId: brief.id,
            fileUrl: img.fileUrl,
            fileKey: img.fileKey,
            fileName: img.fileName,
            fileSize: img.fileSize,
            mimeType: img.mimeType,
            fileMetadata: img.fileMetadata ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })) as any, // Type assertion for JsonValue compatibility
        });

        // Reload brief with reference images
        const updatedBrief = await prisma.creativeBrief.findUnique({
          where: { id: brief.id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            referenceImages: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

        if (updatedBrief) {
          // Log activity
          await logActivity(
            brief.id,
            user.id,
            "CREATE",
            `Created creative brief "${brief.name}"`,
            { referenceImagesCount: input.referenceImages.length },
          );

          return transformBrief(updatedBrief);
        }
      }

      // Log activity
      await logActivity(
        brief.id,
        user.id,
        "CREATE",
        `Created creative brief "${brief.name}"`,
      );

      return transformBrief(brief);
    }),

  // Update a creative brief
  update: protectedProcedure
    .input(updateCreativeBriefInputSchema)
    .output(creativeBriefSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);

      // Check if brief exists and user owns it
      const existingBrief = await prisma.creativeBrief.findFirst({
        where: {
          id: input.id,
          userId: user.id,
        },
      });

      if (!existingBrief) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Creative brief not found",
        });
      }

      // Validate team if provided
      if (input.teamId) {
        const team = await prisma.team.findUnique({
          where: { id: input.teamId },
        });

        if (!team) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team not found",
          });
        }
      }

      // Validate date range
      const timelineStartDate = input.timelineStartDate ?? existingBrief.timelineStartDate;
      const timelineEndDate = input.timelineEndDate ?? existingBrief.timelineEndDate;
      if (timelineStartDate && timelineEndDate) {
        if (timelineEndDate < timelineStartDate) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "End date must be after start date",
          });
        }
      }

      // Update brief
      const updatedBrief = await prisma.creativeBrief.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.teamId !== undefined && { teamId: input.teamId ?? null }),
          ...(input.background !== undefined && { background: input.background }),
          ...(input.objectives !== undefined && { objectives: input.objectives }),
          ...(input.requirements !== undefined && { requirements: input.requirements }),
          ...(input.comments !== undefined && { comments: input.comments ?? null }),
          ...(input.timelineStartDate !== undefined && { timelineStartDate: input.timelineStartDate ?? null }),
          ...(input.timelineEndDate !== undefined && { timelineEndDate: input.timelineEndDate ?? null }),
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          referenceImages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      // Handle reference images update
      if (input.referenceImages !== undefined) {
        // Delete existing reference images
        await prisma.creativeBriefReferenceImage.deleteMany({
          where: {
            creativeBriefId: input.id,
          },
        });

        // Create new reference images
        if (input.referenceImages.length > 0) {
          await prisma.creativeBriefReferenceImage.createMany({
            data: input.referenceImages.map((img) => ({
              id: crypto.randomUUID(),
              creativeBriefId: input.id,
              fileUrl: img.fileUrl,
              fileKey: img.fileKey,
              fileName: img.fileName,
              fileSize: img.fileSize,
              mimeType: img.mimeType,
              fileMetadata: img.fileMetadata ?? null,
              createdAt: new Date(),
              updatedAt: new Date(),
            })) as any, // Type assertion for JsonValue compatibility
          });
        }

        // Reload brief with updated reference images
        const reloadedBrief = await prisma.creativeBrief.findUnique({
          where: { id: input.id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            referenceImages: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

        if (reloadedBrief) {
          // Log activity
          await logActivity(
            input.id,
            user.id,
            "UPDATE",
            `Updated creative brief "${updatedBrief.name}"`,
            { referenceImagesCount: input.referenceImages.length },
          );

          return transformBrief(reloadedBrief);
        }
      }

      // Log activity
      await logActivity(
        input.id,
        user.id,
        "UPDATE",
        `Updated creative brief "${updatedBrief.name}"`,
      );

      return transformBrief(updatedBrief);
    }),

  // Delete a creative brief
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);

      // Check if brief exists and user owns it
      const existingBrief = await prisma.creativeBrief.findFirst({
        where: {
          id: input.id,
          userId: user.id,
        },
      });

      if (!existingBrief) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Creative brief not found",
        });
      }

      // Delete brief (cascade will delete reference images and activity logs)
      await prisma.creativeBrief.delete({
        where: { id: input.id },
      });

      // Log activity (before deletion, but activity log will be deleted by cascade)
      // We can log this in a separate table if needed, but for now we'll skip it
      // since the activity log will be deleted by cascade

      return { success: true };
    }),
});
