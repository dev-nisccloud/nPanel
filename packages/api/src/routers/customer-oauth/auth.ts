/**
 * Customer OAuth Authentication Router
 * Handles OAuth flow initiation, callback, and reconnection
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, lt, desc, inArray } from "drizzle-orm";
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
  getFacebookPageScopes,
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
import {
  exchangeGoogleCode,
  googleAuthorizeUrl,
  listGoogleSelectableAssets,
} from "./google";
import {
  exchangeLinkedInCode,
  LINKEDIN_ADS_SCOPES,
  linkedInAuthorizeUrl,
  listLinkedInSelectableAssets,
} from "./linkedin";

const metaProvider = new MetaOAuthProvider();

function publicAsset<T extends { accountAccessToken?: string }>(asset: T) {
  const { accountAccessToken: _pageToken, ...rest } = asset;
  return rest;
}
const metaAssetLoads = new Map<string, Promise<unknown[]>>();

type MetaAssetSurface = "meta_facebook" | "meta_instagram";

function loadMetaAssets(connectionId: string, accessToken: string, surface: MetaAssetSurface) {
  const key = `${connectionId}:${surface}`;
  const existing = metaAssetLoads.get(key);
  if (existing) return existing;
  const pending = (
    surface === "meta_instagram"
      ? metaProvider.fetchInstagramAdAccounts(accessToken)
      : metaProvider.fetchFacebookAssets(accessToken)
  ).finally(() => {
    metaAssetLoads.delete(key);
  });
  metaAssetLoads.set(key, pending);
  return pending;
}

function selectionBucket(data: unknown): Record<string, unknown> {
  if (Array.isArray(data)) return { meta_facebook: data };
  if (data && typeof data === "object") return { ...(data as Record<string, unknown>) };
  return {};
}

function selectionList(data: unknown, surface: MetaAssetSurface): unknown[] | null {
  const list = selectionBucket(data)[surface];
  return Array.isArray(list) ? list : null;
}

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
        platform: z.enum(["meta_facebook", "meta_facebook_pages", "google_ads", "linkedin_ads"]),
        flowType: z.enum(["connect", "reconnect", "add_assets"]).default("connect"),
        reconnectConnectionId: z.string().optional(),
        returnUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Generate secure state token
      const stateToken = generateStateToken();

      // Store state in database for verification
      await ctx.db.insert(customerOAuthState).values({
        stateToken,
        userId,
        teamId: null,
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
        case "meta_facebook":
        case "meta_facebook_pages": {
          const redirectUri = getOAuthRedirectUri("meta");
          authUrl = metaProvider.generateAuthUrl({
            redirectUri,
            state: stateToken,
            scopes: input.platform === "meta_facebook_pages" ? getFacebookPageScopes() : getAllMetaScopes(),
          });
          break;
        }

        case "linkedin_ads": {
          authUrl = linkedInAuthorizeUrl(getOAuthRedirectUri("linkedin"), stateToken);
          break;
        }

        case "google_ads": {
          authUrl = googleAuthorizeUrl(getOAuthRedirectUri("google"), stateToken);
          break;
        }

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

      // Step 1: Verify and retrieve state
      const stateRecord = await ctx.db.query.customerOAuthState.findFirst({
        where: and(
          eq(customerOAuthState.stateToken, input.state),
          eq(customerOAuthState.userId, userId),
        ),
      });

      if (!stateRecord) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired OAuth state",
        });
      }

      const callbackPlatform = stateRecord.platform;
      const metaPageConnect = callbackPlatform === "meta_facebook_pages";
      if (
        callbackPlatform !== input.platform &&
        !(input.platform === "meta_facebook" && metaPageConnect)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired OAuth state",
        });
      }
      const metaScopes = metaPageConnect ? getFacebookPageScopes() : getAllMetaScopes();

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

        switch (metaPageConnect ? "meta_facebook" : callbackPlatform) {
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
              metaScopes
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
                eq(customerOAuthConnection.platform, callbackPlatform),
                eq(customerOAuthConnection.platformUserId, profile.platformUserId)
              ),
            });

            if (existingConnection) {
              // Update existing connection
              await ctx.db
                .update(customerOAuthConnection)
                .set({
                  accessToken: encryptToken(tokenResponse.accessToken),
                  scopes: metaScopes,
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
                teamId: null,
                platform: callbackPlatform,
                platformUserId: profile.platformUserId,
                accessToken: encryptToken(tokenResponse.accessToken),
                tokenExpiresAt,
                status: "PENDING_SELECTION",
                awaitingAccountSelection: true,
                selectionExpiresAt: new Date(Date.now() + 24 * 3600000),
                displayName: profile.displayName,
                email: profile.email,
                profilePictureUrl: profile.profilePictureUrl,
                scopes: metaScopes,
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
              description: `Successfully connected ${callbackPlatform}`,
              ipAddress: ctx.ip,
              userAgent: ctx.userAgent,
            });

            break;
          }

          case "linkedin_ads": {
            const redirectUri = getOAuthRedirectUri("linkedin");
            const exchanged = await exchangeLinkedInCode(input.code, redirectUri);
            profile = exchanged.profile;
            tokenExpiresAt = new Date(Date.now() + exchanged.expiresIn * 1000);
            const encryptedAccessToken = encryptToken(exchanged.accessToken);
            const encryptedRefreshToken = exchanged.refreshToken
              ? encryptToken(exchanged.refreshToken)
              : null;

            const existingConnection = await ctx.db.query.customerOAuthConnection.findFirst({
              where: and(
                eq(customerOAuthConnection.userId, userId),
                eq(customerOAuthConnection.platform, input.platform),
                eq(customerOAuthConnection.platformUserId, profile.platformUserId),
              ),
            });

            if (existingConnection) {
              await ctx.db
                .update(customerOAuthConnection)
                .set({
                  accessToken: encryptedAccessToken,
                  refreshToken: encryptedRefreshToken,
                  tokenExpiresAt,
                  scopes: exchanged.scopes.length > 0 ? exchanged.scopes : LINKEDIN_ADS_SCOPES,
                  status: "PENDING_SELECTION",
                  awaitingAccountSelection: true,
                  selectionExpiresAt: new Date(Date.now() + 24 * 3600000),
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
              connectionId = crypto.randomUUID();
              await ctx.db.insert(customerOAuthConnection).values({
                id: connectionId,
                userId,
                teamId: null,
                platform: input.platform,
                platformUserId: profile.platformUserId,
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                tokenExpiresAt,
                status: "PENDING_SELECTION",
                awaitingAccountSelection: true,
                selectionExpiresAt: new Date(Date.now() + 24 * 3600000),
                displayName: profile.displayName,
                email: profile.email,
                profilePictureUrl: profile.profilePictureUrl,
                scopes: exchanged.scopes.length > 0 ? exchanged.scopes : LINKEDIN_ADS_SCOPES,
                lastVerifiedAt: new Date(),
                lastRefreshAt: new Date(),
                createdBy: userId,
              });
            }

            await ctx.db.insert(customerOAuthActivityLog).values({
              id: crypto.randomUUID(),
              connectionId,
              userId,
              action: existingConnection ? "reconnect" : "connect",
              status: "SUCCESS",
              description: "Successfully connected linkedin_ads",
              ipAddress: ctx.ip,
              userAgent: ctx.userAgent,
            });
            break;
          }

          case "google_ads": {
            const redirectUri = getOAuthRedirectUri("google");
            const exchanged = await exchangeGoogleCode(input.code, redirectUri);
            profile = exchanged.profile;
            tokenExpiresAt = new Date(Date.now() + exchanged.expiresIn * 1000);
            const encryptedAccessToken = encryptToken(exchanged.accessToken);

            const existingConnection = await ctx.db.query.customerOAuthConnection.findFirst({
              where: and(
                eq(customerOAuthConnection.userId, userId),
                eq(customerOAuthConnection.platform, input.platform),
                eq(customerOAuthConnection.platformUserId, profile.platformUserId),
              ),
            });

            const refreshToken = exchanged.refreshToken
              ? encryptToken(exchanged.refreshToken)
              : existingConnection?.refreshToken;
            if (!refreshToken) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Google did not return a refresh token. Connect again and approve access.",
              });
            }

            if (existingConnection) {
              await ctx.db
                .update(customerOAuthConnection)
                .set({
                  accessToken: encryptedAccessToken,
                  refreshToken,
                  tokenExpiresAt,
                  scopes: exchanged.scopes.length > 0 ? exchanged.scopes : undefined,
                  status: "PENDING_SELECTION",
                  awaitingAccountSelection: true,
                  selectionExpiresAt: new Date(Date.now() + 24 * 3600000),
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
              connectionId = crypto.randomUUID();
              await ctx.db.insert(customerOAuthConnection).values({
                id: connectionId,
                userId,
                teamId: null,
                platform: input.platform,
                platformUserId: profile.platformUserId,
                accessToken: encryptedAccessToken,
                refreshToken,
                tokenExpiresAt,
                status: "PENDING_SELECTION",
                awaitingAccountSelection: true,
                selectionExpiresAt: new Date(Date.now() + 24 * 3600000),
                displayName: profile.displayName,
                email: profile.email,
                profilePictureUrl: profile.profilePictureUrl,
                scopes: exchanged.scopes,
                lastVerifiedAt: new Date(),
                lastRefreshAt: new Date(),
                createdBy: userId,
              });
            }

            await ctx.db.insert(customerOAuthActivityLog).values({
              id: crypto.randomUUID(),
              connectionId,
              userId,
              action: existingConnection ? "reconnect" : "connect",
              status: "SUCCESS",
              description: "Successfully connected google_ads",
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
        assetPlatform: z.enum(["meta_facebook", "meta_instagram"]).optional(),
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

      const canBrowseAssets =
        connection.status === "ACTIVE" ||
        (connection.status === "PENDING_SELECTION" && connection.awaitingAccountSelection);
      if (!canBrowseAssets) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This connection does not require account selection",
        });
      }

      if (
        connection.status === "PENDING_SELECTION" &&
        connection.selectionExpiresAt &&
        new Date() > connection.selectionExpiresAt
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Account selection window has expired. Please reconnect.",
        });
      }

      const metaSurface: MetaAssetSurface | null =
        connection.platform === "meta_facebook"
          ? input.assetPlatform === "meta_instagram"
            ? "meta_instagram"
            : "meta_facebook"
          : null;

      try {
        const decryptedToken = decryptToken(connection.accessToken);

        let availableAssets;

        switch (connection.platform) {
          case "meta_facebook":
            availableAssets = await loadMetaAssets(connection.id, decryptedToken, metaSurface ?? "meta_facebook");
            break;

          case "meta_facebook_pages":
            availableAssets = await metaProvider.fetchFacebookPages(decryptedToken);
            break;

          case "linkedin_ads":
            availableAssets = await listLinkedInSelectableAssets(decryptedToken);
            break;

          case "google_ads": {
            if (!connection.refreshToken) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Reconnect Google Ads to refresh access.",
              });
            }
            availableAssets = await listGoogleSelectableAssets(decryptToken(connection.refreshToken));
            break;
          }

          default:
            throw new TRPCError({
              code: "NOT_IMPLEMENTED",
              message: `${connection.platform} asset fetching not yet implemented`,
            });
        }

        const selectionData = metaSurface
          ? { ...selectionBucket(connection.selectionData), [metaSurface]: availableAssets }
          : availableAssets;
        await ctx.db
          .update(customerOAuthConnection)
          .set({
            selectionData: selectionData as any,
            updatedAt: new Date(),
          })
          .where(eq(customerOAuthConnection.id, input.connectionId));

        return {
          assets: availableAssets.map(publicAsset),
          expiresAt: connection.selectionExpiresAt,
        };
      } catch (error) {
        const cachedAssets = metaSurface
          ? selectionList(connection.selectionData, metaSurface)
          : Array.isArray(connection.selectionData)
            ? connection.selectionData
            : null;
        if (
          error instanceof MetaProviderError &&
          error.details.type === "rate_limit" &&
          cachedAssets &&
          cachedAssets.length > 0
        ) {
          return {
            assets: (cachedAssets as Array<Record<string, unknown>>).map(publicAsset),
            expiresAt: connection.selectionExpiresAt,
          };
        }
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
        assetPlatform: z.enum(["meta_facebook", "meta_instagram"]).optional(),
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

      const targetPlatform = input.assetPlatform ?? connection.platform;
      if (targetPlatform === "meta_instagram" && connection.platform !== "meta_facebook") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Instagram ad accounts use the Meta connection",
        });
      }
      if (connection.status !== "PENDING_SELECTION" && connection.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This connection is not awaiting asset selection",
        });
      }

      const metaSurface: MetaAssetSurface | null =
        connection.platform === "meta_facebook"
          ? targetPlatform === "meta_instagram"
            ? "meta_instagram"
            : "meta_facebook"
          : null;
      let availableAssets = metaSurface
        ? selectionList(connection.selectionData, metaSurface)
        : Array.isArray(connection.selectionData)
          ? (connection.selectionData as any[])
          : null;
      if (!availableAssets) {
        const decryptedToken = decryptToken(connection.accessToken);
        if (metaSurface === "meta_instagram") {
          availableAssets = await metaProvider.fetchInstagramAdAccounts(decryptedToken);
        } else if (metaSurface === "meta_facebook") {
          availableAssets = await metaProvider.fetchFacebookAssets(decryptedToken);
        } else if (connection.platform === "linkedin_ads") {
          availableAssets = await listLinkedInSelectableAssets(decryptedToken);
        } else if (connection.platform === "google_ads") {
          if (!connection.refreshToken) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Reconnect Google Ads to refresh access.",
            });
          }
          availableAssets = await listGoogleSelectableAssets(decryptToken(connection.refreshToken));
        }
      }

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
        const importedTypes = [...new Set(selectedAssets.map((asset) => asset.assetType as string))];
        await ctx.db
          .update(customerPlatformAsset)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(customerPlatformAsset.connectionId, connection.id),
              eq(customerPlatformAsset.platform, targetPlatform),
              inArray(customerPlatformAsset.assetType, importedTypes),
            ),
          );

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
                eq(customerPlatformAsset.platform, targetPlatform),
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
              teamId: null,
              platform: targetPlatform,
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
