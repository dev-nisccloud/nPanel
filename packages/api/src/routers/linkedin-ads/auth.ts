import { router, protectedProcedure } from '../../trpc';
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { socialMediaIntegration } from "@npanel/db/schema/social-media-marketing";
import { getStoredLinkedInAccessTokenForUser } from '../../lib/linkedin-credentials';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

/**
 * LinkedIn Ads Auth Router
 * Reuses existing SocialMediaIntegration for LinkedIn OAuth
 * Checks for Marketing API scopes (r_ads, r_ads_reporting)
 */
export const linkedInAdsAuthRouter = router({
	/**
	 * Get stored LinkedIn credentials (integration status)
	 * Checks if token has Marketing API scopes
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
			const tokenData = await getStoredLinkedInAccessTokenForUser(userId);

			if (!tokenData) {
				return {
					success: true,
					data: {
						connected: false,
						hasAccessToken: false,
						accessTokenExpiresAt: null,
						isExpired: true,
						scope: null,
						status: null,
					},
					meta: {
						has_credentials: false,
					},
				};
			}

			// Get integration details
			const integration = await db.query.socialMediaIntegration.findFirst({
				where: eq(socialMediaIntegration.id, tokenData.integrationId),
			});

			if (!integration) {
				return {
					success: true,
					data: {
						connected: false,
						hasAccessToken: false,
						accessTokenExpiresAt: null,
						isExpired: true,
						scope: null,
						status: null,
					},
					meta: {
						has_credentials: false,
					},
				};
			}

			// Check if token is expired
			const isExpired =
				integration.accessTokenExpiresAt &&
				new Date(integration.accessTokenExpiresAt) < new Date();

			// Check if token has Marketing API scopes
			const scope = integration.scope || '';
			const hasAdsScopes = scope.includes('r_ads') || scope.includes('r_ads_reporting');

			// Determine if connected:
			// treat any active, non-expired LinkedIn integration as "connected" for the Ads UI,
			// and expose hasAdsScopes separately so the frontend can show a warning if needed.
			const connected =
				!!integration.accessToken &&
				integration.status === 'ACTIVE' &&
				!isExpired;

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
					connected, // Add connected field for frontend
					hasAdsScopes, // Indicate if Marketing API scopes are present
				},
				meta: {
					has_credentials: true,
					created_at: integration.createdAt.toISOString(),
					updated_at: integration.updatedAt.toISOString(),
				},
			};
		} catch (error) {

			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to retrieve stored credentials',
			});
		}
	}),

	/**
	 * Generate LinkedIn OAuth URL with Marketing API scopes
	 * Reuses existing LinkedIn auth but ensures ads scopes are included
	 */
	generateAuthUrl: protectedProcedure
		.input(
			z.object({
				redirectUri: z.string().url().optional(),
			})
		)
		.mutation(async ({ input }) => {
			try {
				const clientId = process.env.LINKEDIN_CLIENT_ID;
				if (!clientId) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'LINKEDIN_CLIENT_ID environment variable is not set',
					});
				}

				const frontendUrl = process.env.FRONTEND_URL || process.env.VITE_PUBLIC_APP_URL || 'http://localhost:3001';

				// Required scopes for LinkedIn Marketing API
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
					`${frontendUrl}/agency/ad-campaigns/linkedin-ads/callback`;

				const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&prompt=consent&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes.join(' '))}`;

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

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate LinkedIn OAuth URL',
				});
			}
		}),
});

