import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
import { and, count, desc, eq, ilike, or } from "@npanel/db";
import { db } from "@npanel/db";
import {
  nameserver,
  nameserverGroup,
  nameserverGroupActivityLog,
  tldSettings,
} from "@npanel/db/schema/nameservers";
import { domain, domainTransfer } from "@npanel/db/schema/domains";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const isAgencyUserRole = (role: string | null | undefined) =>
  ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

const isAgencySuperAdminRole = (role: string | null | undefined) =>
  role === "AGENCY_SUPER_ADMIN";

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

type NameserverGroupWithRelations = {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  nameservers: {
    id: string;
    name: string;
    ipv4: string | null;
    ipv6: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
  counts: {
    tldSettings: number;
    domains: number;
    domainTransfers: number;
  };
};

type NameserverGroupWithTldSettings = NameserverGroupWithRelations & {
  tldSettings: {
    id: string;
    name: string;
    marginType: string | null;
    percentageMargin: string | null;
    fixedMargin: string | null;
  }[];
};

async function fetchNameserverGroupById(
  userId: string | undefined,
  groupId: string,
): Promise<NameserverGroupWithRelations | null> {
  const groupQuery = db
    .select()
    .from(nameserverGroup)
    .where(
      userId
        ? and(eq(nameserverGroup.id, groupId), eq(nameserverGroup.userId, userId))
        : eq(nameserverGroup.id, groupId),
    )
    .limit(1);
  const [groupRow] = await groupQuery;

  if (!groupRow) {
    return null;
  }

  const [nameserversRows, tldCountRes, domainsCountRes, transfersCountRes] =
    await Promise.all([
      db
        .select()
        .from(nameserver)
        .where(eq(nameserver.nameserverGroupId, groupId))
        .orderBy(nameserver.createdAt),
      db
        .select({ value: count() })
        .from(tldSettings)
        .where(eq(tldSettings.nameserverGroupId, groupId)),
      db
        .select({ value: count() })
        .from(domain)
        .where(eq(domain.nameserverGroupId, groupId)),
      db
        .select({ value: count() })
        .from(domainTransfer)
        .where(eq(domainTransfer.nameserverGroupId, groupId)),
    ]);

  return {
    id: groupRow.id,
    name: groupRow.name,
    description: groupRow.description,
    userId: groupRow.userId,
    isDefault: groupRow.isDefault,
    createdAt: groupRow.createdAt,
    updatedAt: groupRow.updatedAt,
    nameservers: nameserversRows,
    counts: {
      tldSettings: Number(tldCountRes[0]?.value ?? 0),
      domains: Number(domainsCountRes[0]?.value ?? 0),
      domainTransfers: Number(transfersCountRes[0]?.value ?? 0),
    },
  };
}

async function fetchNameserverGroupWithTldSettingsById(
  userId: string | undefined,
  groupId: string,
): Promise<NameserverGroupWithTldSettings | null> {
  const base = await fetchNameserverGroupById(userId, groupId);
  if (!base) return null;

  const tlds = await db
    .select({
      id: tldSettings.id,
      name: tldSettings.name,
      marginType: tldSettings.marginType,
      percentageMargin: tldSettings.percentageMargin,
      fixedMargin: tldSettings.fixedMargin,
    })
    .from(tldSettings)
    .where(eq(tldSettings.nameserverGroupId, groupId))
    .orderBy(tldSettings.name);

  return {
    ...base,
    tldSettings: tlds.map((tld) => ({
      id: tld.id,
      name: tld.name,
      marginType: tld.marginType,
      percentageMargin: tld.percentageMargin,
      fixedMargin: tld.fixedMargin,
    })),
  };
}

function transformNameserverGroup(group: NameserverGroupWithRelations) {
  const rawCount = group.counts;
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

function transformNameserverGroupWithTldSettings(
  group: NameserverGroupWithTldSettings,
) {
  return {
    ...transformNameserverGroup(group),
    tldSettings: (group.tldSettings || []).map((tld) => ({
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
        const now = new Date();

        const createdId = await db.transaction(async (tx) => {
          // If setting as default, clear existing default for this user
          if (input.isDefault) {
            await tx
              .update(nameserverGroup)
              .set({ isDefault: false, updatedAt: now })
              .where(and(eq(nameserverGroup.userId, userId), eq(nameserverGroup.isDefault, true)));
          }

          const groupId = crypto.randomUUID();

          await tx.insert(nameserverGroup).values({
            id: groupId,
            name: input.name,
            description: input.description ?? null,
            userId,
            isDefault: input.isDefault,
            createdAt: now,
            updatedAt: now,
          });

          if (input.nameservers.length > 0) {
            await tx.insert(nameserver).values(
              input.nameservers.map((ns) => ({
                id: crypto.randomUUID(),
                nameserverGroupId: groupId,
                name: ns.name,
                ipv4: ns.ipv4 ?? null,
                ipv6: ns.ipv6 ?? null,
                createdAt: now,
                updatedAt: now,
              })),
            );
          }

          await tx.insert(nameserverGroupActivityLog).values({
            id: crypto.randomUUID(),
            userId,
            nameserverGroupId: groupId,
            action: "CREATE",
            description: `Created nameserver group "${input.name}" with ${input.nameservers.length} nameservers`,
            metadata: null,
            ipAddress: null,
            userAgent: null,
            createdAt: now,
          });

          return groupId;
        });

        const groupWithRelations = await fetchNameserverGroupById(userId, createdId);

        if (!groupWithRelations) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to load created nameserver group",
          });
        }

        return {
          success: true,
          data: transformNameserverGroup(groupWithRelations),
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
      const userRole = session?.user?.role;

      try {
        const groupWithRelations = await fetchNameserverGroupWithTldSettingsById(
          isAgencyUserRole(userRole) ? undefined : userId,
          input.id,
        );

        if (!groupWithRelations) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nameserver group not found",
          });
        }

        return {
          success: true,
          data: transformNameserverGroupWithTldSettings(groupWithRelations),
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
      const userRole = session?.user?.role;

      try {
        const baseConditions: ReturnType<typeof and>[] = [];

        if (!isAgencyUserRole(userRole)) {
          baseConditions.push(eq(nameserverGroup.userId, userId));
        }

        if (input.search) {
          const pattern = `%${input.search}%`;
          baseConditions.push(
            or(
              ilike(nameserverGroup.name, pattern),
              ilike(nameserverGroup.description, pattern),
            ),
          );
        }

        const [groups, totalRes] = await Promise.all([
          db
            .select()
            .from(nameserverGroup)
            .where(and(...baseConditions))
            .orderBy(
              desc(nameserverGroup.isDefault),
              desc(nameserverGroup.createdAt),
            )
            .limit(input.limit)
            .offset(input.offset),
          db
            .select({ value: count() })
            .from(nameserverGroup)
            .where(and(...baseConditions)),
        ]);

        const detailedGroups: NameserverGroupWithRelations[] = await Promise.all(
          groups.map(async (group) => {
            const base = await fetchNameserverGroupById(undefined, group.id);
            // `fetchNameserverGroupById` already filters by userId, but be safe
            if (!base) {
              return {
                id: group.id,
                name: group.name,
                description: group.description,
                userId: group.userId,
                isDefault: group.isDefault,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt,
                nameservers: [],
                counts: {
                  tldSettings: 0,
                  domains: 0,
                  domainTransfers: 0,
                },
              };
            }
            return base;
          }),
        );

        const total = Number(totalRes[0]?.value ?? 0);

        return {
          success: true,
          data: detailedGroups.map(transformNameserverGroup),
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
      const userRole = session?.user?.role;

      try {
        // Check if nameserver group exists and belongs to user
        const existingGroup = await fetchNameserverGroupById(undefined, input.id);

        if (!existingGroup) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nameserver group not found",
          });
        }
        if (!isAgencySuperAdminRole(userRole) && existingGroup.userId !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the nameserver group owner can modify it",
          });
        }

        // Check if user is trying to set as default and there's already a default
        const now = new Date();

        await db.transaction(async (tx) => {
          // Ensure only one default per user
          if (input.isDefault && !existingGroup.isDefault) {
            await tx
              .update(nameserverGroup)
              .set({ isDefault: false, updatedAt: now })
              .where(
              and(eq(nameserverGroup.userId, userId), eq(nameserverGroup.isDefault, true)),
              );
          }

          const updateData: Partial<typeof nameserverGroup.$inferInsert> = {
            updatedAt: now,
          };

          if (input.name !== undefined) updateData.name = input.name;
          if (input.description !== undefined)
            updateData.description = input.description;
          if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

          await tx
            .update(nameserverGroup)
            .set(updateData)
            .where(
              and(
                eq(nameserverGroup.id, input.id),
                eq(nameserverGroup.userId, userId),
              ),
            );

          if (input.nameservers) {
            await tx
              .delete(nameserver)
              .where(eq(nameserver.nameserverGroupId, input.id));

            await tx.insert(nameserver).values(
              input.nameservers.map((ns) => ({
                id: crypto.randomUUID(),
                nameserverGroupId: input.id,
                name: ns.name,
                ipv4: ns.ipv4 ?? null,
                ipv6: ns.ipv6 ?? null,
                createdAt: now,
                updatedAt: now,
              })),
            );
          }

          await tx.insert(nameserverGroupActivityLog).values({
            id: crypto.randomUUID(),
            userId,
            nameserverGroupId: input.id,
            action: "UPDATE",
            description: `Updated nameserver group "${
              input.name ?? existingGroup.name
            }"`,
            metadata: null,
            ipAddress: null,
            userAgent: null,
            createdAt: now,
          });
        });

        const updatedGroup = await fetchNameserverGroupById(userId, input.id);

        if (!updatedGroup) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to load updated nameserver group",
          });
        }

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
      const userRole = session?.user?.role;

      try {
        // Check if nameserver group exists and belongs to user
        const existingGroup = await fetchNameserverGroupById(undefined, input.id);

        if (!existingGroup) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nameserver group not found",
          });
        }
        if (!isAgencySuperAdminRole(userRole) && existingGroup.userId !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the nameserver group owner can delete it",
          });
        }

        // Check if group is being used
        const totalUsage =
          existingGroup.counts.tldSettings +
          existingGroup.counts.domains +
          existingGroup.counts.domainTransfers;

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
        const now = new Date();

        await db.transaction(async (tx) => {
          await tx
            .delete(nameserverGroup)
            .where(eq(nameserverGroup.id, input.id));

          await tx.insert(nameserverGroupActivityLog).values({
            id: crypto.randomUUID(),
            userId,
            nameserverGroupId: input.id,
            action: "DELETE",
            description: `Deleted nameserver group "${existingGroup.name}"`,
            metadata: null,
            ipAddress: null,
            userAgent: null,
            createdAt: now,
          });
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
      const userRole = session?.user?.role;

      try {
        // Check if nameserver group exists and belongs to user
        const [existingGroupRow] = await db
          .select()
          .from(nameserverGroup)
          .where(eq(nameserverGroup.id, input.id))
          .limit(1);

        if (!existingGroupRow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nameserver group not found",
          });
        }
        if (!isAgencySuperAdminRole(userRole) && existingGroupRow.userId !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the nameserver group owner can set default",
          });
        }

        const now = new Date();

        await db.transaction(async (tx) => {
          await tx
            .update(nameserverGroup)
            .set({ isDefault: false, updatedAt: now })
            .where(and(eq(nameserverGroup.userId, existingGroupRow.userId), eq(nameserverGroup.isDefault, true)));

          await tx
            .update(nameserverGroup)
            .set({ isDefault: true, updatedAt: now })
            .where(eq(nameserverGroup.id, input.id));

          await tx.insert(nameserverGroupActivityLog).values({
            id: crypto.randomUUID(),
            userId,
            nameserverGroupId: input.id,
            action: "SET_DEFAULT",
            description: `Set nameserver group "${existingGroupRow.name}" as default`,
            metadata: null,
            ipAddress: null,
            userAgent: null,
            createdAt: now,
          });
        });

        const updatedGroup = await fetchNameserverGroupById(existingGroupRow.userId, input.id);

        if (!updatedGroup) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to load updated nameserver group",
          });
        }

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
      const userRole = session?.user?.role;

      try {
        // Check if nameserver group exists and belongs to user
        const existingGroupRow = await db
          .select({ id: nameserverGroup.id })
          .from(nameserverGroup)
          .where(eq(nameserverGroup.id, input.id))
          .limit(1);

        if (!existingGroupRow[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nameserver group not found",
          });
        }
        if (!isAgencyUserRole(userRole)) {
          const ownerCheck = await db
            .select({ userId: nameserverGroup.userId })
            .from(nameserverGroup)
            .where(eq(nameserverGroup.id, input.id))
            .limit(1);
          if (ownerCheck[0]?.userId !== userId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You do not have access to these activity logs",
            });
          }
        }

        const [logs, totalRes] = await Promise.all([
          db
            .select()
            .from(nameserverGroupActivityLog)
            .where(eq(nameserverGroupActivityLog.nameserverGroupId, input.id))
            .orderBy(desc(nameserverGroupActivityLog.createdAt))
            .limit(input.limit)
            .offset(input.offset),
          db
            .select({ value: count() })
            .from(nameserverGroupActivityLog)
            .where(eq(nameserverGroupActivityLog.nameserverGroupId, input.id)),
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
});