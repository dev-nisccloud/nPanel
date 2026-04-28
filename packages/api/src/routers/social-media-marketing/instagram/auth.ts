import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from "@npanel/db";
import { router, protectedProcedure } from '../../../trpc';
import { InstagramApiError, throwIfInstagramError } from '../../../lib/instagram-client';
import { db } from "@npanel/db";
import {
	socialMediaIntegration,
	socialMediaIntegrationActivityLog,
} from "@npanel/db/schema/social-media-marketing";
import { request } from 'undici';
import { randomUUID } from 'node:crypto';

// ============================================================================
// Constants
// ============================================================================

const INSTAGRAM_PLATFORM = 'INSTAGRAM' as const;
const ACTIVE_STATUS = 'ACTIVE' as const;

const isAgencyUserRole = (role: string | null | undefined) =>
	role === 'AGENCY_USER' || role === 'AGENCY_ADMIN' || role === 'AGENCY_SUPER_ADMIN';

// Latest Instagram API with Instagram Login endpoints
// Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/
const IG_AUTHORIZE_URL = 'https://www.instagram.com/oauth/authorize';
const IG_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const IG_GRAPH_URL = 'https://graph.instagram.com';

// Default scopes for the Instagram standalone integration. These are the
// post-Jan-2025 scope names that replaced business_basic, business_content_publish,
// business_manage_comments, business_manage_messages.
const DEFAULT_INSTAGRAM_SCOPES = [
	'instagram_business_basic',
	'instagram_business_content_publish',
	'instagram_business_manage_messages',
	'instagram_business_manage_comments',
	'ads_read',
	'ads_management',
] as const;

const getMetaApiVersion = () => {
	return process.env.META_API_VERSION || 'v24.0';
};

// ============================================================================
// Env helpers
// ============================================================================

const getInstagramAppId = () => {
	const appId = process.env.INSTAGRAM_APP_ID;
	if (!appId) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'INSTAGRAM_APP_ID environment variable is not set',
		});
	}
	return appId;
};

const getInstagramAppSecret = () => {
	const appSecret = process.env.INSTAGRAM_APP_SECRET;
	if (!appSecret) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'INSTAGRAM_APP_SECRET environment variable is not set',
		});
	}
	return appSecret;
};

const getFrontendUrl = () =>
	process.env.FRONTEND_URL || process.env.VITE_PUBLIC_APP_URL || 'http://localhost:3001';

const getDefaultRedirectUri = () =>
	`${getFrontendUrl()}/agency/social-media-marketing/instagram/callback`;

// ============================================================================
// Zod schemas
// ============================================================================

const GenerateTokenRequestSchema = z.object({
	code: z.string().min(1, 'OAuth authorization code is required'),
	redirectUri: z.string().url().optional(),
});

const GenerateAuthUrlRequestSchema = z.object({
	redirectUri: z.string().url().optional(),
	scopes: z.array(z.string().min(1)).optional(),
});

// ============================================================================
// Token type definitions returned by Instagram
// ============================================================================

interface ShortLivedTokenResponse {
	access_token: string;
	user_id: number | string;
	permissions?: string[] | string;
}

interface LongLivedTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number; // seconds, ~5184000 (60 days)
}

interface InstagramProfile {
	id: string;
	user_id?: string;
	username?: string;
	account_type?: string;
	media_count?: number;
}

// ============================================================================
// Token helpers
// ============================================================================

/**
 * Step 2 of Business Login for Instagram: exchange the authorization code
 * for a short-lived (1h) Instagram User access token.
 *
 * Important: Instagram appends `#_` to the redirect URL fragment. The frontend
 * must strip that before sending the code here.
 */
async function exchangeCodeForShortLivedToken(
	code: string,
	redirectUri: string,
): Promise<ShortLivedTokenResponse> {
	const appId = getInstagramAppId();
	const appSecret = getInstagramAppSecret();
	const apiVersion = getMetaApiVersion();
	const url = `https://graph.facebook.com/${apiVersion}/oauth/access_token`;

	const params = new URLSearchParams({
		client_id: appId,
		client_secret: appSecret,
		redirect_uri: redirectUri,
		code: code,
	});

	const response = await request(`${url}?${params.toString()}`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
	});

	const data = (await response.body.json()) as unknown;
	throwIfInstagramError(data, response.statusCode);

	return data as ShortLivedTokenResponse;
}

/**
 * Step 3: exchange the short-lived token for a long-lived (60 days) token.
 */
async function exchangeShortLivedTokenForLongLived(
	shortLivedToken: string,
): Promise<LongLivedTokenResponse> {
	const appId = getInstagramAppId();
	const appSecret = getInstagramAppSecret();
	const apiVersion = getMetaApiVersion();
	const url = `https://graph.facebook.com/${apiVersion}/oauth/access_token`;

	const params = new URLSearchParams({
		grant_type: 'fb_exchange_token',
		client_id: appId,
		client_secret: appSecret,
		fb_exchange_token: shortLivedToken,
	});

	const response = await request(`${url}?${params.toString()}`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
	});

	const data = (await response.body.json()) as unknown;
	throwIfInstagramError(data, response.statusCode);

	return data as LongLivedTokenResponse;
}

/**
 * Refresh a long-lived token for another 60 days. Per Meta docs the token
 * must be at least 24 hours old and not yet expired.
 */
async function refreshLongLivedToken(
	longLivedToken: string,
): Promise<LongLivedTokenResponse> {
	const appId = getInstagramAppId();
	const appSecret = getInstagramAppSecret();
	const apiVersion = getMetaApiVersion();
	const url = `https://graph.facebook.com/${apiVersion}/oauth/access_token`;

	const params = new URLSearchParams({
		grant_type: 'fb_exchange_token',
		client_id: appId,
		client_secret: appSecret,
		fb_exchange_token: longLivedToken,
	});

	const response = await request(`${url}?${params.toString()}`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
	});

	const data = (await response.body.json()) as unknown;
	throwIfInstagramError(data, response.statusCode);

	return data as LongLivedTokenResponse;
}

/**
 * Fetch the connected Instagram professional account profile metadata.
 */
async function fetchInstagramProfile(accessToken: string): Promise<InstagramProfile | null> {
	try {
		const url = new URL(`${IG_GRAPH_URL}/v23.0/me`);
		url.searchParams.set('fields', 'id,user_id,username,account_type,media_count');
		url.searchParams.set('access_token', accessToken);

		const response = await request(url.toString(), { method: 'GET' });
		const data = (await response.body.json()) as InstagramProfile | { error?: unknown };
		if (data && typeof data === 'object' && 'error' in data) {
			console.warn('Instagram profile fetch returned error, ignoring:', (data as any).error);
			return null;
		}
		return data as InstagramProfile;
	} catch (error) {
		console.warn('Failed to fetch Instagram profile, continuing anyway:', error);
		return null;
	}
}

// ============================================================================
// tRPC router
// ============================================================================

export const instagramAuthRouter = router({
	/**
	 * Generate the Instagram (standalone) OAuth authorization URL.
	 * The frontend opens this URL in a popup/redirect, the user authorizes,
	 * Instagram redirects back to `redirectUri` with `?code=...`.
	 */
	generateAuthUrl: protectedProcedure
		.input(GenerateAuthUrlRequestSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				if (!isAgencyUserRole(ctx.session?.user?.role)) {
					throw new TRPCError({
						code: 'FORBIDDEN',
						message: 'Only agency users can manage Instagram integration tokens',
					});
				}

				const appId = getInstagramAppId();
				const redirectUri = input.redirectUri || getDefaultRedirectUri();
				const scopes = input.scopes && input.scopes.length > 0
					? input.scopes
					: [...DEFAULT_INSTAGRAM_SCOPES];

				const state =
					Math.random().toString(36).substring(2, 15) +
					Math.random().toString(36).substring(2, 15);

				const authUrl =
					`${IG_AUTHORIZE_URL}?client_id=${encodeURIComponent(appId)}` +
					`&redirect_uri=${encodeURIComponent(redirectUri)}` +
					`&response_type=code` +
					`&scope=${encodeURIComponent(scopes.join(','))}` +
					`&state=${encodeURIComponent(state)}`;

				return {
					success: true,
					data: {
						url: authUrl,
						state,
						scopes,
						redirectUri,
					},
					meta: {
						generated_at: new Date().toISOString(),
					},
				};
			} catch (error) {
				console.error('Instagram API generate auth URL error:', error);
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate Instagram OAuth URL',
				});
			}
		}),

	/**
	 * Exchange OAuth `code` for a long-lived Instagram User access token and
	 * persist the integration. Mirrors the Meta/LinkedIn flow.
	 *
	 * Flow: code -> short-lived token (1h) -> long-lived token (60d).
	 */
	generateToken: protectedProcedure
		.input(GenerateTokenRequestSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				const userId = ctx.session?.user?.id;
				const userRole = ctx.session?.user?.role;
				if (!userId) {
					throw new TRPCError({
						code: 'UNAUTHORIZED',
						message: 'User session not found',
					});
				}
				if (!isAgencyUserRole(userRole)) {
					throw new TRPCError({
						code: 'FORBIDDEN',
						message: 'Only agency users can manage Instagram integration tokens',
					});
				}

				const redirectUri = input.redirectUri || getDefaultRedirectUri();

				// Step 1: short-lived token
				const shortLived = await exchangeCodeForShortLivedToken(input.code, redirectUri);

				// Step 2: long-lived token
				const longLived = await exchangeShortLivedTokenForLongLived(shortLived.access_token);

				const expiresInSeconds = Number(longLived.expires_in);
				const validExpiresIn =
					Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
						? expiresInSeconds
						: 60 * 24 * 60 * 60; // 60 days fallback
				const expiresAt = new Date();
				expiresAt.setSeconds(expiresAt.getSeconds() + validExpiresIn);

				// Step 3: optional profile lookup for nicer logs
				const profile = await fetchInstagramProfile(longLived.access_token);

				// Normalise scopes
				let scope: string | undefined;
				
				// Try to get scopes from exchange response first
				if (Array.isArray(shortLived.permissions)) {
					scope = shortLived.permissions.join(',');
				} else if (typeof shortLived.permissions === 'string') {
					scope = shortLived.permissions;
				}

				// If not in response, fetch from /me/permissions (more reliable for Meta tokens)
				if (!scope) {
					try {
						const apiVersion = getMetaApiVersion();
						const permissionsResponse = await request(
							`https://graph.facebook.com/${apiVersion}/me/permissions?access_token=${longLived.access_token}`,
							{ method: 'GET' }
						);
						const permissionsData = (await permissionsResponse.body.json()) as any;
						if (permissionsData.data) {
							const grantedPermissions = permissionsData.data
								.filter((p: any) => p.status === 'granted')
								.map((p: any) => p.permission);
							scope = grantedPermissions.join(',');
						}
					} catch (error) {
						console.warn('Failed to fetch Instagram/Meta permissions, using defaults:', error);
					}
				}

				if (!scope) scope = [...DEFAULT_INSTAGRAM_SCOPES].join(',');

				const existing = await db.query.socialMediaIntegration.findFirst({
					where: eq(socialMediaIntegration.platform, INSTAGRAM_PLATFORM),
				});

				const now = new Date();
				const isUpdate = !!existing;
				let integrationId: string;

				if (existing) {
					await db
						.update(socialMediaIntegration)
						.set({
							userId,
							accessToken: longLived.access_token,
							accessTokenExpiresAt: expiresAt,
							refreshToken: null,
							refreshTokenExpiresAt: null,
							scope,
							tokenType: longLived.token_type ?? 'bearer',
							status: ACTIVE_STATUS,
							lastTokenRefreshAt: now,
							updatedAt: now,
						})
						.where(eq(socialMediaIntegration.id, existing.id));
					integrationId = existing.id;
				} else {
					integrationId = `instagram_${Date.now()}`;
					await db.insert(socialMediaIntegration).values({
						id: integrationId,
						platform: INSTAGRAM_PLATFORM,
						userId,
						accessToken: longLived.access_token,
						accessTokenExpiresAt: expiresAt,
						refreshToken: null,
						refreshTokenExpiresAt: null,
						scope,
						tokenType: longLived.token_type ?? 'bearer',
						status: ACTIVE_STATUS,
						createdAt: now,
						updatedAt: now,
					});
				}

				await db.insert(socialMediaIntegrationActivityLog).values({
					id: randomUUID(),
					integrationId,
					userId,
					action: isUpdate ? 'TOKEN_REFRESH' : 'CREATE',
					description: isUpdate
						? 'Instagram integration token refreshed'
						: 'Instagram integration created and connected',
					metadata: {
						platform: INSTAGRAM_PLATFORM,
						expiresAt: expiresAt.toISOString(),
						scope,
						tokenType: longLived.token_type,
						expiresIn: validExpiresIn,
						instagramUserId: shortLived.user_id ?? null,
						profile: profile
							? {
									id: profile.id,
									username: profile.username,
									accountType: profile.account_type,
									mediaCount: profile.media_count,
								}
							: null,
					},
					ipAddress: null,
					userAgent: null,
					createdAt: now,
				});

				return {
					success: true,
					data: {
						accessToken: longLived.access_token,
						tokenType: longLived.token_type,
						expiresIn: validExpiresIn,
						expiresAt: expiresAt.toISOString(),
						scope,
						profile: profile ?? null,
					},
					meta: {
						generated_at: new Date().toISOString(),
						integration_id: integrationId,
					},
				};
			} catch (error) {
				console.error('Instagram API token generation error:', error);

				if (error instanceof z.ZodError) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Invalid request data',
						cause: error.issues.map((err) => ({
							field: err.path.join('.'),
							message: err.message,
						})),
					});
				}

				if (error instanceof InstagramApiError) {
					const requiresReconnect =
						error.code === 190 ||
						/access\s*token/i.test(error.message) ||
						/oauth/i.test(error.type);
					throw new TRPCError({
						code: requiresReconnect ? 'UNAUTHORIZED' : 'BAD_REQUEST',
						message: error.message,
						cause: {
							code: error.code,
							type: error.type,
							errorSubcode: error.errorSubcode,
							fbtraceId: error.fbtraceId,
							requiresReconnect,
						},
					});
				}

				if (error instanceof TRPCError) throw error;

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate Instagram access token',
				});
			}
		}),

	/**
	 * Refresh the stored long-lived Instagram access token. Mirrors LinkedIn's
	 * refreshToken endpoint. Per Meta docs, the token must be at least 24h old
	 * and still valid (within the 60-day window) for refresh to succeed.
	 */
	refreshToken: protectedProcedure
		.input(z.object({}).optional())
		.mutation(async ({ ctx }) => {
			try {
				const userId = ctx.session?.user?.id;
				const userRole = ctx.session?.user?.role;
				if (!userId) {
					throw new TRPCError({
						code: 'UNAUTHORIZED',
						message: 'User session not found',
					});
				}
				if (!isAgencyUserRole(userRole)) {
					throw new TRPCError({
						code: 'FORBIDDEN',
						message: 'Only agency users can manage Instagram integration tokens',
					});
				}

				const integration = await db.query.socialMediaIntegration.findFirst({
					where: and(
						eq(socialMediaIntegration.platform, INSTAGRAM_PLATFORM),
						eq(socialMediaIntegration.status, ACTIVE_STATUS),
					),
					orderBy: [desc(socialMediaIntegration.createdAt)],
				});

				if (!integration || !integration.accessToken) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message:
							'No active Instagram integration found. Please connect Instagram first.',
					});
				}

				const refreshed = await refreshLongLivedToken(integration.accessToken);

				const expiresInSeconds = Number(refreshed.expires_in);
				const validExpiresIn =
					Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
						? expiresInSeconds
						: 60 * 24 * 60 * 60;
				const expiresAt = new Date();
				expiresAt.setSeconds(expiresAt.getSeconds() + validExpiresIn);

				const now = new Date();
				await db
					.update(socialMediaIntegration)
					.set({
						accessToken: refreshed.access_token,
						accessTokenExpiresAt: expiresAt,
						tokenType: refreshed.token_type ?? integration.tokenType ?? 'bearer',
						status: ACTIVE_STATUS,
						lastTokenRefreshAt: now,
						updatedAt: now,
					})
					.where(eq(socialMediaIntegration.id, integration.id));

				await db.insert(socialMediaIntegrationActivityLog).values({
					id: randomUUID(),
					integrationId: integration.id,
					userId,
					action: 'TOKEN_REFRESH',
					description: 'Instagram long-lived token refreshed',
					metadata: {
						platform: INSTAGRAM_PLATFORM,
						expiresAt: expiresAt.toISOString(),
						expiresIn: validExpiresIn,
						tokenType: refreshed.token_type,
					},
					ipAddress: null,
					userAgent: null,
					createdAt: now,
				});

				return {
					success: true,
					data: {
						accessToken: refreshed.access_token,
						tokenType: refreshed.token_type,
						expiresIn: validExpiresIn,
						expiresAt: expiresAt.toISOString(),
					},
				};
			} catch (error) {
				console.error('Instagram API token refresh error:', error);

				if (error instanceof InstagramApiError) {
					const requiresReconnect =
						error.code === 190 ||
						/access\s*token/i.test(error.message) ||
						/oauth/i.test(error.type);
					throw new TRPCError({
						code: requiresReconnect ? 'UNAUTHORIZED' : 'BAD_REQUEST',
						message: error.message,
						cause: {
							code: error.code,
							type: error.type,
							errorSubcode: error.errorSubcode,
							fbtraceId: error.fbtraceId,
							requiresReconnect,
						},
					});
				}

				if (error instanceof TRPCError) throw error;

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to refresh Instagram access token',
				});
			}
		}),

	/**
	 * Get the stored Instagram credentials/integration status. Returns
	 * `null` when no integration exists yet.
	 */
	getStoredCredentials: protectedProcedure.query(async ({ ctx }) => {
		try {
			if (!isAgencyUserRole(ctx.session?.user?.role)) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only agency users can view Instagram integration credentials',
				});
			}

			const integration = await db.query.socialMediaIntegration.findFirst({
				where: eq(socialMediaIntegration.platform, INSTAGRAM_PLATFORM),
				orderBy: [desc(socialMediaIntegration.createdAt)],
			});

			if (!integration) {
				return {
					success: true,
					data: null,
					meta: { has_credentials: false },
				};
			}

			const isExpired =
				integration.accessTokenExpiresAt &&
				new Date(integration.accessTokenExpiresAt) < new Date();

			return {
				success: true,
				data: {
					integrationId: integration.id,
					hasAccessToken: !!integration.accessToken,
					accessTokenExpiresAt: integration.accessTokenExpiresAt?.toISOString() || null,
					isExpired,
					scope: integration.scope,
					status: String(integration.status),
					userId: integration.userId,
					connected: integration.status === ACTIVE_STATUS && !isExpired,
				},
				meta: {
					has_credentials: true,
					created_at: integration.createdAt.toISOString(),
					updated_at: integration.updatedAt.toISOString(),
				},
			};
		} catch (error) {
			console.error('Instagram API get stored credentials error:', error);
			if (error instanceof TRPCError) throw error;
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to retrieve stored Instagram credentials',
			});
		}
	}),

	/**
	 * Fetch the connected Instagram professional account profile (id,
	 * username, account_type, media_count, profile_picture_url). Uses the
	 * stored long-lived token. Returns null when not connected.
	 */
	getProfile: protectedProcedure.query(async ({ ctx }) => {
		try {
			if (!isAgencyUserRole(ctx.session?.user?.role)) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only agency users can view Instagram profile',
				});
			}

			const integration = await db.query.socialMediaIntegration.findFirst({
				where: and(
					eq(socialMediaIntegration.platform, INSTAGRAM_PLATFORM),
					eq(socialMediaIntegration.status, ACTIVE_STATUS),
				),
				orderBy: [desc(socialMediaIntegration.createdAt)],
			});

			if (!integration || !integration.accessToken) {
				return { success: true, data: null };
			}

			const url = new URL(`${IG_GRAPH_URL}/v23.0/me`);
			url.searchParams.set(
				'fields',
				'id,user_id,username,account_type,media_count,profile_picture_url,name,biography,followers_count,follows_count',
			);
			url.searchParams.set('access_token', integration.accessToken);

			const response = await request(url.toString(), { method: 'GET' });
			const data = (await response.body.json()) as unknown;
			throwIfInstagramError(data, response.statusCode);

			return {
				success: true,
				data: data as InstagramProfile & {
					profile_picture_url?: string;
					name?: string;
					biography?: string;
					followers_count?: number;
					follows_count?: number;
				},
				meta: {
					retrieved_at: new Date().toISOString(),
					integration_id: integration.id,
				},
			};
		} catch (error) {
			console.error('Instagram API get profile error:', error);
			if (error instanceof InstagramApiError) {
				const requiresReconnect =
					error.code === 190 ||
					/access\s*token/i.test(error.message) ||
					/oauth/i.test(error.type);
				throw new TRPCError({
					code: requiresReconnect ? 'UNAUTHORIZED' : 'BAD_REQUEST',
					message: error.message,
					cause: { requiresReconnect },
				});
			}
			if (error instanceof TRPCError) throw error;
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to retrieve Instagram profile',
			});
		}
	}),

	/**
	 * Disconnect the Instagram integration. We mark it as REVOKED but keep
	 * the row for audit/activity history.
	 */
	disconnect: protectedProcedure.mutation(async ({ ctx }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) {
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'User session not found',
			});
		}
		if (!isAgencyUserRole(ctx.session?.user?.role)) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'Only agency users can manage Instagram integration tokens',
			});
		}

		const integration = await db.query.socialMediaIntegration.findFirst({
			where: and(
				eq(socialMediaIntegration.platform, INSTAGRAM_PLATFORM),
				eq(socialMediaIntegration.status, ACTIVE_STATUS),
			),
			orderBy: [desc(socialMediaIntegration.createdAt)],
		});

		if (!integration) {
			return { success: true, data: { disconnected: false } };
		}

		const now = new Date();
		await db
			.update(socialMediaIntegration)
			.set({ status: 'REVOKED', updatedAt: now })
			.where(eq(socialMediaIntegration.id, integration.id));

		await db.insert(socialMediaIntegrationActivityLog).values({
			id: randomUUID(),
			integrationId: integration.id,
			userId,
			action: 'DISCONNECT',
			description: 'Instagram integration disconnected',
			metadata: { platform: INSTAGRAM_PLATFORM },
			ipAddress: null,
			userAgent: null,
			createdAt: now,
		});

		return { success: true, data: { disconnected: true } };
	}),
});
