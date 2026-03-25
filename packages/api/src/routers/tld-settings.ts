import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
import { and, count, desc, eq, ilike, inArray, ne } from "@npanel/db";
import { db } from "@npanel/db";
import {
  nameserver,
  nameserverGroup,
  tldSettings,
  tldSettingsActivityLog,
} from "@npanel/db/schema/nameservers";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

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

type NameserverGroupReference = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  nameservers: {
    id: string;
    name: string;
    ipv4: string | null;
    ipv6: string | null;
  }[];
};

type TldSettingWithRelations = {
  id: string;
  name: string;
  userId: string;
  nameserverGroupId: string | null;
  marginType: string | null;
  percentageMargin: string | null;
  fixedMargin: string | null;
  roundOff: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  nameserverGroup: NameserverGroupReference | null;
  counts: {
    activityLogs: number;
  };
};

async function fetchNameserverGroupReference(
  groupId: string,
): Promise<NameserverGroupReference | null> {
  const [groupRow] = await db
    .select({
      id: nameserverGroup.id,
      name: nameserverGroup.name,
      description: nameserverGroup.description,
      isDefault: nameserverGroup.isDefault,
    })
    .from(nameserverGroup)
    .where(eq(nameserverGroup.id, groupId))
    .limit(1);

  if (!groupRow) return null;

  const nameservers = await db
    .select({
      id: nameserver.id,
      name: nameserver.name,
      ipv4: nameserver.ipv4,
      ipv6: nameserver.ipv6,
    })
    .from(nameserver)
    .where(eq(nameserver.nameserverGroupId, groupId))
    .orderBy(nameserver.createdAt);

  return {
    ...groupRow,
    nameservers,
  };
}

async function fetchTldSettingById(
  id: string,
): Promise<TldSettingWithRelations | null> {
  const [row] = await db.select().from(tldSettings).where(eq(tldSettings.id, id)).limit(1);

  if (!row) return null;

  const [groupRef, logsCountRes] = await Promise.all([
    row.nameserverGroupId ? fetchNameserverGroupReference(row.nameserverGroupId) : Promise.resolve(null),
    db
      .select({ value: count() })
      .from(tldSettingsActivityLog)
      .where(eq(tldSettingsActivityLog.tldSettingId, id)),
  ]);

  return {
    id: row.id,
    name: row.name,
    userId: row.userId,
    nameserverGroupId: row.nameserverGroupId,
    marginType: row.marginType,
    percentageMargin: row.percentageMargin,
    fixedMargin: row.fixedMargin,
    roundOff: row.roundOff,
    isDefault: row.isDefault,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    nameserverGroup: groupRef,
    counts: {
      activityLogs: Number(logsCountRes[0]?.value ?? 0),
    },
  };
}

function transformTldSetting(tldSetting: TldSettingWithRelations) {
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
    _count: {
      activityLogs: tldSetting.counts.activityLogs ?? 0,
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
        const [existingTld] = await db
          .select({ id: tldSettings.id })
          .from(tldSettings)
          .where(and(eq(tldSettings.name, input.name), eq(tldSettings.userId, userId)))
          .limit(1);

        if (existingTld) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `TLD setting for "${input.name}" already exists`,
          });
        }

        // Validate nameserver group if provided
        if (input.nameserverGroupId) {
          const [groupRow] = await db
            .select({ id: nameserverGroup.id })
            .from(nameserverGroup)
            .where(
              and(
                eq(nameserverGroup.id, input.nameserverGroupId),
                eq(nameserverGroup.userId, userId),
              ),
            )
            .limit(1);

          if (!groupRow) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Nameserver group not found",
            });
          }
        }

        const now = new Date();

        const createdId = await db.transaction(async (tx) => {
          const id = crypto.randomUUID();

          await tx.insert(tldSettings).values({
            id,
            name: input.name,
            userId,
            nameserverGroupId: input.nameserverGroupId ?? null,
            marginType: input.marginType ?? null,
            percentageMargin:
              input.marginType === "PERCENTAGE" ? input.percentageMargin ?? null : null,
            fixedMargin: input.marginType === "FIXED" ? input.fixedMargin ?? null : null,
            roundOff: input.roundOff ?? null,
            isDefault: false,
            createdAt: now,
            updatedAt: now,
          });

          await tx.insert(tldSettingsActivityLog).values({
            id: crypto.randomUUID(),
            userId,
            tldSettingId: id,
            action: "CREATE",
            description: `Created TLD setting for "${input.name}"`,
            metadata: null,
            ipAddress: null,
            userAgent: null,
            createdAt: now,
          });

          return id;
        });

        const created = await fetchTldSettingById(createdId);

        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Created TLD setting could not be fetched",
          });
        }

        return {
          success: true,
          data: transformTldSetting(created),
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
  // Global settings - available to all users regardless of role
  get: protectedProcedure
    .input(getTldSettingsSchema)
    .output(z.object({
      success: z.boolean(),
      data: tldSettingResponseSchema,
    }))
    .query(async ({ input }) => {
      try {
        const tldSetting = await fetchTldSettingById(input.id);

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

  // Get default TLD setting (P0-2: Optimized endpoint for pricing calculations)
  // This endpoint is optimized to fetch only the default setting, reducing payload by ~95%
  getDefault: protectedProcedure
    .output(z.object({
      success: z.boolean(),
      data: tldSettingResponseSchema.nullable(),
    }))
    .query(async () => {
      try {
        const [defaultRow] = await db
          .select({ id: tldSettings.id })
          .from(tldSettings)
          .where(eq(tldSettings.isDefault, true))
          .limit(1);

        const defaultSetting = defaultRow ? await fetchTldSettingById(defaultRow.id) : null;

        return {
          success: true,
          data: defaultSetting ? transformTldSetting(defaultSetting) : null,
        };
      } catch (error) {
        console.error("Error fetching default TLD setting:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch default TLD setting",
        });
      }
    }),

  // List TLD settings
  // Global settings - available to all users regardless of role
  list: protectedProcedure
    .input(listTldSettingsSchema)
    .output(tldSettingListResponseSchema)
    .query(async ({ input }) => {
      try {
        const conditions: ReturnType<typeof and>[] = [];

        if (input.search) {
          conditions.push(ilike(tldSettings.name, `%${input.search}%`));
        }
        if (input.marginType) {
          conditions.push(eq(tldSettings.marginType, input.marginType));
        }
        if (input.nameserverGroupId) {
          conditions.push(eq(tldSettings.nameserverGroupId, input.nameserverGroupId));
        }

        const whereClause = conditions.length ? and(...conditions) : undefined;

        const [rows, totalRes] = await Promise.all([
          db
            .select()
            .from(tldSettings)
            .where(whereClause)
            .orderBy(desc(tldSettings.createdAt))
            .limit(input.limit)
            .offset(input.offset),
          db.select({ value: count() }).from(tldSettings).where(whereClause),
        ]);

        const hydrated: TldSettingWithRelations[] = await Promise.all(
          rows.map(async (row) => {
            const full = await fetchTldSettingById(row.id);
            // should never be null since row exists
            return (
              full ?? {
                id: row.id,
                name: row.name,
                userId: row.userId,
                nameserverGroupId: row.nameserverGroupId,
                marginType: row.marginType,
                percentageMargin: row.percentageMargin,
                fixedMargin: row.fixedMargin,
                roundOff: row.roundOff,
                isDefault: row.isDefault,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                nameserverGroup: null,
                counts: { activityLogs: 0 },
              }
            );
          }),
        );

        const total = Number(totalRes[0]?.value ?? 0);

        return {
          success: true,
          data: hydrated.map(transformTldSetting),
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
        const [existingTld] = await db
          .select()
          .from(tldSettings)
          .where(and(eq(tldSettings.id, input.id), eq(tldSettings.userId, userId)))
          .limit(1);

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
          const [groupRow] = await db
            .select({ id: nameserverGroup.id })
            .from(nameserverGroup)
            .where(
              and(
                eq(nameserverGroup.id, input.nameserverGroupId),
                eq(nameserverGroup.userId, userId),
              ),
            )
            .limit(1);

          if (!groupRow) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Nameserver group not found",
            });
          }
        }

        // Check for name conflicts if name is being changed
        if (input.name && input.name !== existingTld.name) {
          const [nameConflict] = await db
            .select({ id: tldSettings.id })
            .from(tldSettings)
            .where(
              and(
                eq(tldSettings.name, input.name),
                eq(tldSettings.userId, userId),
                ne(tldSettings.id, input.id),
              ),
            )
            .limit(1);

          if (nameConflict) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `TLD setting for "${input.name}" already exists`,
            });
          }
        }

        const now = new Date();

        await db.transaction(async (tx) => {
          const updateData: Partial<typeof tldSettings.$inferInsert> = {
            updatedAt: now,
          };

          if (input.name !== undefined) updateData.name = input.name;
          if (input.nameserverGroupId !== undefined)
            updateData.nameserverGroupId = input.nameserverGroupId;
          if (input.marginType !== undefined) updateData.marginType = input.marginType;
          if (input.roundOff !== undefined) updateData.roundOff = input.roundOff;

          if (marginType === "PERCENTAGE") {
            updateData.percentageMargin =
              input.percentageMargin ?? existingTld.percentageMargin;
            updateData.fixedMargin = null;
          } else if (marginType === "FIXED") {
            updateData.fixedMargin = input.fixedMargin ?? existingTld.fixedMargin;
            updateData.percentageMargin = null;
          }

          await tx
            .update(tldSettings)
            .set(updateData)
            .where(and(eq(tldSettings.id, input.id), eq(tldSettings.userId, userId)));

          await tx.insert(tldSettingsActivityLog).values({
            id: crypto.randomUUID(),
            userId,
            tldSettingId: input.id,
            action: "UPDATE",
            description: `Updated TLD setting for "${input.name ?? existingTld.name}"`,
            metadata: null,
            ipAddress: null,
            userAgent: null,
            createdAt: now,
          });
        });

        const updatedTld = await fetchTldSettingById(input.id);

        if (!updatedTld) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Updated TLD setting could not be fetched",
          });
        }

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
        const [existingTld] = await db
          .select()
          .from(tldSettings)
          .where(and(eq(tldSettings.id, input.id), eq(tldSettings.userId, userId)))
          .limit(1);

        if (!existingTld) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "TLD setting not found",
          });
        }

        const now = new Date();

        await db.transaction(async (tx) => {
          await tx
            .delete(tldSettings)
            .where(and(eq(tldSettings.id, input.id), eq(tldSettings.userId, userId)));

          await tx.insert(tldSettingsActivityLog).values({
            id: crypto.randomUUID(),
            userId,
            tldSettingId: input.id,
            action: "DELETE",
            description: `Deleted TLD setting for "${existingTld.name}"`,
            metadata: null,
            ipAddress: null,
            userAgent: null,
            createdAt: now,
          });
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
        const [existingTld] = await db
          .select({ id: tldSettings.id })
          .from(tldSettings)
          .where(and(eq(tldSettings.id, input.id), eq(tldSettings.userId, userId)))
          .limit(1);

        if (!existingTld) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "TLD setting not found",
          });
        }

        const [logs, totalRes] = await Promise.all([
          db
            .select()
            .from(tldSettingsActivityLog)
            .where(eq(tldSettingsActivityLog.tldSettingId, input.id))
            .orderBy(desc(tldSettingsActivityLog.createdAt))
            .limit(input.limit)
            .offset(input.offset),
          db
            .select({ value: count() })
            .from(tldSettingsActivityLog)
            .where(eq(tldSettingsActivityLog.tldSettingId, input.id)),
        ]);

        const total = Number(totalRes[0]?.value ?? 0);

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
        const existingTlds = await db
          .select({ id: tldSettings.id, name: tldSettings.name })
          .from(tldSettings)
          .where(and(inArray(tldSettings.id, input.ids), eq(tldSettings.userId, userId)));

        if (existingTlds.length !== input.ids.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more TLD settings not found",
          });
        }

        const now = new Date();

        await db.transaction(async (tx) => {
          await tx
            .delete(tldSettings)
            .where(and(inArray(tldSettings.id, input.ids), eq(tldSettings.userId, userId)));

          await tx.insert(tldSettingsActivityLog).values(
            existingTlds.map((tld) => ({
              id: crypto.randomUUID(),
              userId,
              tldSettingId: tld.id,
              action: "DELETE",
              description: `Bulk deleted TLD setting for "${tld.name}"`,
              metadata: null,
              ipAddress: null,
              userAgent: null,
              createdAt: now,
            })),
          );
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
        const [existingTldSetting] = await db
          .select({ id: tldSettings.id, name: tldSettings.name })
          .from(tldSettings)
          .where(and(eq(tldSettings.id, input.id), eq(tldSettings.userId, userId)))
          .limit(1);

        if (!existingTldSetting) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "TLD setting not found",
          });
        }

        const now = new Date();

        await db.transaction(async (tx) => {
          await tx
            .update(tldSettings)
            .set({ isDefault: false, updatedAt: now })
            .where(and(eq(tldSettings.userId, userId), eq(tldSettings.isDefault, true)));

          await tx
            .update(tldSettings)
            .set({ isDefault: true, updatedAt: now })
            .where(and(eq(tldSettings.id, input.id), eq(tldSettings.userId, userId)));

          await tx.insert(tldSettingsActivityLog).values({
            id: crypto.randomUUID(),
            userId,
            tldSettingId: input.id,
            action: "SET_DEFAULT",
            description: `Set TLD setting "${existingTldSetting.name}" as default`,
            metadata: null,
            ipAddress: null,
            userAgent: null,
            createdAt: now,
          });
        });

        const updatedTldSetting = await fetchTldSettingById(input.id);

        if (!updatedTldSetting) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Updated TLD setting could not be fetched",
          });
        }

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