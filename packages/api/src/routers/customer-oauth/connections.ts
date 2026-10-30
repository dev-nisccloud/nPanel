/**
 * Customer OAuth Connections Router
 * Manages OAuth connection lifecycle and monitoring
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, desc, count, sql } from "drizzle-orm";

import { router, protectedProcedure } from "../../trpc";
import {
  customerOAuthConnection,
  customerPlatformAsset,
  customerOAuthActivityLog,
} from "@npanel/db/schema";
import { isSuperAdmin } from "../../lib/oauth-error-handler";

export const customerOAuthConnectionsRouter = router({
  /**
   * List all OAuth connections for current user
   */
  list: protectedProcedure
    .input(
      z
        .object({
          platform: z.enum(["meta_facebook", "meta_facebook_pages", "google_ads", "linkedin_ads"]).optional(),
          status: z
            .enum(["ACTIVE", "EXPIRED", "REVOKED", "ERROR", "PENDING_SELECTION"])
            .optional(),
          includeInactive: z.boolean().default(false),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const conditions = [eq(customerOAuthConnection.userId, userId)];

      if (input?.platform) {
        conditions.push(eq(customerOAuthConnection.platform, input.platform));
      }

      if (input?.status) {
        conditions.push(eq(customerOAuthConnection.status, input.status));
      }

      if (!input?.includeInactive) {
        conditions.push(
          sql`${customerOAuthConnection.status} != 'REVOKED'`
        );
      }

      const connections = await ctx.db.query.customerOAuthConnection.findMany({
        where: and(...conditions),
        orderBy: [desc(customerOAuthConnection.createdAt)],
      });

      // Get asset counts for each connection
      const connectionsWithCounts = await Promise.all(
        connections.map(async (connection) => {
          const [assetCountResult] = await ctx.db
            .select({ count: count() })
            .from(customerPlatformAsset)
            .where(eq(customerPlatformAsset.connectionId, connection.id));

          const [activeAssetCountResult] = await ctx.db
            .select({ count: count() })
            .from(customerPlatformAsset)
            .where(
              and(
                eq(customerPlatformAsset.connectionId, connection.id),
                eq(customerPlatformAsset.isActive, true)
              )
            );

          return {
            ...connection,
            // Don't expose encrypted tokens or cached page tokens
            accessToken: undefined,
            refreshToken: undefined,
            selectionData: undefined,
            assetCount: assetCountResult.count,
            activeAssetCount: activeAssetCountResult.count,
            needsAction:
              connection.requiresReconnect || connection.awaitingAccountSelection,
          };
        })
      );

      return connectionsWithCounts;
    }),

  /**
   * Get single connection details
   */
  get: protectedProcedure
    .input(
      z.object({
        connectionId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const connection = await ctx.db.query.customerOAuthConnection.findFirst({
        where: and(
          eq(customerOAuthConnection.id, input.connectionId),
          eq(customerOAuthConnection.userId, ctx.session.user.id)
        ),
      });

      if (!connection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "OAuth connection not found",
        });
      }

      // Get related assets
      const assets = await ctx.db.query.customerPlatformAsset.findMany({
        where: eq(customerPlatformAsset.connectionId, input.connectionId),
        orderBy: [desc(customerPlatformAsset.createdAt)],
      });

      // Get recent activity
      const recentActivity = await ctx.db.query.customerOAuthActivityLog.findMany({
        where: eq(customerOAuthActivityLog.connectionId, input.connectionId),
        orderBy: [desc(customerOAuthActivityLog.createdAt)],
        limit: 10,
      });

      return {
        ...connection,
        // Don't expose encrypted tokens or cached page tokens
        accessToken: undefined,
        refreshToken: undefined,
        selectionData: undefined,
        assets: assets.map((asset) => ({
          ...asset,
          assetAccessToken: undefined, // Don't expose page tokens
        })),
        recentActivity: recentActivity.map((activity) => ({
          ...activity,
          // Show error details only to super admins
          errorMessage: isSuperAdmin(ctx) ? activity.errorMessage : undefined,
        })),
        needsAction:
          connection.requiresReconnect || connection.awaitingAccountSelection,
      };
    }),

  /**
   * Get connection health status
   */
  getHealth: protectedProcedure
    .input(
      z.object({
        connectionId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const connection = await ctx.db.query.customerOAuthConnection.findFirst({
        where: and(
          eq(customerOAuthConnection.id, input.connectionId),
          eq(customerOAuthConnection.userId, ctx.session.user.id)
        ),
      });

      if (!connection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "OAuth connection not found",
        });
      }

      const now = new Date();
      const tokenExpiry = connection.tokenExpiresAt;

      // Calculate health metrics
      const isExpired = tokenExpiry ? now > tokenExpiry : false;
      const isExpiringSoon = tokenExpiry
        ? now > new Date(tokenExpiry.getTime() - 7 * 24 * 60 * 60 * 1000)
        : false;

      const daysSinceVerification = connection.lastVerifiedAt
        ? Math.floor(
            (now.getTime() - connection.lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;

      const needsVerification = daysSinceVerification && daysSinceVerification > 7;

      let healthStatus: "healthy" | "warning" | "error" = "healthy";

      if (
        connection.status === "REVOKED" ||
        connection.status === "ERROR" ||
        isExpired
      ) {
        healthStatus = "error";
      } else if (
        isExpiringSoon ||
        needsVerification ||
        connection.requiresReconnect ||
        connection.errorCount > 3
      ) {
        healthStatus = "warning";
      }

      return {
        status: healthStatus,
        connectionStatus: connection.status,
        isExpired,
        isExpiringSoon,
        tokenExpiresAt: connection.tokenExpiresAt,
        daysUntilExpiry: tokenExpiry
          ? Math.floor((tokenExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        daysSinceVerification,
        needsVerification,
        errorCount: connection.errorCount,
        lastError: isSuperAdmin(ctx) ? connection.lastError : undefined,
        requiresReconnect: connection.requiresReconnect,
        awaitingAccountSelection: connection.awaitingAccountSelection,
      };
    }),

  /**
   * Get connection activity log
   */
  getActivity: protectedProcedure
    .input(
      z.object({
        connectionId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const connection = await ctx.db.query.customerOAuthConnection.findFirst({
        where: and(
          eq(customerOAuthConnection.id, input.connectionId),
          eq(customerOAuthConnection.userId, ctx.session.user.id)
        ),
      });

      if (!connection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "OAuth connection not found",
        });
      }

      const activity = await ctx.db.query.customerOAuthActivityLog.findMany({
        where: eq(customerOAuthActivityLog.connectionId, input.connectionId),
        orderBy: [desc(customerOAuthActivityLog.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(customerOAuthActivityLog)
        .where(eq(customerOAuthActivityLog.connectionId, input.connectionId));

      return {
        items: activity.map((item) => ({
          ...item,
          // Show error details only to super admins
          errorMessage: isSuperAdmin(ctx) ? item.errorMessage : undefined,
        })),
        total: totalResult.count,
        hasMore: input.offset + input.limit < totalResult.count,
      };
    }),

  /**
   * Get aggregated OAuth statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Count connections by status
    const statusCounts = await ctx.db
      .select({
        status: customerOAuthConnection.status,
        count: count(),
      })
      .from(customerOAuthConnection)
      .where(eq(customerOAuthConnection.userId, userId))
      .groupBy(customerOAuthConnection.status);

    // Count assets by type
    const assetTypeCounts = await ctx.db
      .select({
        assetType: customerPlatformAsset.assetType,
        count: count(),
      })
      .from(customerPlatformAsset)
      .where(
        and(
          eq(customerPlatformAsset.userId, userId),
          eq(customerPlatformAsset.isActive, true)
        )
      )
      .groupBy(customerPlatformAsset.assetType);

    // Get connections needing action
    const connectionsNeedingAction = await ctx.db.query.customerOAuthConnection.findMany({
      where: and(
        eq(customerOAuthConnection.userId, userId),
        sql`(${customerOAuthConnection.requiresReconnect} = true OR ${customerOAuthConnection.awaitingAccountSelection} = true)`
      ),
      columns: {
        id: true,
        platform: true,
        displayName: true,
        requiresReconnect: true,
        awaitingAccountSelection: true,
      },
    });

    return {
      statusCounts: statusCounts.reduce(
        (acc, { status, count }) => {
          if (status) {
            acc[status] = count;
          }
          return acc;
        },
        {} as Record<string, number>
      ),
      assetTypeCounts: assetTypeCounts.reduce(
        (acc, { assetType, count }) => {
          if (assetType) {
            acc[assetType] = count;
          }
          return acc;
        },
        {} as Record<string, number>
      ),
      connectionsNeedingAction,
      totalConnections: statusCounts.reduce((sum, { count }) => sum + count, 0),
      totalAssets: assetTypeCounts.reduce((sum, { count }) => sum + count, 0),
    };
  }),

  /**
   * Delete connection and all related assets
   * (Soft delete - marks as REVOKED)
   */
  delete: protectedProcedure
    .input(
      z.object({
        connectionId: z.string(),
        hardDelete: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const connection = await ctx.db.query.customerOAuthConnection.findFirst({
        where: and(
          eq(customerOAuthConnection.id, input.connectionId),
          eq(customerOAuthConnection.userId, ctx.session.user.id)
        ),
      });

      if (!connection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "OAuth connection not found",
        });
      }

      if (input.hardDelete) {
        // Hard delete (only super admins should be able to do this)
        if (!isSuperAdmin(ctx)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only super admins can permanently delete connections",
          });
        }

        // Delete in correct order due to foreign keys
        await ctx.db
          .delete(customerPlatformAsset)
          .where(eq(customerPlatformAsset.connectionId, input.connectionId));

        await ctx.db
          .delete(customerOAuthActivityLog)
          .where(eq(customerOAuthActivityLog.connectionId, input.connectionId));

        await ctx.db
          .delete(customerOAuthConnection)
          .where(eq(customerOAuthConnection.id, input.connectionId));
      } else {
        // Soft delete - mark as revoked
        await ctx.db
          .update(customerOAuthConnection)
          .set({
            status: "REVOKED",
            requiresReconnect: true,
            updatedAt: new Date(),
          })
          .where(eq(customerOAuthConnection.id, input.connectionId));

        // Deactivate assets
        await ctx.db
          .update(customerPlatformAsset)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(customerPlatformAsset.connectionId, input.connectionId));
      }

      // Log activity
      await ctx.db.insert(customerOAuthActivityLog).values({
        id: crypto.randomUUID(),
        connectionId: input.connectionId,
        userId: ctx.session.user.id,
        action: input.hardDelete ? "hard_delete" : "delete",
        status: "SUCCESS",
        description: `Deleted connection (${input.hardDelete ? "permanent" : "soft"})`,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return {
        success: true,
      };
    }),
});
