import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from "drizzle-orm";
import { router, protectedProcedure } from '../../../trpc';
import { LinkedInApiError } from '../../../lib/linkedin-client';
import { LinkedInErrorHandler } from '../../../lib/linkedin-error-handler';
import { db } from "@npanel/db";
import {
	socialMediaIntegration,
	socialMediaIntegrationActivityLog,
} from "@npanel/db/schema/social-media-marketing";
import { request } from 'undici';
import { randomUUID } from 'node:crypto';

// ============================================================================
// ZOD SCHEMAS - Independent from database schema
// ============================================================================

// Constants for Prisma enum values
const LINKEDIN_PLATFORM = 'LINKEDIN' as const;
const ACTIVE_STATUS = 'ACTIVE' as const;

// Get global settings from environment variables
const getLinkedInClientId = () => {
	const clientId = process.env.LINKEDIN_CLIENT_ID;
	if (!clientId) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'LINKEDIN_CLIENT_ID environment variable is not set',
		});
	}
	return clientId;
};

const getLinkedInClientSecret = () => {
	const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
	if (!clientSecret) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'LINKEDIN_CLIENT_SECRET environment variable is not set',
		});
	}
	return clientSecret;
};

const getFrontendUrl = () => {
	return process.env.FRONTEND_URL || process.env.VITE_PUBLIC_APP_URL || 'http://localhost:3001';
};

// Validation schemas
const GenerateTokenRequestSchema = z.object({
	code: z.string().min(1, 'OAuth authorization code is required'),
	redirectUri: z.string().url().optional(),
});

const RefreshTokenRequestSchema = z.object({
	refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Exchange OAuth authorization code for access token and refresh token
 * This is the first step in the OAuth flow
 */
async function exchangeCodeForToken(
	code: string,
	redirectUri: string
): Promise<{
	access_token: string;
	refresh_token: string;
	expires_in: number;
	scope: string;
}> {
	const clientId = getLinkedInClientId();
	const clientSecret = getLinkedInClientSecret();
	const url = 'https://www.linkedin.com/oauth/v2/accessToken';

	const body = new URLSearchParams();
	body.append('grant_type', 'authorization_code');
	body.append('code', code);
	body.append('redirect_uri', redirectUri);
	body.append('client_id', clientId);
	body.append('client_secret', clientSecret);

	const response = await request(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: body.toString(),
	});

	const data = (await response.body.json()) as unknown;

	if (typeof data === 'object' && data !== null && ('error' in data || 'serviceErrorCode' in data)) {
		const error = data as { error?: string; error_description?: string; serviceErrorCode?: number };
		throw new LinkedInApiError(
			response.statusCode || 400,
			error.error_description || error.error || 'Failed to exchange code for token',
			error.serviceErrorCode
		);
	}

	return data as {
		access_token: string;
		refresh_token: string;
		expires_in: number;
		scope: string;
	};
}

/**
 * Refresh access token using refresh token
 * LinkedIn refresh tokens expire after 60 days
 */
async function refreshAccessToken(
	refreshToken: string
): Promise<{
	access_token: string;
	refresh_token: string;
	expires_in: number;
}> {
	const clientId = getLinkedInClientId();
	const clientSecret = getLinkedInClientSecret();
	const url = 'https://www.linkedin.com/oauth/v2/accessToken';

	const body = new URLSearchParams();
	body.append('grant_type', 'refresh_token');
	body.append('refresh_token', refreshToken);
	body.append('client_id', clientId);
	body.append('client_secret', clientSecret);

	const response = await request(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: body.toString(),
	});

	const data = (await response.body.json()) as unknown;

	if (typeof data === 'object' && data !== null && ('error' in data || 'serviceErrorCode' in data)) {
		const error = data as { error?: string; error_description?: string; serviceErrorCode?: number };
		throw new LinkedInApiError(
			response.statusCode || 400,
			error.error_description || error.error || 'Failed to refresh token',
			error.serviceErrorCode
		);
	}

	return data as {
		access_token: string;
		refresh_token: string;
		expires_in: number;
	};
}

export const linkedinAuthRouter = router({
	/**
	 * Generate access token from OAuth authorization code
	 * App ID and App Secret come from environment variables
	 * This is the main endpoint to use for token generation
	 * Flow: code -> access token + refresh token
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

				// Step 1: Exchange OAuth code for access token and refresh token
				const redirectUri =
					input.redirectUri ||
					`${getFrontendUrl()}/agency/social-media-marketing/linkedin/callback`;

				const tokenResponse = await exchangeCodeForToken(input.code, redirectUri);

				// Calculate expiration dates (60 days from now)
				const expiresAt = new Date();
				expiresAt.setDate(expiresAt.getDate() + 60); // 60 days

				const refreshExpiresAt = new Date();
				refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 60); // 60 days

				// Get user info
				let userInfo: { name?: string; picture?: string; vanityName?: string } = {};
				try {
					const userInfoResponse = await request('https://api.linkedin.com/v2/userinfo', {
						method: 'GET',
						headers: {
							Authorization: `Bearer ${tokenResponse.access_token}`,
						},
					});
					const userData = (await userInfoResponse.body.json()) as any;
					if (userData) {
						userInfo.name = userData.name;
						userInfo.picture = userData.picture;
					}

					// Get vanity name
					const profileResponse = await request('https://api.linkedin.com/v2/me', {
						method: 'GET',
						headers: {
							Authorization: `Bearer ${tokenResponse.access_token}`,
						},
					});
					const profileData = (await profileResponse.body.json()) as any;
					if (profileData) {
						userInfo.vanityName = profileData.vanityName;
					}
				} catch (error) {
					console.warn('Failed to fetch user info, continuing anyway:', error);
				}

				// Check if integration already exists (only one global integration)
				const existingIntegration = await db.query.socialMediaIntegration.findFirst({
					where: eq(socialMediaIntegration.platform, LINKEDIN_PLATFORM),
				});

				let integrationId: string;
				const isUpdate = !!existingIntegration;
				const now = new Date();

				if (existingIntegration) {
					// Update existing integration
					await db
						.update(socialMediaIntegration)
						.set({
							userId, // Update userId if different user reconnects
							accessToken: tokenResponse.access_token,
							refreshToken: tokenResponse.refresh_token,
							accessTokenExpiresAt: expiresAt,
							refreshTokenExpiresAt: refreshExpiresAt,
							scope: tokenResponse.scope,
							status: ACTIVE_STATUS,
							lastTokenRefreshAt: now,
							updatedAt: now,
						})
						.where(eq(socialMediaIntegration.id, existingIntegration.id));
					integrationId = existingIntegration.id;
				} else {
					// Create new integration
					const newIntegrationId = `linkedin_${Date.now()}`;
					await db.insert(socialMediaIntegration).values({
						id: newIntegrationId,
						platform: LINKEDIN_PLATFORM,
						userId,
						accessToken: tokenResponse.access_token,
						refreshToken: tokenResponse.refresh_token,
						accessTokenExpiresAt: expiresAt,
						refreshTokenExpiresAt: refreshExpiresAt,
						scope: tokenResponse.scope,
						status: ACTIVE_STATUS,
						createdAt: now,
						updatedAt: now,
					});
					integrationId = newIntegrationId;
				}

				// Log activity
				await db.insert(socialMediaIntegrationActivityLog).values({
					id: randomUUID(),
					integrationId,
					userId,
					action: isUpdate ? 'TOKEN_REFRESH' : 'CREATE',
					description: isUpdate
						? 'LinkedIn integration token refreshed'
						: 'LinkedIn integration created and connected',
					metadata: {
						platform: 'LINKEDIN',
						expiresAt: expiresAt.toISOString(),
						refreshExpiresAt: refreshExpiresAt.toISOString(),
						scope: tokenResponse.scope,
						expiresIn: tokenResponse.expires_in,
						userInfo,
					},
					ipAddress: null,
					userAgent: null,
					createdAt: now,
				});

				return {
					success: true,
					data: {
						accessToken: tokenResponse.access_token,
						refreshToken: tokenResponse.refresh_token,
						expiresIn: tokenResponse.expires_in,
						expiresAt: expiresAt.toISOString(),
						refreshExpiresAt: refreshExpiresAt.toISOString(),
						scope: tokenResponse.scope,
					},
					meta: {
						generated_at: new Date().toISOString(),
						integration_id: integrationId,
					},
				};
			} catch (error) {
				console.error('LinkedIn API token generation error:', error);

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

				if (error instanceof LinkedInApiError) {
					// Use error handler for user-friendly messages
					const errorInfo = LinkedInErrorHandler.handleError(error);
					const userMessage = errorInfo?.message || error.message;
					const errorType = errorInfo?.type || 'unknown';

					// Determine TRPC error code based on error type
					let trpcCode: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR' =
						'INTERNAL_SERVER_ERROR';

					if (errorType === 'refresh-token') {
						trpcCode = 'UNAUTHORIZED';
					} else if (errorType === 'bad-body' || (error.status >= 400 && error.status < 500)) {
						trpcCode = 'BAD_REQUEST';
					}

					throw new TRPCError({
						code: trpcCode,
						message: userMessage,
						cause: {
							status: error.status,
							serviceErrorCode: error.serviceErrorCode,
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
	 * Refresh access token using refresh token
	 * LinkedIn refresh tokens expire after 60 days
	 */
	refreshToken: protectedProcedure
		.input(RefreshTokenRequestSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				const userId = ctx.session?.user?.id;
				if (!userId) {
					throw new TRPCError({
						code: 'UNAUTHORIZED',
						message: 'User session not found',
					});
				}

				// Refresh the token
				const tokenResponse = await refreshAccessToken(input.refreshToken);

				// Calculate expiration dates (60 days from now)
				const expiresAt = new Date();
				expiresAt.setDate(expiresAt.getDate() + 60);

				const refreshExpiresAt = new Date();
				refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 60);

				// Get the integration
				const integration = await db.query.socialMediaIntegration.findFirst({
					where: and(
						eq(socialMediaIntegration.platform, LINKEDIN_PLATFORM),
						eq(socialMediaIntegration.status, ACTIVE_STATUS),
					),
				});

				if (!integration) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'No active LinkedIn integration found. Please generate a token first.',
					});
				}

				// Update integration with new tokens
				const now = new Date();
				await db
					.update(socialMediaIntegration)
					.set({
						accessToken: tokenResponse.access_token,
						refreshToken: tokenResponse.refresh_token,
						accessTokenExpiresAt: expiresAt,
						refreshTokenExpiresAt: refreshExpiresAt,
						lastTokenRefreshAt: now,
						updatedAt: now,
					})
					.where(eq(socialMediaIntegration.id, integration.id));

				// Log activity
				await db.insert(socialMediaIntegrationActivityLog).values({
					id: randomUUID(),
					integrationId: integration.id,
					userId,
					action: 'TOKEN_REFRESH',
					description: 'LinkedIn integration token refreshed',
					metadata: {
						platform: 'LINKEDIN',
						expiresAt: expiresAt.toISOString(),
						refreshExpiresAt: refreshExpiresAt.toISOString(),
						expiresIn: tokenResponse.expires_in,
					},
					ipAddress: null,
					userAgent: null,
					createdAt: now,
				});

				return {
					success: true,
					data: {
						accessToken: tokenResponse.access_token,
						refreshToken: tokenResponse.refresh_token,
						expiresIn: tokenResponse.expires_in,
						expiresAt: expiresAt.toISOString(),
						refreshExpiresAt: refreshExpiresAt.toISOString(),
					},
				};
			} catch (error) {
				console.error('LinkedIn API token refresh error:', error);

				if (error instanceof LinkedInApiError) {
					const errorInfo = LinkedInErrorHandler.handleError(error);
					const userMessage = errorInfo?.message || error.message;
					const errorType = errorInfo?.type || 'unknown';

					let trpcCode: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR' =
						'INTERNAL_SERVER_ERROR';

					if (errorType === 'refresh-token') {
						trpcCode = 'UNAUTHORIZED';
					} else if (errorType === 'bad-body' || (error.status >= 400 && error.status < 500)) {
						trpcCode = 'BAD_REQUEST';
					}

					throw new TRPCError({
						code: trpcCode,
						message: userMessage,
						cause: {
							status: error.status,
							serviceErrorCode: error.serviceErrorCode,
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
					message: 'Failed to refresh access token',
				});
			}
		}),

	/**
	 * Generate LinkedIn OAuth URL for connecting account
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
				const clientId = getLinkedInClientId();
				const frontendUrl = getFrontendUrl();

				// Required scopes for LinkedIn organization posting and Marketing API
				const scopes = [
					'openid',
					'profile',
					'w_member_social',
					'r_basicprofile',
					'rw_organization_admin',
					'w_organization_social',
					'r_organization_social',
					'r_ads', // Marketing API - read ad accounts
					'r_ads_reporting', // Marketing API - read analytics
				];

				// Generate state for OAuth security
				const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

				// Use provided redirect URI or default
				const redirectUri =
					input.redirectUri ||
					`${frontendUrl}/agency/social-media-marketing/linkedin/callback`;

				const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&prompt=none&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes.join(' '))}`;

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
				console.error('LinkedIn API generate auth URL error:', error);

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate LinkedIn OAuth URL',
				});
			}
		}),

	/**
	 * Get stored LinkedIn credentials (integration status)
	 */
	getStoredCredentials: protectedProcedure.query(async () => {
		try {
			const integration = await db.query.socialMediaIntegration.findFirst({
				where: eq(socialMediaIntegration.platform, LINKEDIN_PLATFORM),
				orderBy: [desc(socialMediaIntegration.createdAt)],
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
			console.error('LinkedIn API get stored credentials error:', error);

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

