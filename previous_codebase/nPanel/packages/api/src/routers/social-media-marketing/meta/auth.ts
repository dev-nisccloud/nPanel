import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../../trpc';
import { MetaApiError } from '../../../lib/meta-client';
import { MetaErrorHandler } from '../../../lib/meta-error-handler';
import prisma from '@npanel/db';
import { request } from 'undici';
import { randomUUID } from 'node:crypto';

// ============================================================================
// ZOD SCHEMAS - Independent from database schema
// ============================================================================

// Constants for Prisma enum values
// These maintain independence while allowing type-safe Prisma queries
const META_FACEBOOK_PLATFORM = 'META_FACEBOOK' as const;
const ACTIVE_STATUS = 'ACTIVE' as const;

// Get global settings from environment variables
const getMetaAppId = () => {
	const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID;
	if (!appId) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'META_APP_ID or FACEBOOK_APP_ID environment variable is not set',
		});
	}
	return appId;
};

const getMetaAppSecret = () => {
	const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
	if (!appSecret) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'META_APP_SECRET or FACEBOOK_APP_SECRET environment variable is not set',
		});
	}
	return appSecret;
};

const getMetaApiVersion = () => {
	return process.env.META_API_VERSION || 'v24.0';
};

// Validation schemas
const GenerateTokenRequestSchema = z.object({
	code: z.string().min(1, 'OAuth authorization code is required'),
	redirectUri: z.string().url().optional(),
});

const GetLongLivedPageTokenRequestSchema = z.object({
	userAccessToken: z.string().min(1, 'User access token is required'),
	pageId: z.string().min(1, 'Page ID is required'),
	teamId: z.string().optional().nullish(), // Team that owns this page
});

/**
 * Exchange OAuth authorization code for a short-lived access token
 * This is the first step in the OAuth flow
 */
async function exchangeCodeForToken(
	code: string,
	redirectUri: string
): Promise<{ access_token: string; token_type: string; expires_in: number }> {
	const appId = getMetaAppId();
	const appSecret = getMetaAppSecret();
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
		headers: {
			'Content-Type': 'application/json',
		},
	});

	const data = (await response.body.json()) as unknown;

	if (typeof data === 'object' && data !== null && 'error' in data) {
		const error = (data as { error: MetaApiError['error'] }).error;
		throw new MetaApiError(
			error.code,
			error.message,
			error.type,
			error.error_subcode,
			error.fbtrace_id
		);
	}

	return data as { access_token: string; token_type: string; expires_in: number };
}

/**
 * Generate a long-lived user access token from a short-lived token
 * This token lasts 60 days and can be used to get page access tokens
 */
async function exchangeShortLivedToken(
	shortLivedToken: string
): Promise<{ access_token: string; token_type: string; expires_in: number }> {
	const appId = getMetaAppId();
	const appSecret = getMetaAppSecret();
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
		headers: {
			'Content-Type': 'application/json',
		},
	});

	const data = (await response.body.json()) as unknown;

	if (typeof data === 'object' && data !== null && 'error' in data) {
		const error = (data as { error: MetaApiError['error'] }).error;
		throw new MetaApiError(
			error.code,
			error.message,
			error.type,
			error.error_subcode,
			error.fbtrace_id
		);
	}

	return data as { access_token: string; token_type: string; expires_in: number };
}

/**
 * Get a long-lived page access token
 * Page access tokens don't expire if the page admin doesn't revoke them
 */
async function getLongLivedPageToken(
	userAccessToken: string,
	pageId: string
): Promise<{ access_token: string; id: string }> {
	const apiVersion = getMetaApiVersion();
	const url = `https://graph.facebook.com/${apiVersion}/${pageId}`;

	const params = new URLSearchParams({
		fields: 'access_token',
		access_token: userAccessToken,
	});

	const response = await request(`${url}?${params.toString()}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	const data = (await response.body.json()) as unknown;

	if (typeof data === 'object' && data !== null && 'error' in data) {
		const error = (data as { error: MetaApiError['error'] }).error;
		throw new MetaApiError(
			error.code,
			error.message,
			error.type,
			error.error_subcode,
			error.fbtrace_id
		);
	}

	return data as { access_token: string; id: string };
}

export const metaAuthRouter = router({
	/**
	 * Generate long-lived access token from OAuth authorization code
	 * App ID and App Secret come from environment variables
	 * This is the main endpoint to use for token generation
	 * Flow: code -> short-lived token -> long-lived token
	 */
	generateToken: protectedProcedure
		.input(GenerateTokenRequestSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: 'UNAUTHORIZED',
						message: 'User session not found',
					});
				}

				// Step 1: Exchange OAuth code for short-lived token
				const redirectUri =
					input.redirectUri ||
					`${process.env.FRONTEND_URL || process.env.VITE_PUBLIC_APP_URL || 'http://localhost:3001'}/agency/social-media-marketing/facebook/callback`;

				const shortLivedTokenResponse = await exchangeCodeForToken(input.code, redirectUri);

				// Step 2: Exchange short-lived token for long-lived token
				const longLivedToken = await exchangeShortLivedToken(shortLivedTokenResponse.access_token);

				// Calculate expiration date: use expires_in (seconds) from response, or default 60 days if missing/invalid
				const expiresInSeconds = Number(longLivedToken.expires_in);
				const validExpiresIn =
					Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
						? expiresInSeconds
						: 60 * 24 * 60 * 60; // 60 days in seconds
				const expiresAt = new Date();
				expiresAt.setSeconds(expiresAt.getSeconds() + validExpiresIn);

				// Get permissions from Meta API
				const apiVersion = getMetaApiVersion();
				let scope: string | undefined;

				try {
					// Get permissions
					const permissionsResponse = await request(
						`https://graph.facebook.com/${apiVersion}/me/permissions?access_token=${longLivedToken.access_token}`,
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
					console.warn('Failed to fetch permissions, continuing anyway:', error);
				}

				// Check if integration already exists (only one global integration)
				const existingIntegration = await prisma.socialMediaIntegration.findFirst({
					where: {
						platform: META_FACEBOOK_PLATFORM,
					},
				});

				let integrationId: string;
				const isUpdate = !!existingIntegration;
				const now = new Date();

				if (existingIntegration) {
					// Update existing integration
					await prisma.socialMediaIntegration.update({
						where: { id: existingIntegration.id },
						data: {
							userId, // Update userId if different user reconnects
							accessToken: longLivedToken.access_token,
							accessTokenExpiresAt: expiresAt,
							scope: scope || 'pages_read_engagement,pages_manage_posts,pages_show_list',
							status: ACTIVE_STATUS,
							lastTokenRefreshAt: now,
							updatedAt: now,
						},
					});
					integrationId = existingIntegration.id;
				} else {
					// Create new integration
					const newIntegration = await prisma.socialMediaIntegration.create({
						data: {
							id: `meta_${Date.now()}`,
							platform: META_FACEBOOK_PLATFORM,
							userId,
							accessToken: longLivedToken.access_token,
							accessTokenExpiresAt: expiresAt,
							scope: scope || 'pages_read_engagement,pages_manage_posts,pages_show_list',
							status: ACTIVE_STATUS,
							createdAt: now,
							updatedAt: now,
						},
					});
					integrationId = newIntegration.id;
				}

				// Log activity
				await prisma.socialMediaIntegrationActivityLog.create({
					data: {
						id: randomUUID(),
						integrationId,
						userId,
						action: isUpdate ? 'TOKEN_REFRESH' : 'CREATE',
						description: isUpdate
							? 'Meta integration token refreshed'
							: 'Meta integration created and connected',
						metadata: {
							platform: 'META_FACEBOOK',
							expiresAt: expiresAt.toISOString(),
							scope: scope || 'pages_read_engagement,pages_manage_posts,pages_show_list',
							tokenType: longLivedToken.token_type,
							expiresIn: validExpiresIn,
						},
						createdAt: now,
					},
				});

				return {
					success: true,
					data: {
						accessToken: longLivedToken.access_token,
						tokenType: longLivedToken.token_type,
						expiresIn: validExpiresIn,
						expiresAt: expiresAt.toISOString(),
					},
					meta: {
						generated_at: new Date().toISOString(),
						integration_id: integrationId,
					},
				};
			} catch (error) {
				console.error('Meta API token generation error:', error);

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

				if (error instanceof MetaApiError) {
					// Use error handler for user-friendly messages
					const errorInfo = MetaErrorHandler.handleError(error);
					const userMessage = errorInfo?.message || error.message;
					const errorType = errorInfo?.type || 'unknown';

					// Determine TRPC error code based on error type
					let trpcCode: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR' =
						'INTERNAL_SERVER_ERROR';

					if (errorType === 'refresh-token') {
						trpcCode = 'UNAUTHORIZED';
					} else if (errorType === 'bad-body' || (error.code >= 400 && error.code < 500)) {
						trpcCode = 'BAD_REQUEST';
					}

					throw new TRPCError({
						code: trpcCode,
						message: userMessage,
						cause: {
							type: error.type,
							code: error.code,
							errorSubcode: error.errorSubcode,
							fbtraceId: error.fbtraceId,
							errorType,
							requiresTokenRefresh: errorType === 'refresh-token',
						},
					});
				}

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate access token',
				});
			}
		}),

	/**
	 * Get long-lived page access token from user access token
	 * Saves the page token to the database for future use
	 */
	getPageToken: protectedProcedure
		.input(GetLongLivedPageTokenRequestSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: 'UNAUTHORIZED',
						message: 'User session not found',
					});
				}

				const pageToken = await getLongLivedPageToken(input.userAccessToken, input.pageId);

				// Get page info
				const apiVersion = getMetaApiVersion();
				let pageInfo: {
					pageName?: string;
					pageUsername?: string;
					pagePicture?: string;
					pageCategory?: string;
				} = {};

				try {
					const pageInfoResponse = await request(
						`https://graph.facebook.com/${apiVersion}/${input.pageId}?fields=name,username,picture.type(large),category&access_token=${pageToken.access_token}`,
						{ method: 'GET' }
					);
					const pageData = (await pageInfoResponse.body.json()) as any;
					if (pageData) {
						pageInfo = {
							pageName: pageData.name,
							pageUsername: pageData.username,
							pagePicture: pageData.picture?.data?.url,
							pageCategory: pageData.category,
						};
					}
				} catch (error) {
					console.warn('Failed to fetch page info, continuing anyway:', error);
				}

				// Get the integration (should exist)
				const integration = await prisma.socialMediaIntegration.findFirst({
					where: {
						platform: META_FACEBOOK_PLATFORM,
						status: ACTIVE_STATUS,
					},
				});

				if (!integration) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'No active Meta integration found. Please generate a token first.',
					});
				}

				// Save or update page token
				const existingPageToken = await prisma.socialMediaPageToken.findUnique({
					where: {
						integrationId_pageId: {
							integrationId: integration.id,
							pageId: input.pageId,
						},
					},
				});

				const now = new Date();
				const isUpdate = !!existingPageToken;
				const previousTeamId = existingPageToken?.teamId;
				const newTeamId = input.teamId || null;
				const teamChanged = previousTeamId !== newTeamId;

				let pageTokenId: string;

				// Note: Page tokens typically don't expire unless revoked by page admin
				// However, we set expiration to match parent integration token expiration
				// as page tokens become invalid if parent user token expires
				const expiresAt = integration.accessTokenExpiresAt || null;

				if (existingPageToken) {
					await prisma.socialMediaPageToken.update({
						where: { id: existingPageToken.id },
						data: {
							platform: integration.platform, // Set platform from integration
							accessToken: pageToken.access_token,
							accessTokenExpiresAt: expiresAt,
							pageName: pageInfo.pageName,
							pageUsername: pageInfo.pageUsername,
							pagePicture: pageInfo.pagePicture,
							pageCategory: pageInfo.pageCategory,
							teamId: newTeamId,
							isActive: true,
							lastTokenRefreshAt: now,
							updatedAt: now,
						},
					});
					pageTokenId = existingPageToken.id;
				} else {
					const newPageToken = await prisma.socialMediaPageToken.create({
						data: {
							id: `page_token_${integration.id}_${input.pageId}_${Date.now()}`,
							integrationId: integration.id,
							platform: integration.platform, // Set platform from integration
							pageId: input.pageId,
							accessToken: pageToken.access_token,
							accessTokenExpiresAt: expiresAt,
							pageName: pageInfo.pageName,
							pageUsername: pageInfo.pageUsername,
							pagePicture: pageInfo.pagePicture,
							pageCategory: pageInfo.pageCategory,
							teamId: newTeamId,
							isActive: true,
							lastTokenRefreshAt: now,
							createdAt: now,
							updatedAt: now,
						},
					});
					pageTokenId = newPageToken.id;
				}

				// Log activity
				await prisma.socialMediaPageTokenActivityLog.create({
					data: {
						id: randomUUID(),
						pageTokenId,
						userId,
						action: isUpdate
							? teamChanged
								? newTeamId
									? 'LINK_TEAM'
									: 'UNLINK_TEAM'
								: 'UPDATE'
							: 'CREATE',
						description: isUpdate
							? teamChanged
								? newTeamId
									? `Page linked to team ${newTeamId}`
									: 'Page unlinked from team'
								: 'Page token updated'
							: `Page token created for page ${input.pageId}`,
						metadata: {
							pageId: input.pageId,
							pageName: pageInfo.pageName,
							pageUsername: pageInfo.pageUsername,
							teamId: newTeamId,
							previousTeamId: previousTeamId || null,
							integrationId: integration.id,
						},
						createdAt: now,
					},
				});

				return {
					success: true,
					data: {
						accessToken: pageToken.access_token,
						pageId: pageToken.id,
						pageInfo,
					},
					meta: {
						retrieved_at: new Date().toISOString(),
						page_id: input.pageId,
						team_id: input.teamId || null,
					},
				};
			} catch (error) {
				console.error('Meta API page token retrieval error:', error);

				if (error instanceof MetaApiError) {
					// Use error handler for user-friendly messages
					const errorInfo = MetaErrorHandler.handleError(error);
					const userMessage = errorInfo?.message || error.message;
					const errorType = errorInfo?.type || 'unknown';

					// Determine TRPC error code based on error type
					let trpcCode: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR' =
						'INTERNAL_SERVER_ERROR';

					if (errorType === 'refresh-token') {
						trpcCode = 'UNAUTHORIZED';
					} else if (errorType === 'bad-body' || (error.code >= 400 && error.code < 500)) {
						trpcCode = 'BAD_REQUEST';
					}

					throw new TRPCError({
						code: trpcCode,
						message: userMessage,
						cause: {
							type: error.type,
							code: error.code,
							errorSubcode: error.errorSubcode,
							fbtraceId: error.fbtraceId,
							errorType,
							requiresTokenRefresh: errorType === 'refresh-token',
						},
					});
				}

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to retrieve page token',
				});
			}
		}),

	/**
	 * Generate Facebook OAuth URL for connecting account
	 * Returns the OAuth URL with proper scopes and redirect URI
	 */
	generateAuthUrl: protectedProcedure
		.input(
			z.object({
				redirectUri: z.string().url().optional(),
			})
		)
		.mutation(async ({ input }) => {
			try {
				const appId = getMetaAppId();
				const apiVersion = getMetaApiVersion();

				// Default scopes for Facebook Pages management
				const scopes = [
					'pages_show_list',
					'business_management',
					'pages_manage_posts',
					'pages_manage_engagement',
					'pages_read_engagement',
					'read_insights',
				];

				// Generate state for OAuth security
				const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

				// Use provided redirect URI or default
				const redirectUri =
					input.redirectUri ||
					`${process.env.FRONTEND_URL || process.env.VITE_PUBLIC_APP_URL || 'http://localhost:3000'}/agency/social-media-marketing/facebook/callback`;

				const authUrl = `https://www.facebook.com/${apiVersion}/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scopes.join(',')}`;

				return {
					success: true,
					data: {
						url: authUrl,
						state,
					},
					meta: {
						generated_at: new Date().toISOString(),
					},
				};
			} catch (error) {
				console.error('Meta API generate auth URL error:', error);

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate Facebook OAuth URL',
				});
			}
		}),

	/**
	 * Get stored Meta credentials (integration status)
	 */
	getStoredCredentials: protectedProcedure.query(async () => {
		try {
			const integration = await prisma.socialMediaIntegration.findFirst({
				where: {
					platform: META_FACEBOOK_PLATFORM,
				},
				orderBy: {
					createdAt: 'desc',
				},
			});

			if (!integration) {
				return {
					success: true,
					data: null,
					meta: {
						has_credentials: false,
					},
				};
			}

			// Check if token is expired
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
					status: String(integration.status), // Convert to string to avoid Prisma enum type
					userId: integration.userId, // User who created/configured the integration
				},
				meta: {
					has_credentials: true,
					created_at: integration.createdAt.toISOString(),
					updated_at: integration.updatedAt.toISOString(),
				},
			};
		} catch (error) {
			console.error('Meta API get stored credentials error:', error);

			if (error instanceof TRPCError) {
				throw error;
			}

			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to retrieve stored credentials',
			});
		}
	}),
});
