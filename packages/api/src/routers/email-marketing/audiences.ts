import { z } from "zod";
import { TRPCError, type AnyRouter } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import db from "@nPanel/db";


// Helper function to convert API types to Prisma-compatible JSON values
// This bridges the API layer types to Prisma's InputJsonValue type
function toPrismaJson(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }
  // Cast through 'any' to bridge API types to Prisma types without importing Prisma types in API layer
  return JSON.parse(JSON.stringify(value));
}

// Helper function to generate unique IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Dedicated Zod schemas for audience management
const createAudienceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  teamId: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

const updateAudienceSchema = z.object({
  id: z.string(),
  updates: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  }),
});

const getAudienceByIdSchema = z.object({
  id: z.string(),
});

const deleteAudienceSchema = z.object({
  id: z.string(),
});

const listAudiencesSchema = z.object({
  teamId: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

const _audiencesRouter = router({
  /**
   * Create a new audience
   */
  create: protectedProcedure
    .input(createAudienceSchema)
    .mutation(async ({ input, ctx }) => {
      const { name, description, teamId, status } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const audienceId = generateId('audience');
        const audience = await db.audience.create({
          data: {
            id: audienceId,
            name,
            description: description || null,
            teamId: teamId || null,
            userId,
            status: status || null,
            totalContacts: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Log activity
        const logId = generateId('activity');
        await db.audienceActivityLog.create({
          data: {
            id: logId,
            userId,
            audienceId: audience.id,
            action: "CREATE",
            description: `Audience "${name}" created`,
            metadata: toPrismaJson({
              name,
              teamId,
              status,
            }),
            createdAt: new Date(),
          },
        });

        return audience;
      } catch (error) {
        console.error("Error creating audience:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create audience",
        });
      }
    }),

  /**
   * List audiences for user/team
   */
  list: protectedProcedure
    .input(listAudiencesSchema)
    .query(async ({ input, ctx }) => {
      const { teamId, status, limit, offset } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const audiences = await db.audience.findMany({
          where: {
            OR: [
              { userId },
              ...(teamId ? [{ teamId }] : []),
            ],
            ...(status ? { status } : {}),
          },
          include: {
            team: true,
            _count: {
              select: {
                contacts: true,
                campaigns: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
          skip: offset,
        });

        const total = await db.audience.count({
          where: {
            OR: [
              { userId },
              ...(teamId ? [{ teamId }] : []),
            ],
            ...(status ? { status } : {}),
          },
        });

        return {
          audiences,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        };
      } catch (error) {
        console.error("Error listing audiences:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list audiences",
        });
      }
    }),

  /**
   * Get audience by ID
   */
  getById: protectedProcedure
    .input(getAudienceByIdSchema)
    .query(async ({ input, ctx }) => {
      const { id } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const audience = await db.audience.findFirst({
          where: {
            id,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
          include: {
            team: true,
            contacts: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                subscribedAt: true,
                unsubscribedAt: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            campaigns: {
              select: {
                id: true,
                name: true,
                status: true,
                createdAt: true,
                sentAt: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        });

        if (!audience) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Audience not found",
          });
        }

        return audience;
      } catch (error) {
        console.error("Error getting audience:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get audience",
        });
      }
    }),

  /**
   * Update audience
   */
  update: protectedProcedure
    .input(updateAudienceSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, updates } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const existingAudience = await db.audience.findFirst({
          where: {
            id,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
        });

        if (!existingAudience) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Audience not found",
          });
        }

        const updatedAudience = await db.audience.update({
          where: { id },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        // Log activity
        const updateLogId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.audienceActivityLog.create({
          data: {
            id: updateLogId,
            userId,
            audienceId: id,
            action: "UPDATE",
            description: `Audience "${existingAudience.name}" updated`,
            metadata: toPrismaJson({
              updates: updates as Record<string, unknown>,
              previousName: existingAudience.name,
            }),
            createdAt: new Date(),
          },
        });

        return updatedAudience;
      } catch (error) {
        console.error("Error updating audience:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update audience",
        });
      }
    }),

  /**
   * Delete audience
   */
  delete: protectedProcedure
    .input(deleteAudienceSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const audience = await db.audience.findFirst({
          where: {
            id,
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
          include: {
            campaigns: true,
          },
        });

        if (!audience) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Audience not found",
          });
        }

        // Check if audience is used in campaigns
        if (audience.campaigns.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Cannot delete audience that is used in campaigns",
          });
        }

        // Delete audience and all contacts
        await db.audience.delete({
          where: { id },
        });

        // Log activity
        const deleteLogId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.audienceActivityLog.create({
          data: {
            id: deleteLogId,
            userId,
            audienceId: id,
            action: "DELETE",
            description: `Audience "${audience.name}" deleted`,
            metadata: toPrismaJson({
              name: audience.name,
              totalContacts: audience.totalContacts,
            }),
            createdAt: new Date(),
          },
        });

        return { success: true };
      } catch (error) {
        console.error("Error deleting audience:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete audience",
        });
      }
    }),
});

export const audiencesRouter: AnyRouter = _audiencesRouter;
