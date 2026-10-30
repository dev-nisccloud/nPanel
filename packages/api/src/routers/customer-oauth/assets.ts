/**
 * Customer OAuth Assets Router
 * Manages platform assets (pages, ad accounts, etc.)
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, desc, count, inArray, isNull } from "drizzle-orm";
import { router, protectedProcedure } from "../../trpc";
import {
  customerPlatformAsset,
  customerOAuthActivityLog,
  team,
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

const LINKABLE_AD_ACCOUNT_TYPES = new Set(["meta_ad_account", "linkedin_ad_account", "google_ad_account"]);

export const customerOAuthAssetsRouter = router({
  /**
   * List all assets for current user
   */
  list: protectedProcedure
    .input(
      z
        .object({
          connectionId: z.string().optional(),
          platform: z.enum(["meta_facebook", "meta_instagram", "google_ads", "linkedin_ads"]).optional(),
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
            const allAssets = await metaProvider.fetchFacebookAssets(decryptedToken);

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

          case "meta_instagram": {
            const allAssets = await metaProvider.fetchInstagramAdAccounts(decryptedToken);
            updatedAsset = allAssets.find((a) => a.platformAssetId === asset.platformAssetId);
            if (!updatedAsset) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Asset no longer exists on the platform",
              });
            }
            await ctx.db
              .update(customerPlatformAsset)
              .set({
                name: updatedAsset.name,
                profilePictureUrl: updatedAsset.profilePictureUrl,
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
   * Remove an imported asset and the rows that belong to it.
   * Child assets, mappings, activity logs, and webhooks go with it.
   * A linked Meta ads account is removed only when no other asset still points at it.
   */
  delete: protectedProcedure
    .input(
      z.object({
        assetId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const asset = await ctx.db.query.customerPlatformAsset.findFirst({
        where: and(
          eq(customerPlatformAsset.id, input.assetId),
          eq(customerPlatformAsset.userId, userId)
        ),
      });

      if (!asset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Asset not found",
        });
      }

      const assetIds = [asset.id];
      const linkedByPlatformParent = await ctx.db
        .select({ id: customerPlatformAsset.id })
        .from(customerPlatformAsset)
        .where(
          and(
            eq(customerPlatformAsset.userId, userId),
            eq(customerPlatformAsset.connectionId, asset.connectionId),
            eq(customerPlatformAsset.platformParentId, asset.platformAssetId)
          )
        );
      for (const linked of linkedByPlatformParent) {
        if (!assetIds.includes(linked.id)) assetIds.push(linked.id);
      }

      let frontier = [...assetIds];
      for (let depth = 0; depth < 8 && frontier.length > 0; depth += 1) {
        const children = await ctx.db
          .select({ id: customerPlatformAsset.id })
          .from(customerPlatformAsset)
          .where(
            and(
              eq(customerPlatformAsset.userId, userId),
              inArray(customerPlatformAsset.parentAssetId, frontier)
            )
          );
        frontier = children.map((child) => child.id).filter((id) => !assetIds.includes(id));
        assetIds.push(...frontier);
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(customerPlatformAsset)
          .set({ parentAssetId: null })
          .where(inArray(customerPlatformAsset.id, assetIds));

        await tx
          .delete(customerPlatformAsset)
          .where(
            and(
              inArray(customerPlatformAsset.id, assetIds),
              eq(customerPlatformAsset.userId, userId)
            )
          );

        await tx.insert(customerOAuthActivityLog).values({
          id: crypto.randomUUID(),
          connectionId: asset.connectionId,
          userId,
          action: "delete",
          status: "SUCCESS",
          description: `Removed ad account: ${asset.name}`,
          metadata: {
            platformAssetId: asset.platformAssetId,
            assetType: asset.assetType,
            removedAssetIds: assetIds,
          },
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
        });
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

  /**
   * Organization link for the ad account the user is viewing.
   */
  organizationLink: protectedProcedure
    .input(z.object({ assetId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const asset = await ctx.db.query.customerPlatformAsset.findFirst({
        where: and(
          eq(customerPlatformAsset.id, input.assetId),
          eq(customerPlatformAsset.userId, ctx.session.user.id),
        ),
        columns: {
          id: true,
          name: true,
          assetType: true,
          teamId: true,
        },
        with: {
          team: {
            columns: { id: true, name: true },
          },
        },
      });

      if (!asset || !LINKABLE_AD_ACCOUNT_TYPES.has(asset.assetType)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ad account not found" });
      }

      return {
        assetId: asset.id,
        assetName: asset.name,
        teamId: asset.teamId,
        teamName: asset.team?.name ?? null,
      };
    }),

  /**
   * Link the active ad account to an existing organization. One-time.
   */
  linkOrganization: protectedProcedure
    .input(
      z.object({
        assetId: z.string().min(1),
        teamId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const asset = await ctx.db.query.customerPlatformAsset.findFirst({
        where: and(
          eq(customerPlatformAsset.id, input.assetId),
          eq(customerPlatformAsset.userId, ctx.session.user.id),
        ),
        columns: {
          id: true,
          name: true,
          assetType: true,
          teamId: true,
          connectionId: true,
        },
      });

      if (!asset || !LINKABLE_AD_ACCOUNT_TYPES.has(asset.assetType)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ad account not found" });
      }
      if (asset.teamId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This ad account is already linked to an organization.",
        });
      }

      const organization = await ctx.db.query.team.findFirst({
        where: eq(team.id, input.teamId),
        columns: { id: true, name: true, isActive: true },
      });
      if (!organization || !organization.isActive) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      const updated = await ctx.db
        .update(customerPlatformAsset)
        .set({ teamId: organization.id, updatedAt: new Date() })
        .where(
          and(
            eq(customerPlatformAsset.id, asset.id),
            isNull(customerPlatformAsset.teamId),
          ),
        )
        .returning({ id: customerPlatformAsset.id });

      if (updated.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This ad account is already linked to an organization.",
        });
      }

      await ctx.db.insert(customerOAuthActivityLog).values({
        id: crypto.randomUUID(),
        connectionId: asset.connectionId,
        assetId: asset.id,
        userId: ctx.session.user.id,
        action: "link_organization",
        status: "SUCCESS",
        description: `Linked ${asset.name} to ${organization.name}`,
        metadata: { teamId: organization.id, teamName: organization.name },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return {
        success: true as const,
        teamId: organization.id,
        teamName: organization.name,
      };
    }),
});
