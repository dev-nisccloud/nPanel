import { eq } from "drizzle-orm";
import { db } from "@npanel/db";
import { socialMediaIntegration } from "@npanel/db/schema/social-media-marketing";
import { router, protectedProcedure } from '../../trpc';
import { getStoredMetaAccessToken } from '../../lib/meta-credentials';

/**
 * Meta Ads Auth Router
 * Reuses existing SocialMediaIntegration for Meta OAuth
 * The social media marketing auth endpoints can be used directly
 */
export const metaAdsAuthRouter = router({
	/**
	 * Get stored Meta credentials (integration status)
	 * Reuses the same integration as social media marketing
	 */
	getStoredCredentials: protectedProcedure.query(async () => {
		try {
			const tokenData = await getStoredMetaAccessToken();

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

			// Determine if connected (has valid token and status is ACTIVE)
			const connected = !!integration.accessToken && 
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
				},
				meta: {
					has_credentials: true,
					created_at: integration.createdAt.toISOString(),
					updated_at: integration.updatedAt.toISOString(),
				},
			};
		} catch (error) {
			console.error('Meta Ads API get stored credentials error:', error);

			throw new Error('Failed to retrieve stored credentials');
		}
	}),
});







