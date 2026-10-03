/**
 * Customer OAuth Assets Router
 * Manages platform assets (pages, ad accounts, etc.)
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, desc, count, inArray } from "drizzle-orm";
import { router, protectedProcedure } from "../../trpc";
import {
  customerPlatformAsset,
  customerOAuthConnection,
  customerAssetMapping,
  customerOAuthActivityLog,
} from "@npanel/db/schema";
import {
  MetaOAuthProvider,
  MetaProviderError,
} from "../../lib/meta-oauth-provider";
import {
  decryptToken,
  encryptToken,
} from "../../lib/oauth-encryption";
import {
  createOAuthError,
  isSuperAdmin,
} from "../../lib/oauth-error-handler";

const metaProvider = new MetaOAuthProvider();

export const customerOAuthAssetsRouter = router({
  /**
   * List all assets for current user
   */
  list: protectedProcedure
    .input(
      z
        .object({
          connectionId: z.string().optional(),
          platform: z.enum(["meta_facebook", "google_ads", "linkedin_ads"]).optional(),
          assetType: z.string().optional(),
          isActive: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const conditions = [eq(customerPlatformAsset.userId, userId)];

      if (input?.connectionId) {
        conditions.push(eq(customerPlatformAsset.connectionId, input.connectionId));
      }

      if (input?.platform) {
        conditions.push(eq(customerPlatformAsset.platform, input.platform));
      }

      if (input?.assetType) {
        conditions.push(eq(customerPlatformAsset.assetType, input.assetType));
      }

      if (input?.isActive !== undefined) {
        conditions.push(eq(customerPlatformAsset.isActive, input.isActive));
      }

      const assets = await ctx.db.query.customerPlatformAsset.findMany({
        where: and(...conditions),
        orderBy: [desc(customerPlatformAsset.createdAt)],
        with: {
          connection: {
            columns: {
              id: true,
              platform: true,
              displayName: true,
              status: true,
            },
          },
        },
      });

      return assets.map((asset) => ({
        ...asset,
        // Don't expose encrypted tokens
        assetAccessToken: undefined,
      }));
    }),

  /**
   * Get single asset details
   */
  get: protectedProcedure
    .input(
      z.object({
        assetId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const asset = await ctx.db.query.customerPlatformAsset.findFirst({
        where: and(
          eq(customerPlatformAsset.id, input.assetId),
          eq(customerPlatformAsset.userId, ctx.session.user.id)
        ),
        with: {
          connection: true,
          mappings: true,
        },
      });

      if (!asset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Asset not found",
        });
      }

      // Get usage stats
      const [usageStatsResult] = await ctx.db
        .select({ count: count() })
        .from(customerOAuthActivityLog)
        .where(eq(customerOAuthActivityLog.assetId, input.assetId));

      return {
        ...asset,
        // Don't expose encrypted tokens
        assetAccessToken: undefined,
        connection: {
          ...asset.connection,
          accessToken: undefined,
          refreshToken: undefined,
        },
        usageCount: usageStatsResult.count,
      };
    }),

  /**
   * Refresh asset data from platform
   */
  refresh: protectedProcedure
    .input(
      z.object({
        assetId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const asset = await ctx.db.query.customerPlatformAsset.findFirst({
        where: and(
          eq(customerPlatformAsset.id, input.assetId),
          eq(customerPlatformAsset.userId, ctx.session.user.id)
        ),
        with: {
          connection: true,
        },
      });

      if (!asset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Asset not found",
        });
      }

      if (!asset.connection) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Asset connection not found",
        });
      }

      if (asset.connection.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Connection is not active. Please reconnect.",
        });
      }

      try {
        const decryptedToken = decryptToken(asset.connection.accessToken);

        let updatedAsset;

        // Refresh based on platform
        switch (asset.platform) {
          case "meta_facebook": {
            // Fetch fresh asset data from Meta
            const allAssets = await metaProvider.fetchAllAssets(decryptedToken);

            updatedAsset = allAssets.find(
              (a) => a.platformAssetId === asset.platformAssetId
            );

            if (!updatedAsset) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Asset no longer exists on the platform",
              });
            }

            // Update in database
            await ctx.db
              .update(customerPlatformAsset)
              .set({
                name: updatedAsset.name,
                username: updatedAsset.username,
                profilePictureUrl: updatedAsset.profilePictureUrl,
                description: updatedAsset.description,
                permissions: updatedAsset.permissions,
                capabilities: updatedAsset.capabilities,
                assetAccessToken: updatedAsset.accountAccessToken
                  ? encryptToken(updatedAsset.accountAccessToken)
                  : asset.assetAccessToken,
                metadata: updatedAsset.metadata,
                lastVerifiedAt: new Date(),
                verificationError: null,
                isVerified: true,
                updatedAt: new Date(),
              })
              .where(eq(customerPlatformAsset.id, input.assetId));

            break;
          }

          default:
            throw new TRPCError({
              code: "NOT_IMPLEMENTED",
              message: `${asset.platform} refresh not yet implemented`,
            });
        }

        // Log activity
        await ctx.db.insert(customerOAuthActivityLog).values({
          id: crypto.randomUUID(),
          connectionId: asset.connectionId,
          assetId: asset.id,
          userId: ctx.session.user.id,
          action: "refresh",
          status: "SUCCESS",
          description: `Refreshed asset: ${asset.name}`,
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
        });

        return {
          success: true,
          asset: updatedAsset,
        };
      } catch (error) {
        // Log failed attempt
        await ctx.db.insert(customerOAuthActivityLog).values({
          id: crypto.randomUUID(),
          connectionId: asset.connectionId,
          assetId: asset.id,
          userId: ctx.session.user.id,
          action: "refresh",
          status: "FAILURE",
          description: `Failed to refresh asset: ${asset.name}`,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
        });

        if (error instanceof MetaProviderError) {
          throw createOAuthError(error.details, ctx);
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: isSuperAdmin(ctx)
            ? `Failed to refresh asset: ${error instanceof Error ? error.message : "Unknown"}`
            : "Failed to refresh asset data. Please try again.",
        });
      }
    }),

  /**
   * Activate/deactivate asset
   */
  setActive: protectedProcedure
    .input(
      z.object({
        assetId: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const asset = await ctx.db.query.customerPlatformAsset.findFirst({
        where: and(
          eq(customerPlatformAsset.id, input.assetId),
          eq(customerPlatformAsset.userId, ctx.session.user.id)
        ),
      });

      if (!asset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Asset not found",
        });
      }

      await ctx.db
        .update(customerPlatformAsset)
        .set({
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(eq(customerPlatformAsset.id, input.assetId));

      // Log activity
      await ctx.db.insert(customerOAuthActivityLog).values({
        id: crypto.randomUUID(),
        connectionId: asset.connectionId,
        assetId: asset.id,
        userId: ctx.session.user.id,
        action: input.isActive ? "activate" : "deactivate",
        status: "SUCCESS",
        description: `${input.isActive ? "Activated" : "Deactivated"} asset: ${asset.name}`,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return {
        success: true,
      };
    }),

  /**
   * Bulk activate/deactivate assets
   */
  bulkSetActive: protectedProcedure
    .input(
      z.object({
        assetIds: z.array(z.string()).min(1),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const assets = await ctx.db.query.customerPlatformAsset.findMany({
        where: and(
          inArray(customerPlatformAsset.id, input.assetIds),
          eq(customerPlatformAsset.userId, ctx.session.user.id)
        ),
      });

      if (assets.length !== input.assetIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some assets not found or you don't have access",
        });
      }

      // Update all assets
      await ctx.db
        .update(customerPlatformAsset)
        .set({
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(inArray(customerPlatformAsset.id, input.assetIds));

      // Log activity for each asset
      await Promise.all(
        assets.map((asset) =>
          ctx.db.insert(customerOAuthActivityLog).values({
            id: crypto.randomUUID(),
            connectionId: asset.connectionId,
            assetId: asset.id,
            userId: ctx.session.user.id,
            action: input.isActive ? "activate" : "deactivate",
            status: "SUCCESS",
            description: `Bulk ${input.isActive ? "activated" : "deactivated"}: ${asset.name}`,
            ipAddress: ctx.ip,
            userAgent: ctx.userAgent,
          })
        )
      );

      return {
        success: true,
        updatedCount: assets.length,
      };
    }),

  /**
   * Delete asset (soft delete)
   */
  delete: protectedProcedure
    .input(
      z.object({
        assetId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const asset = await ctx.db.query.customerPlatformAsset.findFirst({
        where: and(
          eq(customerPlatformAsset.id, input.assetId),
          eq(customerPlatformAsset.userId, ctx.session.user.id)
        ),
      });

      if (!asset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Asset not found",
        });
      }

      // Soft delete: deactivate and mark for cleanup
      await ctx.db
        .update(customerPlatformAsset)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(customerPlatformAsset.id, input.assetId));

      // Log activity
      await ctx.db.insert(customerOAuthActivityLog).values({
        id: crypto.randomUUID(),
        connectionId: asset.connectionId,
        assetId: asset.id,
        userId: ctx.session.user.id,
        action: "delete",
        status: "SUCCESS",
        description: `Deleted asset: ${asset.name}`,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return {
        success: true,
      };
    }),

  /**
   * Get assets grouped by type
   */
  getByType: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const assets = await ctx.db.query.customerPlatformAsset.findMany({
      where: and(
        eq(customerPlatformAsset.userId, userId),
        eq(customerPlatformAsset.isActive, true)
      ),
      with: {
        connection: {
          columns: {
            id: true,
            platform: true,
            displayName: true,
            status: true,
          },
        },
      },
      orderBy: [desc(customerPlatformAsset.createdAt)],
    });

    // Group by asset type
    const grouped = assets.reduce(
      (acc, asset) => {
        const type = asset.assetType;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push({
          ...asset,
          assetAccessToken: undefined, // Don't expose tokens
        });
        return acc;
      },
      {} as Record<string, typeof assets>
    );

    return grouped;
  }),
});
