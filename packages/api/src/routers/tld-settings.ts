import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import prisma from "@nPanel/db";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Input schemas
const createTldSettingsSchema = z.object({
  name: z.string().min(1, "TLD setting name is required").max(100, "TLD setting name must be 100 characters or less"),
  nameserverGroupId: z.string().optional(),
  marginType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  percentageMargin: z.string().optional(),
  fixedMargin: z.string().optional(),
  roundOff: z.string().optional(),
});

const updateTldSettingsSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "TLD setting name is required").max(100, "TLD setting name must be 100 characters or less").optional(),
  nameserverGroupId: z.string().optional(),
  marginType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  percentageMargin: z.string().optional(),
  fixedMargin: z.string().optional(),
  roundOff: z.string().optional(),
});

const deleteTldSettingsSchema = z.object({
  id: z.string(),
});

const getTldSettingsSchema = z.object({
  id: z.string(),
});

const listTldSettingsSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  search: z.string().optional(),
  marginType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  nameserverGroupId: z.string().optional(),
});

const bulkDeleteTldSettingsSchema = z.object({
  ids: z.array(z.string()).min(1),
});

const setDefaultTldSettingsSchema = z.object({
  id: z.string(),
});

const getActivityLogsSchema = z.object({
  id: z.string(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// Response schemas
const nameserverGroupReferenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isDefault: z.boolean(),
  nameservers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    ipv4: z.string().nullable(),
    ipv6: z.string().nullable(),
  })),
});

const tldSettingResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  userId: z.string(),
  nameserverGroupId: z.string().nullable(),
  marginType: z.string().nullable(), // String instead of enum for API
  percentageMargin: z.string().nullable(),
  fixedMargin: z.string().nullable(),
  roundOff: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  nameserverGroup: nameserverGroupReferenceSchema.nullable(),
  _count: z.object({
    activityLogs: z.number(),
  }),
});

const tldSettingListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(tldSettingResponseSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

const activityLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tldSettingId: z.string(),
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

function transformTldSetting(tldSetting: any) {
  return {
    id: tldSetting.id,
    name: tldSetting.name,
    userId: tldSetting.userId,
    nameserverGroupId: tldSetting.nameserverGroupId,
    marginType: tldSetting.marginType as string | null, // Convert enum to string
    percentageMargin: tldSetting.percentageMargin,
    fixedMargin: tldSetting.fixedMargin,
    roundOff: tldSetting.roundOff,
    isDefault: tldSetting.isDefault,
    createdAt: tldSetting.createdAt,
    updatedAt: tldSetting.updatedAt,
    nameserverGroup: tldSetting.nameserverGroup ? {
      id: tldSetting.nameserverGroup.id,
      name: tldSetting.nameserverGroup.name,
      description: tldSetting.nameserverGroup.description,
      isDefault: tldSetting.nameserverGroup.isDefault,
      nameservers: tldSetting.nameserverGroup.nameservers || [],
    } : null,
    _count: tldSetting._count || {
      activityLogs: 0,
    },
  };
}

// ============================================================================
// ROUTER
// ============================================================================

export const tldSettingsRouter = router({
  // Create a new TLD setting
  create: protectedProcedure
    .input(createTldSettingsSchema)
    .output(z.object({
      success: z.boolean(),
      data: tldSettingResponseSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        // Validate margin fields based on margin type
        if (input.marginType === "PERCENTAGE" && !input.percentageMargin) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Percentage margin is required when margin type is PERCENTAGE",
          });
        }

        if (input.marginType === "FIXED" && !input.fixedMargin) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Fixed margin is required when margin type is FIXED",
          });
        }

        // Check if TLD setting already exists for this user
        const existingTld = await prisma.tldSettings.findFirst({
          where: {
            name: input.name,
            userId,
          },
        });

        if (existingTld) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `TLD setting for "${input.name}" already exists`,
          });
        }

        // Validate nameserver group if provided
        if (input.nameserverGroupId) {
          const nameserverGroup = await prisma.nameserverGroup.findFirst({
            where: {
              id: input.nameserverGroupId,
              userId,
            },
          });

          if (!nameserverGroup) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Nameserver group not found",
            });
          }
        }

        // Create TLD setting
        const tldSetting = await prisma.tldSettings.create({
          data: {
            id: crypto.randomUUID(),
            name: input.name,
            userId,
            nameserverGroupId: input.nameserverGroupId,
            marginType: input.marginType,
            percentageMargin: input.marginType === "PERCENTAGE" ? input.percentageMargin : null,
            fixedMargin: input.marginType === "FIXED" ? input.fixedMargin : null,
            roundOff: input.roundOff,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          include: {
            nameserverGroup: {
              include: {
                nameservers: true,
              },
            },
            _count: {
              select: {
                activityLogs: true,
              },
            },
          },
        });

        // Log the activity
        await prisma.tldSettingsActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            tldSettingId: tldSetting.id,
            action: "CREATE",
            description: `Created TLD setting for "${input.name}"`,
            createdAt: new Date(),
          },
        });

        return {
          success: true,
          data: transformTldSetting(tldSetting),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error creating TLD setting:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create TLD setting",
        });
      }
    }),

  // Get a single TLD setting
  get: protectedProcedure
    .input(getTldSettingsSchema)
    .output(z.object({
      success: z.boolean(),
      data: tldSettingResponseSchema,
    }))
    .query(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        const tldSetting = await prisma.tldSettings.findFirst({
          where: {
            id: input.id,
            userId,
          },
          include: {
            nameserverGroup: {
              include: {
                nameservers: true,
              },
            },
            _count: {
              select: {
                activityLogs: true,
              },
            },
          },
        });

        if (!tldSetting) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "TLD setting not found",
          });
        }

        return {
          success: true,
          data: transformTldSetting(tldSetting),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error fetching TLD setting:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch TLD setting",
        });
      }
    }),

  // List TLD settings
  list: protectedProcedure
    .input(listTldSettingsSchema)
    .output(tldSettingListResponseSchema)
    .query(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        const where = {
          userId,
          ...(input.search && {
            name: { contains: input.search, mode: "insensitive" as const },
          }),
          ...(input.marginType && { marginType: input.marginType }),
          ...(input.nameserverGroupId && { nameserverGroupId: input.nameserverGroupId }),
        };

        const [tldSettings, total] = await Promise.all([
          prisma.tldSettings.findMany({
            where,
            include: {
              nameserverGroup: {
                include: {
                  nameservers: true,
                },
              },
              _count: {
                select: {
                  activityLogs: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: input.limit,
            skip: input.offset,
          }),
          prisma.tldSettings.count({ where }),
        ]);

        return {
          success: true,
          data: tldSettings.map(transformTldSetting),
          pagination: {
            total,
            limit: input.limit,
            offset: input.offset,
            hasMore: input.offset + input.limit < total,
          },
        };
      } catch (error) {
        console.error("Error listing TLD settings:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list TLD settings",
        });
      }
    }),

  // Update a TLD setting
  update: protectedProcedure
    .input(updateTldSettingsSchema)
    .output(z.object({
      success: z.boolean(),
      data: tldSettingResponseSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        // Check if TLD setting exists and belongs to user
        const existingTld = await prisma.tldSettings.findFirst({
          where: {
            id: input.id,
            userId,
          },
        });

        if (!existingTld) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "TLD setting not found",
          });
        }

        // Validate margin fields based on margin type
        const marginType = input.marginType ?? existingTld.marginType;
        if (marginType === "PERCENTAGE" && !input.percentageMargin && !existingTld.percentageMargin) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Percentage margin is required when margin type is PERCENTAGE",
          });
        }

        if (marginType === "FIXED" && !input.fixedMargin && !existingTld.fixedMargin) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Fixed margin is required when margin type is FIXED",
          });
        }

        // Validate nameserver group if provided
        if (input.nameserverGroupId) {
          const nameserverGroup = await prisma.nameserverGroup.findFirst({
            where: {
              id: input.nameserverGroupId,
              userId,
            },
          });

          if (!nameserverGroup) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Nameserver group not found",
            });
          }
        }

        // Check for name conflicts if name is being changed
        if (input.name && input.name !== existingTld.name) {
          const nameConflict = await prisma.tldSettings.findFirst({
            where: {
              name: input.name,
              userId,
              id: { not: input.id },
            },
          });

          if (nameConflict) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `TLD setting for "${input.name}" already exists`,
            });
          }
        }

        // Prepare update data
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.nameserverGroupId !== undefined) updateData.nameserverGroupId = input.nameserverGroupId;
        if (input.marginType !== undefined) updateData.marginType = input.marginType;
        if (input.roundOff !== undefined) updateData.roundOff = input.roundOff;

        // Handle margin fields based on margin type
        if (marginType === "PERCENTAGE") {
          updateData.percentageMargin = input.percentageMargin ?? existingTld.percentageMargin;
          updateData.fixedMargin = null;
        } else if (marginType === "FIXED") {
          updateData.fixedMargin = input.fixedMargin ?? existingTld.fixedMargin;
          updateData.percentageMargin = null;
        }

        const updatedTld = await prisma.tldSettings.update({
          where: { id: input.id },
          data: updateData,
          include: {
            nameserverGroup: {
              include: {
                nameservers: true,
              },
            },
            _count: {
              select: {
                activityLogs: true,
              },
            },
          },
        });

        // Log the activity
        await prisma.tldSettingsActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            tldSettingId: updatedTld.id,
            action: "UPDATE",
            description: `Updated TLD setting for "${updatedTld.name}"`,
            createdAt: new Date(),
          },
        });

        return {
          success: true,
          data: transformTldSetting(updatedTld),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error updating TLD setting:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update TLD setting",
        });
      }
    }),

  // Delete a TLD setting
  delete: protectedProcedure
    .input(deleteTldSettingsSchema)
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        // Check if TLD setting exists and belongs to user
        const existingTld = await prisma.tldSettings.findFirst({
          where: {
            id: input.id,
            userId,
          },
        });

        if (!existingTld) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "TLD setting not found",
          });
        }

        // Delete the TLD setting
        await prisma.tldSettings.delete({
          where: { id: input.id },
        });

        // Log the activity
        await prisma.tldSettingsActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            tldSettingId: input.id,
            action: "DELETE",
            description: `Deleted TLD setting for "${existingTld.name}"`,
            createdAt: new Date(),
          },
        });

        return {
          success: true,
          message: "TLD setting deleted successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error deleting TLD setting:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete TLD setting",
        });
      }
    }),

  // Get activity logs for a TLD setting
  getActivityLogs: protectedProcedure
    .input(getActivityLogsSchema)
    .output(activityLogsResponseSchema)
    .query(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        // Check if TLD setting exists and belongs to user
        const existingTld = await prisma.tldSettings.findFirst({
          where: {
            id: input.id,
            userId,
          },
        });

        if (!existingTld) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "TLD setting not found",
          });
        }

        const [logs, total] = await Promise.all([
          prisma.tldSettingsActivityLog.findMany({
            where: {
              tldSettingId: input.id,
            },
            orderBy: { createdAt: "desc" },
            take: input.limit,
            skip: input.offset,
          }),
          prisma.tldSettingsActivityLog.count({
            where: {
              tldSettingId: input.id,
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

  // Bulk operations
  bulkDelete: protectedProcedure
    .input(bulkDeleteTldSettingsSchema)
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        // Check if all TLD settings exist and belong to user
        const existingTlds = await prisma.tldSettings.findMany({
          where: {
            id: { in: input.ids },
            userId,
          },
        });

        if (existingTlds.length !== input.ids.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more TLD settings not found",
          });
        }

        // Delete all TLD settings
        await prisma.tldSettings.deleteMany({
          where: {
            id: { in: input.ids },
            userId,
          },
        });

        // Log the activity
        await prisma.tldSettingsActivityLog.createMany({
          data: existingTlds.map((tld: any) => ({
            id: crypto.randomUUID(),
            userId,
            tldSettingId: tld.id,
            action: "DELETE",
            description: `Bulk deleted TLD setting for "${tld.name}"`,
            createdAt: new Date(),
          })),
        });

        return {
          success: true,
          message: `Successfully deleted ${existingTlds.length} TLD settings`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error bulk deleting TLD settings:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to bulk delete TLD settings",
        });
      }
    }),

  // Set a TLD setting as default
  setDefault: protectedProcedure
    .input(setDefaultTldSettingsSchema)
    .output(z.object({
      success: z.boolean(),
      data: tldSettingResponseSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session!.user!.id;

      try {
        // Check if TLD setting exists and belongs to user
        const existingTldSetting = await prisma.tldSettings.findFirst({
          where: {
            id: input.id,
            userId,
          },
        });

        if (!existingTldSetting) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "TLD setting not found",
          });
        }

        // Update existing default to false
        await prisma.tldSettings.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: { isDefault: false },
        });

        // Set new default
        const updatedTldSetting = await prisma.tldSettings.update({
          where: { id: input.id },
          data: { 
            isDefault: true,
            updatedAt: new Date(),
          },
          include: {
            nameserverGroup: {
              include: {
                nameservers: true,
              },
            },
            _count: {
              select: {
                activityLogs: true,
              },
            },
          },
        });

        // Log the activity
        await prisma.tldSettingsActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            tldSettingId: updatedTldSetting.id,
            action: "SET_DEFAULT",
            description: `Set TLD setting "${updatedTldSetting.name}" as default`,
            createdAt: new Date(),
          },
        });

        return {
          success: true,
          data: transformTldSetting(updatedTldSetting),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error setting default TLD setting:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to set default TLD setting",
        });
      }
    }),
});