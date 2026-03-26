import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { desc, eq } from '@npanel/db';
import { request } from 'undici';
import { router, protectedProcedure } from '../../trpc';
import { db } from '@npanel/db';
import {
	googleAdsIntegration,
	googleAdsIntegrationActivityLog,
} from '@npanel/db/schema/google-ads';
import {
	getGoogleAdsClientId,
	getGoogleAdsClientSecret,
	getGoogleAdsRedirectUri,
} from '../../lib/google-ads-credentials';
import { refreshAccessToken } from '../../lib/google-ads-client';
import { GoogleAdsErrorHandler } from '../../lib/google-ads-error-handler';

// ============================================================================
// ZOD SCHEMAS - Independent from database schema
// ============================================================================

// Integration status values (stored as text in DB)
const ACTIVE_STATUS = 'ACTIVE' as const;
const REVOKED_STATUS = 'REVOKED' as const;

// Validation schemas
const GenerateTokenRequestSchema = z.object({
	code: z.string().min(1, 'OAuth authorization code is required'),
	redirectUri: z.string().url().optional(),
});

/**
 * Exchange OAuth authorization code for access and refresh tokens
 * Google OAuth 2.0 provides both access token and refresh token
 */
async function exchangeCodeForTokens(
	code: string,
	redirectUri: string
): Promise<{
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
	scope: string;
}> {
	const clientId = getGoogleAdsClientId();
	const clientSecret = getGoogleAdsClientSecret();
	const url = 'https://oauth2.googleapis.com/token';

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

	if (typeof data === 'object' && data !== null && 'error' in data) {
		const error = data as { error?: string; error_description?: string };
		const errorInfo = GoogleAdsErrorHandler.handleError(
			new Error(error.error_description || error.error || 'OAuth token exchange failed')
		);
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: errorInfo.message,
		});
	}

	return data as {
		access_token: string;
		refresh_token: string;
		expires_in: number;
		token_type: string;
		scope: string;
	};
}

/**
 * Revoke Google OAuth tokens
 */
async function revokeTokens(refreshToken: string): Promise<void> {
	const url = 'https://oauth2.googleapis.com/revoke';

	const body = new URLSearchParams();
	body.append('token', refreshToken);

	try {
		await request(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: body.toString(),
		});
	} catch (error) {
		// Log but don't fail if revocation fails
		console.warn('Failed to revoke Google OAuth tokens:', error);
	}
}

export const googleAdsAuthRouter = router({
	/**
	 * Generate Google OAuth URL for connecting account
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
				const clientId = getGoogleAdsClientId();
				// Normalize redirect URI (remove trailing slash if present)
				let redirectUri = (input.redirectUri || getGoogleAdsRedirectUri()).replace(/\/$/, '');

				// Log redirect URI for debugging (remove in production)
				console.log('[Google Ads OAuth] Redirect URI:', redirectUri);
				console.log('[Google Ads OAuth] Make sure this EXACT URI is in Google Cloud Console authorized redirect URIs');

				// Google Ads API OAuth scopes
				// https://developers.google.com/google-ads/api/docs/oauth/overview
				const scopes = [
					'https://www.googleapis.com/auth/adwords', // Google Ads API access
				];

				// Generate state for OAuth security
				const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

				const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&state=${state}&access_type=offline&prompt=consent`;

				// Log the full auth URL for debugging (remove sensitive parts in production)
				console.log('[Google Ads OAuth] Full Auth URL (first 100 chars):', authUrl.substring(0, 100) + '...');
				console.log('[Google Ads OAuth] Encoded redirect_uri parameter:', encodeURIComponent(redirectUri));

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
				console.error('Google Ads API generate auth URL error:', error);

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate Google OAuth URL',
				});
			}
		}),

	/**
	 * Exchange OAuth authorization code for tokens
	 * Stores refresh token in database and creates/updates GoogleAdsIntegration record
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

				// Normalize redirect URI (remove trailing slash if present) - must match generateAuthUrl
				let redirectUri = (input.redirectUri || getGoogleAdsRedirectUri()).replace(/\/$/, '');

				// Log redirect URI for debugging (must match the one used in generateAuthUrl)
				console.log('[Google Ads Token Exchange] Redirect URI:', redirectUri);

				// Exchange code for tokens
				const tokenResponse = await exchangeCodeForTokens(input.code, redirectUri);

				// Calculate expiration date (access tokens expire in 1 hour)
				const expiresAt = new Date();
				expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

				// Check if integration already exists for this user (most recent)
				const [existingIntegration] = await db
					.select()
					.from(googleAdsIntegration)
					.where(eq(googleAdsIntegration.userId, userId))
					.orderBy(desc(googleAdsIntegration.createdAt))
					.limit(1);

				let integrationId: string;
				const isUpdate = !!existingIntegration;
				const now = new Date();

				if (existingIntegration) {
					await db
						.update(googleAdsIntegration)
						.set({
							refreshToken: tokenResponse.refresh_token,
							accessToken: tokenResponse.access_token,
							accessTokenExpiresAt: expiresAt,
							scope: tokenResponse.scope,
							tokenType: tokenResponse.token_type,
							status: ACTIVE_STATUS,
							lastTokenRefreshAt: now,
							updatedAt: now,
						})
						.where(eq(googleAdsIntegration.id, existingIntegration.id));
					integrationId = existingIntegration.id;
				} else {
					integrationId = `google_ads_${Date.now()}_${randomUUID().substring(0, 8)}`;
					await db.insert(googleAdsIntegration).values({
						id: integrationId,
						userId,
						refreshToken: tokenResponse.refresh_token,
						accessToken: tokenResponse.access_token,
						accessTokenExpiresAt: expiresAt,
						scope: tokenResponse.scope,
						tokenType: tokenResponse.token_type,
						status: ACTIVE_STATUS,
						createdAt: now,
						updatedAt: now,
					});
				}

				await db.insert(googleAdsIntegrationActivityLog).values({
					id: randomUUID(),
					integrationId,
					userId,
					action: isUpdate ? 'TOKEN_REFRESH' : 'CREATE',
					description: isUpdate
						? 'Google Ads integration token refreshed'
						: 'Google Ads integration created and connected',
					metadata: {
						expiresAt: expiresAt.toISOString(),
						scope: tokenResponse.scope,
						tokenType: tokenResponse.token_type,
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
						tokenType: tokenResponse.token_type,
						expiresIn: tokenResponse.expires_in,
						expiresAt: expiresAt.toISOString(),
					},
					meta: {
						generated_at: new Date().toISOString(),
						integration_id: integrationId,
					},
				};
			} catch (error) {
				console.error('Google Ads API token generation error:', error);

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

				if (error instanceof TRPCError) {
					throw error;
				}

				const errorInfo = GoogleAdsErrorHandler.handleError(error);
				throw new TRPCError({
					code: errorInfo.type === 'refresh-token' ? 'UNAUTHORIZED' : 'INTERNAL_SERVER_ERROR',
					message: errorInfo.message,
				});
			}
		}),

	/**
	 * Get stored Google Ads credentials (integration status)
	 */
	getStoredCredentials: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'User session not found',
				});
			}

			const [integration] = await db
				.select()
				.from(googleAdsIntegration)
				.where(eq(googleAdsIntegration.userId, userId))
				.orderBy(desc(googleAdsIntegration.createdAt))
				.limit(1);

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

			// If expired, try to refresh
			if (isExpired && integration.refreshToken) {
				try {
					const clientId = getGoogleAdsClientId();
					const clientSecret = getGoogleAdsClientSecret();
					const tokenResponse = await refreshAccessToken(
						integration.refreshToken,
						clientId,
						clientSecret
					);

					const expiresAt = new Date();
					expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

					await db
						.update(googleAdsIntegration)
						.set({
							accessToken: tokenResponse.access_token,
							accessTokenExpiresAt: expiresAt,
							lastTokenRefreshAt: new Date(),
							updatedAt: new Date(),
						})
						.where(eq(googleAdsIntegration.id, integration.id));

					await db.insert(googleAdsIntegrationActivityLog).values({
						id: randomUUID(),
						integrationId: integration.id,
						userId,
						action: 'TOKEN_REFRESH',
						description: 'Access token automatically refreshed',
						metadata: {
							expiresAt: expiresAt.toISOString(),
							expiresIn: tokenResponse.expires_in,
						},
						ipAddress: null,
						userAgent: null,
						createdAt: new Date(),
					});

					// Return updated integration
					return {
						success: true,
						data: {
							integrationId: integration.id,
							hasAccessToken: true,
							hasRefreshToken: !!integration.refreshToken,
							accessTokenExpiresAt: expiresAt.toISOString(),
							isExpired: false,
							scope: integration.scope,
							status: String(integration.status),
							userId: integration.userId,
							connected: true, // Add connected field for frontend
						},
						meta: {
							has_credentials: true,
							created_at: integration.createdAt.toISOString(),
							updated_at: new Date().toISOString(),
						},
					};
				} catch (refreshError) {
					// If refresh fails, mark as expired
					console.error('Failed to refresh Google Ads token:', refreshError);
					const errorInfo = GoogleAdsErrorHandler.handleError(refreshError);
					if (errorInfo.type === 'refresh-token') {
						// Update status to EXPIRED
						await db
							.update(googleAdsIntegration)
							.set({
								status: 'EXPIRED',
								updatedAt: new Date(),
							})
							.where(eq(googleAdsIntegration.id, integration.id));
					}
				}
			}

			// Determine if connected (has valid tokens and status is ACTIVE)
			const connected = !!integration.refreshToken && 
				integration.status === ACTIVE_STATUS && 
				!isExpired;

			return {
				success: true,
				data: {
					integrationId: integration.id,
					hasAccessToken: !!integration.accessToken,
					hasRefreshToken: !!integration.refreshToken,
					accessTokenExpiresAt: integration.accessTokenExpiresAt?.toISOString() || null,
					isExpired,
					scope: integration.scope,
					status: String(integration.status),
					userId: integration.userId,
					connected, // Add connected field for frontend
				},
				meta: {
					has_credentials: true,
					created_at: integration.createdAt.toISOString(),
					updated_at: integration.updatedAt.toISOString(),
				},
			};
		} catch (error) {
			console.error('Google Ads API get stored credentials error:', error);

			if (error instanceof TRPCError) {
				throw error;
			}

			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to retrieve stored credentials',
			});
		}
	}),

	/**
	 * Revoke Google Ads integration (disconnect)
	 */
	revokeToken: protectedProcedure.mutation(async ({ ctx }) => {
		try {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'User session not found',
				});
			}

			const [integration] = await db
				.select()
				.from(googleAdsIntegration)
				.where(eq(googleAdsIntegration.userId, userId))
				.orderBy(desc(googleAdsIntegration.createdAt))
				.limit(1);

			if (!integration) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'No Google Ads integration found',
				});
			}

			// Revoke tokens with Google
			if (integration.refreshToken) {
				await revokeTokens(integration.refreshToken);
			}

			await db
				.update(googleAdsIntegration)
				.set({
					status: REVOKED_STATUS,
					updatedAt: new Date(),
				})
				.where(eq(googleAdsIntegration.id, integration.id));

			await db.insert(googleAdsIntegrationActivityLog).values({
				id: randomUUID(),
				integrationId: integration.id,
				userId,
				action: 'REVOKE',
				description: 'Google Ads integration revoked and disconnected',
				metadata: {
					revokedAt: new Date().toISOString(),
				},
				ipAddress: null,
				userAgent: null,
				createdAt: new Date(),
			});

			return {
				success: true,
				data: {
					revoked: true,
				},
				meta: {
					revoked_at: new Date().toISOString(),
				},
			};
		} catch (error) {
			console.error('Google Ads API revoke token error:', error);

			if (error instanceof TRPCError) {
				throw error;
			}

			const errorInfo = GoogleAdsErrorHandler.handleError(error);
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: errorInfo.message,
			});
		}
	}),
});


