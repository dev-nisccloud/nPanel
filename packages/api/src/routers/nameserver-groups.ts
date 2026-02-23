import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import prisma from "@nPanel/db";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Input schemas
const createNameserverGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  nameservers: z.array(z.object({
    name: z.string().min(1, "Nameserver name is required").max(255),
    ipv4: z.string().optional(),
    ipv6: z.string().optional(),
  })).min(1, "At least one nameserver is required"),
});

const updateNameserverGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Group name is required").max(100).optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  nameservers: z.array(z.object({
    id: z.string().optional(), // For existing nameservers
    name: z.string().min(1, "Nameserver name is required").max(255),
    ipv4: z.string().optional(),
    ipv6: z.string().optional(),
  })).min(1, "At least one nameserver is required").optional(),
});

const deleteNameserverGroupSchema = z.object({
  id: z.string(),
});

const getNameserverGroupSchema = z.object({
  id: z.string(),
});

const listNameserverGroupsSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  search: z.string().optional(),
});

const setDefaultNameserverGroupSchema = z.object({
  id: z.string(),
});

const getActivityLogsSchema = z.object({
  id: z.string(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// Response schemas
const nameserverSchema = z.object({
  id: z.string(),
  name: z.string(),
  ipv4: z.string().nullable(),
  ipv6: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const nameserverGroupResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  userId: z.string(),
  isDefault: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  nameservers: z.array(nameserverSchema),
  _count: z.object({
    tldSettings: z.number(),
    domainRegistrations: z.number(),
    domainTransfers: z.number(),
  }),
});

const nameserverGroupListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(nameserverGroupResponseSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

const nameserverGroupResponseSchemaWithTldSettings = nameserverGroupResponseSchema.extend({
  tldSettings: z.array(z.object({
    id: z.string(),
    name: z.string(),
    marginType: z.string().nullable(),
    percentageMargin: z.string().nullable(),
    fixedMargin: z.string().nullable(),
  })),
});

const activityLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  nameserverGroupId: z.string(),
  action: z.string(),
  description: z.string().nullable(),
  metadata: z.any().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.date(),
});

const activityLogsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(activityLogSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function transformNameserverGroup(group: any) {
  const rawCount = group._count;
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    userId: group.userId,
    isDefault: group.isDefault,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    nameservers: group.nameservers || [],
    _count: {
      tldSettings: rawCount?.tldSettings ?? 0,
      domainRegistrations: rawCount?.domains ?? 0,
      domainTransfers: rawCount?.domainTransfers ?? 0,
    },
  };
}

function transformNameserverGroupWithTldSettings(group: any) {
  return {
    ...transformNameserverGroup(group),
    tldSettings: (group.tldSettings || []).map((tld: any) => ({
      id: tld.id,
      name: tld.name,
      marginType: tld.marginType as string | null,
      percentageMargin: tld.percentageMargin,
      fixedMargin: tld.fixedMargin,
    })),
  };
}

// ============================================================================
// ROUTER
// ============================================================================

export const nameserverGroupsRouter = router({
  // Create a new nameserver group
  create: protectedProcedure
    .input(createNameserverGroupSchema)
    .output(z.object({
      success: z.boolean(),
      data: nameserverGroupResponseSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        // Check if user is trying to set as default and there's already a default
        if (input.isDefault) {
          const existingDefault = await prisma.nameserverGroup.findFirst({
            where: {
              userId,
              isDefault: true,
            },
          });

          if (existingDefault) {
            // Update existing default to false
            await prisma.nameserverGroup.update({
              where: { id: existingDefault.id },
              data: { isDefault: false },
            });
          }
        }

        // Create nameserver group with nameservers
        const nameserverGroup = await prisma.nameserverGroup.create({
          data: {
            id: crypto.randomUUID(),
            name: input.name,
            description: input.description,
            userId,
            isDefault: input.isDefault,
            createdAt: new Date(),
            updatedAt: new Date(),
            nameservers: {
              create: input.nameservers.map(ns => ({
                id: crypto.randomUUID(),
                name: ns.name,
                ipv4: ns.ipv4,
                ipv6: ns.ipv6,
                createdAt: new Date(),
                updatedAt: new Date(),
              })),
            },
          },
          include: {
            nameservers: true,
            _count: {
              select: {
                tldSettings: true,
                domains: true,
                domainTransfers: true,
              },
            },
          },
        });

        // Log the activity
        await prisma.nameserverGroupActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            nameserverGroupId: nameserverGroup.id,
            action: "CREATE",
            description: `Created nameserver group "${input.name}" with ${input.nameservers.length} nameservers`,
            createdAt: new Date(),
          },
        });

        return {
          success: true,
          data: transformNameserverGroup(nameserverGroup),
        };
      } catch (error) {
        console.error("Error creating nameserver group:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create nameserver group",
        });
      }
    }),

  // Get a single nameserver group
  get: protectedProcedure
    .input(getNameserverGroupSchema)
    .output(z.object({
      success: z.boolean(),
      data: nameserverGroupResponseSchemaWithTldSettings,
    }))
    .query(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        const nameserverGroup = await prisma.nameserverGroup.findFirst({
          where: {
            id: input.id,
            userId,
          },
          include: {
            nameservers: true,
            tldSettings: {
              select: {
                id: true,
                name: true,
                marginType: true,
                percentageMargin: true,
                fixedMargin: true,
              },
            },
            _count: {
              select: {
                tldSettings: true,
                domains: true,
                domainTransfers: true,
              },
            },
          },
        });

        if (!nameserverGroup) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nameserver group not found",
          });
        }

        return {
          success: true,
          data: transformNameserverGroupWithTldSettings(nameserverGroup),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error fetching nameserver group:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch nameserver group",
        });
      }
    }),

  // List nameserver groups
  list: protectedProcedure
    .input(listNameserverGroupsSchema)
    .output(nameserverGroupListResponseSchema)
    .query(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        const where = {
          userId,
          ...(input.search && {
            OR: [
              { name: { contains: input.search, mode: "insensitive" as const } },
              { description: { contains: input.search, mode: "insensitive" as const } },
            ],
          }),
        };

        const [nameserverGroups, total] = await Promise.all([
          prisma.nameserverGroup.findMany({
            where,
            include: {
              nameservers: true,
              _count: {
                select: {
                  tldSettings: true,
                  domains: true,
                  domainTransfers: true,
                },
              },
            },
            orderBy: [
              { isDefault: "desc" },
              { createdAt: "desc" },
            ],
            take: input.limit,
            skip: input.offset,
          }),
          prisma.nameserverGroup.count({ where }),
        ]);

        return {
          success: true,
          data: nameserverGroups.map(transformNameserverGroup),
          pagination: {
            total,
            limit: input.limit,
            offset: input.offset,
            hasMore: input.offset + input.limit < total,
          },
        };
      } catch (error) {
        console.error("Error listing nameserver groups:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list nameserver groups",
        });
      }
    }),

  // Update a nameserver group
  update: protectedProcedure
    .input(updateNameserverGroupSchema)
    .output(z.object({
      success: z.boolean(),
      data: nameserverGroupResponseSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        // Check if nameserver group exists and belongs to user
        const existingGroup = await prisma.nameserverGroup.findFirst({
          where: {
            id: input.id,
            userId,
          },
          include: {
            nameservers: true,
          },
        });

        if (!existingGroup) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nameserver group not found",
          });
        }

        // Check if user is trying to set as default and there's already a default
        if (input.isDefault && !existingGroup.isDefault) {
          const existingDefault = await prisma.nameserverGroup.findFirst({
            where: {
              userId,
              isDefault: true,
              id: { not: input.id },
            },
          });

          if (existingDefault) {
            // Update existing default to false
            await prisma.nameserverGroup.update({
              where: { id: existingDefault.id },
              data: { isDefault: false },
            });
          }
        }

        // Prepare update data
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

        // Handle nameservers update if provided
        if (input.nameservers) {
          // Delete existing nameservers
          await prisma.nameserver.deleteMany({
            where: {
              nameserverGroupId: input.id,
            },
          });

          // Create new nameservers
          updateData.nameservers = {
            create: input.nameservers.map(ns => ({
              id: crypto.randomUUID(),
              name: ns.name,
              ipv4: ns.ipv4,
              ipv6: ns.ipv6,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          };
        }

        const updatedGroup = await prisma.nameserverGroup.update({
          where: { id: input.id },
          data: updateData,
          include: {
            nameservers: true,
            _count: {
              select: {
                tldSettings: true,
                domains: true,
                domainTransfers: true,
              },
            },
          },
        });

        // Log the activity
        await prisma.nameserverGroupActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            nameserverGroupId: updatedGroup.id,
            action: "UPDATE",
            description: `Updated nameserver group "${updatedGroup.name}"`,
            createdAt: new Date(),
          },
        });

        return {
          success: true,
          data: transformNameserverGroup(updatedGroup),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error updating nameserver group:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update nameserver group",
        });
      }
    }),

  // Delete a nameserver group
  delete: protectedProcedure
    .input(deleteNameserverGroupSchema)
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        // Check if nameserver group exists and belongs to user
        const existingGroup = await prisma.nameserverGroup.findFirst({
          where: {
            id: input.id,
            userId,
          },
          include: {
            _count: {
              select: {
                tldSettings: true,
                domains: true,
                domainTransfers: true,
              },
            },
          },
        });

        if (!existingGroup) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nameserver group not found",
          });
        }

        // Check if group is being used
        const totalUsage = existingGroup._count.tldSettings +
                          existingGroup._count.domains +
                          existingGroup._count.domainTransfers;

        if (totalUsage > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Cannot delete nameserver group. It is being used by ${totalUsage} items. Please reassign them first.`,
          });
        }

        // Check if this is the default group
        if (existingGroup.isDefault) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Cannot delete the default nameserver group. Please set another group as default first.",
          });
        }

        // Delete the nameserver group (nameservers will be deleted by cascade)
        await prisma.nameserverGroup.delete({
          where: { id: input.id },
        });

        // Log the activity
        await prisma.nameserverGroupActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            nameserverGroupId: input.id,
            action: "DELETE",
            description: `Deleted nameserver group "${existingGroup.name}"`,
            createdAt: new Date(),
          },
        });

        return {
          success: true,
          message: "Nameserver group deleted successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error deleting nameserver group:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete nameserver group",
        });
      }
    }),

  // Set a nameserver group as default
  setDefault: protectedProcedure
    .input(setDefaultNameserverGroupSchema)
    .output(z.object({
      success: z.boolean(),
      data: nameserverGroupResponseSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        // Check if nameserver group exists and belongs to user
        const existingGroup = await prisma.nameserverGroup.findFirst({
          where: {
            id: input.id,
            userId,
          },
        });

        if (!existingGroup) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nameserver group not found",
          });
        }

        // Update existing default to false
        await prisma.nameserverGroup.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: { isDefault: false },
        });

        // Set new default
        const updatedGroup = await prisma.nameserverGroup.update({
          where: { id: input.id },
          data: { 
            isDefault: true,
            updatedAt: new Date(),
          },
          include: {
            nameservers: true,
          },
        });

        // Log the activity
        await prisma.nameserverGroupActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            nameserverGroupId: updatedGroup.id,
            action: "SET_DEFAULT",
            description: `Set nameserver group "${updatedGroup.name}" as default`,
            createdAt: new Date(),
          },
        });

        return {
          success: true,
          data: transformNameserverGroup(updatedGroup),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error setting default nameserver group:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to set default nameserver group",
        });
      }
    }),

  // Get activity logs for a nameserver group
  getActivityLogs: protectedProcedure
    .input(getActivityLogsSchema)
    .output(activityLogsResponseSchema)
    .query(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        // Check if nameserver group exists and belongs to user
        const existingGroup = await prisma.nameserverGroup.findFirst({
          where: {
            id: input.id,
            userId,
          },
        });

        if (!existingGroup) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nameserver group not found",
          });
        }

        const [logs, total] = await Promise.all([
          prisma.nameserverGroupActivityLog.findMany({
            where: {
              nameserverGroupId: input.id,
            },
            orderBy: { createdAt: "desc" },
            take: input.limit,
            skip: input.offset,
          }),
          prisma.nameserverGroupActivityLog.count({
            where: {
              nameserverGroupId: input.id,
            },
          }),
        ]);

        return {
          success: true,
          data: logs,
          pagination: {
            total,
            limit: input.limit,
            offset: input.offset,
            hasMore: input.offset + input.limit < total,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error fetching activity logs:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch activity logs",
        });
      }
    }),
});