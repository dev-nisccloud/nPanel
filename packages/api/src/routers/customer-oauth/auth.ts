/**
 * Customer OAuth Authentication Router
 * Handles OAuth flow initiation, callback, and reconnection
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, lt, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../../trpc";
import {
  customerOAuthConnection,
  customerOAuthState,
  customerOAuthActivityLog,
  customerPlatformAsset,
} from "@npanel/db/schema";
import { 
  MetaOAuthProvider, 
  getAllMetaScopes,
  type MetaUserProfile,
  MetaProviderError 
} from "../../lib/meta-oauth-provider";
import {
  encryptToken,
  decryptToken,
  generateStateToken,
} from "../../lib/oauth-encryption";
import {
  createOAuthError,
  logOAuthError,
  isSuperAdmin,
} from "../../lib/oauth-error-handler";

const metaProvider = new MetaOAuthProvider();

const META_ACCOUNT_STATUS_LABELS: Record<number, string> = {
  1: "ACTIVE",
  2: "DISABLED",
  3: "UNSETTLED",
  7: "PENDING_RISK_REVIEW",
  8: "PENDING_SETTLEMENT",
  9: "IN_GRACE_PERIOD",
  100: "PENDING_CLOSURE",
  101: "CLOSED",
  201: "ANY_ACTIVE",
  202: "ANY_CLOSED",
};

function metaAccountStatusLabel(status: unknown): string | null {
  if (typeof status === "string" && status.length > 0 && Number.isNaN(Number(status))) {
    return status;
  }
  const code = typeof status === "number" ? status : Number(status);
  if (!Number.isFinite(code)) return null;
  return META_ACCOUNT_STATUS_LABELS[code] ?? String(code);
}

/**
 * Get OAuth redirect URI from environment
 */
function getOAuthRedirectUri(platform: string): string {
  const baseUrl =
    process.env.CUSTOMER_OAUTH_PUBLIC_URL || process.env.VITE_PUBLIC_APP_URL;
  if (!baseUrl) {
    throw new Error(
      "CUSTOMER_OAUTH_PUBLIC_URL or VITE_PUBLIC_APP_URL environment variable is required"
    );
  }

  return `${baseUrl}/api/oauth/${platform}/callback`;
}

export const customerOAuthAuthRouter = router({
  /**
   * Initiate OAuth flow for a platform
   * Step 1: Generate state token and redirect URL
   */
  initiateOAuth: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["meta_facebook", "google_ads", "linkedin_ads"]),
        flowType: z.enum(["connect", "reconnect", "add_assets"]).default("connect"),
        reconnectConnectionId: z.string().optional(),
        returnUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const teamId = ctx.session.user.teamId;

      // Generate secure state token
      const stateToken = generateStateToken();

      // Store state in database for verification
      await ctx.db.insert(customerOAuthState).values({
        stateToken,
        userId,
        teamId,
        platform: input.platform,
        flowType: input.flowType,
        reconnectConnectionId: input.reconnectConnectionId,
        returnUrl: input.returnUrl,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      });

      // Generate platform-specific auth URL
      let authUrl: string;

      switch (input.platform) {
        case "meta_facebook": {
          const redirectUri = getOAuthRedirectUri("meta");
          authUrl = metaProvider.generateAuthUrl({
            redirectUri,
            state: stateToken,
            scopes: getAllMetaScopes(),
          });
          break;
        }

        case "google_ads":
        case "linkedin_ads":
          throw new TRPCError({
            code: "NOT_IMPLEMENTED",
            message: `${input.platform} OAuth not yet implemented`,
          });

        default:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported platform",
          });
      }

      return {
        authUrl,
        stateToken,
        expiresAt: new Date(Date.now() + 3600000),
      };
    }),

  /**
   * Handle OAuth callback
   * Step 2: Verify state, exchange code for token, fetch user profile and assets
   */
  handleCallback: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["meta_facebook", "google_ads", "linkedin_ads"]),
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const teamId = ctx.session.user.teamId;

      // Step 1: Verify and retrieve state
      const stateRecord = await ctx.db.query.customerOAuthState.findFirst({
        where: and(
          eq(customerOAuthState.stateToken, input.state),
          eq(customerOAuthState.userId, userId),
          eq(customerOAuthState.platform, input.platform)
        ),
      });

      if (!stateRecord) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired OAuth state",
        });
      }

      if (new Date() > stateRecord.expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "OAuth state has expired. Please try again.",
        });
      }

      try {
        let connectionId: string;
        let profile: MetaUserProfile;
        let tokenExpiresAt: Date;

        switch (input.platform) {
          case "meta_facebook": {
            const redirectUri = getOAuthRedirectUri("meta");

            // Exchange code for token
            const tokenResponse = await metaProvider.exchangeCodeForToken({
              code: input.code,
              redirectUri,
            });

            tokenExpiresAt = new Date(Date.now() + tokenResponse.expiresIn * 1000);

            // Fetch user profile
            profile = await metaProvider.fetchUserProfile(tokenResponse.accessToken);

            // Verify scopes
            const scopesValid = await metaProvider.verifyScopes(
              tokenResponse.accessToken,
              getAllMetaScopes()
            );

            if (!scopesValid) {
              throw createOAuthError(
                {
                  type: "invalid_scope",
                  severity: "high",
                  platform: "Meta",
                  platformErrorMessage: "Missing required permissions",
                  requiresReconnect: true,
                  retryable: false,
                },
                ctx
              );
            }

            // Check if connection already exists
            const existingConnection = await ctx.db.query.customerOAuthConnection.findFirst({
              where: and(
                eq(customerOAuthConnection.userId, userId),
                eq(customerOAuthConnection.platform, input.platform),
                eq(customerOAuthConnection.platformUserId, profile.platformUserId)
              ),
            });

            if (existingConnection) {
              // Update existing connection
              await ctx.db
                .update(customerOAuthConnection)
                .set({
                  accessToken: encryptToken(tokenResponse.accessToken),
                  tokenExpiresAt,
                  status: "PENDING_SELECTION",
                  awaitingAccountSelection: true,
                  selectionExpiresAt: new Date(Date.now() + 24 * 3600000), // 24 hours
                  requiresReconnect: false,
                  lastVerifiedAt: new Date(),
                  lastRefreshAt: new Date(),
                  displayName: profile.displayName,
                  email: profile.email,
                  profilePictureUrl: profile.profilePictureUrl,
                  errorCount: 0,
                  lastError: null,
                  updatedAt: new Date(),
                })
                .where(eq(customerOAuthConnection.id, existingConnection.id));

              connectionId = existingConnection.id;
            } else {
              // Create new connection
              connectionId = crypto.randomUUID();

              await ctx.db.insert(customerOAuthConnection).values({
                id: connectionId,
                userId,
                teamId,
                platform: input.platform,
                platformUserId: profile.platformUserId,
                accessToken: encryptToken(tokenResponse.accessToken),
                tokenExpiresAt,
                status: "PENDING_SELECTION",
                awaitingAccountSelection: true,
                selectionExpiresAt: new Date(Date.now() + 24 * 3600000),
                displayName: profile.displayName,
                email: profile.email,
                profilePictureUrl: profile.profilePictureUrl,
                scopes: getAllMetaScopes(),
                lastVerifiedAt: new Date(),
                lastRefreshAt: new Date(),
                createdBy: userId,
              });
            }

            // Log activity
            await ctx.db.insert(customerOAuthActivityLog).values({
              id: crypto.randomUUID(),
              connectionId,
              userId,
              action: existingConnection ? "reconnect" : "connect",
              status: "SUCCESS",
              description: `Successfully connected ${input.platform}`,
              ipAddress: ctx.ip,
              userAgent: ctx.userAgent,
            });

            break;
          }

          default:
            throw new TRPCError({
              code: "NOT_IMPLEMENTED",
              message: `${input.platform} OAuth not yet implemented`,
            });
        }

        // Delete used state token
        await ctx.db
          .delete(customerOAuthState)
          .where(eq(customerOAuthState.stateToken, input.state));

        return {
          success: true,
          connectionId,
          requiresAccountSelection: true,
          profile,
          returnUrl: stateRecord.returnUrl,
        };
      } catch (error) {
        // Log failed attempt
        await ctx.db.insert(customerOAuthActivityLog).values({
          id: crypto.randomUUID(),
          userId,
          action: "connect",
          status: "FAILURE",
          description: `Failed to connect ${input.platform}`,
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
            ? `OAuth callback failed: ${error instanceof Error ? error.message : "Unknown error"}`
            : "Failed to complete authentication. Please try again.",
        });
      }
    }),

  /**
   * Fetch available assets from platform (for account selection)
   * Step 3: Show user what assets they can import
   */
  fetchAvailableAssets: protectedProcedure
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

      if (connection.status !== "PENDING_SELECTION" || !connection.awaitingAccountSelection) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This connection does not require account selection",
        });
      }

      if (connection.selectionExpiresAt && new Date() > connection.selectionExpiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Account selection window has expired. Please reconnect.",
        });
      }

      try {
        const decryptedToken = decryptToken(connection.accessToken);

        let availableAssets;

        switch (connection.platform) {
          case "meta_facebook":
            availableAssets = await metaProvider.fetchAllAssets(decryptedToken);
            break;

          default:
            throw new TRPCError({
              code: "NOT_IMPLEMENTED",
              message: `${connection.platform} asset fetching not yet implemented`,
            });
        }

        // Cache assets temporarily in connection record for faster selection
        await ctx.db
          .update(customerOAuthConnection)
          .set({
            selectionData: availableAssets as any,
            updatedAt: new Date(),
          })
          .where(eq(customerOAuthConnection.id, input.connectionId));

        return {
          assets: availableAssets,
          expiresAt: connection.selectionExpiresAt,
        };
      } catch (error) {
        if (error instanceof MetaProviderError) {
          throw createOAuthError(error.details, ctx);
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: isSuperAdmin(ctx)
            ? `Failed to fetch assets: ${error instanceof Error ? error.message : "Unknown"}`
            : "Failed to fetch available accounts. Please try again.",
        });
      }
    }),

  /**
   * Complete account selection
   * Step 4: User selects which assets to import
   */
  completeAccountSelection: protectedProcedure
    .input(
      z.object({
        connectionId: z.string(),
        selectedAssetIds: z.array(z.string()).min(1, "Please select at least one asset"),
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

      if (connection.status !== "PENDING_SELECTION") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This connection is not awaiting asset selection",
        });
      }

      const availableAssets = connection.selectionData as any[];

      if (!availableAssets || !Array.isArray(availableAssets)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No cached assets found. Please fetch assets first.",
        });
      }

      const selectedAssets = availableAssets.filter((asset) =>
        input.selectedAssetIds.includes(asset.platformAssetId)
      );

      if (selectedAssets.length !== input.selectedAssetIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some selected assets are invalid",
        });
      }

      try {
        await ctx.db
          .update(customerPlatformAsset)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(customerPlatformAsset.connectionId, connection.id));

        // Import selected assets. Reconnect updates the same rows instead of inserting duplicates.
        const importedAssets = await Promise.all(
          selectedAssets.map(async (asset) => {
            const metadata = (asset.metadata ?? {}) as Record<string, unknown>;
            const stored = {
              name: asset.name,
              username: asset.username,
              profilePictureUrl: asset.profilePictureUrl,
              description: asset.description,
              assetAccessToken: asset.accountAccessToken
                ? encryptToken(asset.accountAccessToken)
                : null,
              assetTokenExpiresAt: asset.accountTokenExpiresAt
                ? new Date(asset.accountTokenExpiresAt)
                : null,
              permissions: asset.permissions,
              capabilities: asset.capabilities,
              businessId: asset.businessId,
              businessName: asset.businessName,
              currency: typeof metadata.currency === "string" ? metadata.currency : null,
              timezone: typeof metadata.timezone === "string" ? metadata.timezone : null,
              accountStatus: metaAccountStatusLabel(metadata.account_status),
              metadata: asset.metadata,
              isActive: true,
              isVerified: true,
              lastVerifiedAt: new Date(),
              updatedAt: new Date(),
            };

            const existing = await ctx.db.query.customerPlatformAsset.findFirst({
              where: and(
                eq(customerPlatformAsset.connectionId, connection.id),
                eq(customerPlatformAsset.platformAssetId, asset.platformAssetId),
              ),
            });

            if (existing) {
              await ctx.db
                .update(customerPlatformAsset)
                .set(stored)
                .where(eq(customerPlatformAsset.id, existing.id));
              return { assetId: existing.id, ...asset };
            }

            const assetId = crypto.randomUUID();
            await ctx.db.insert(customerPlatformAsset).values({
              id: assetId,
              connectionId: connection.id,
              userId: connection.userId,
              teamId: connection.teamId,
              platform: connection.platform,
              assetType: asset.assetType,
              platformAssetId: asset.platformAssetId,
              platformParentId: asset.parentAssetId,
              ...stored,
            });

            return { assetId, ...asset };
          })
        );

        // Update connection status to ACTIVE
        await ctx.db
          .update(customerOAuthConnection)
          .set({
            status: "ACTIVE",
            awaitingAccountSelection: false,
            selectionData: null, // Clear cached data
            updatedAt: new Date(),
          })
          .where(eq(customerOAuthConnection.id, input.connectionId));

        // Log activity
        await ctx.db.insert(customerOAuthActivityLog).values({
          id: crypto.randomUUID(),
          connectionId: connection.id,
          userId: connection.userId,
          action: "select_assets",
          status: "SUCCESS",
          description: `Imported ${importedAssets.length} assets`,
          metadata: {
            assetCount: importedAssets.length,
            assetTypes: [...new Set(importedAssets.map((a) => a.assetType))],
          },
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
        });

        return {
          success: true,
          importedAssets,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: isSuperAdmin(ctx)
            ? `Failed to import assets: ${error instanceof Error ? error.message : "Unknown"}`
            : "Failed to import accounts. Please try again.",
        });
      }
    }),

  /**
   * Disconnect OAuth connection
   * Marks connection as revoked and deactivates assets
   */
  disconnect: protectedProcedure
    .input(
      z.object({
        connectionId: z.string(),
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

      // Deactivate connection
      await ctx.db
        .update(customerOAuthConnection)
        .set({
          status: "REVOKED",
          requiresReconnect: true,
          updatedAt: new Date(),
        })
        .where(eq(customerOAuthConnection.id, input.connectionId));

      // Deactivate all assets
      await ctx.db
        .update(customerPlatformAsset)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(customerPlatformAsset.connectionId, input.connectionId));

      // Log activity
      await ctx.db.insert(customerOAuthActivityLog).values({
        id: crypto.randomUUID(),
        connectionId: connection.id,
        userId: connection.userId,
        action: "disconnect",
        status: "SUCCESS",
        description: `Disconnected ${connection.platform}`,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return {
        success: true,
      };
    }),
});
