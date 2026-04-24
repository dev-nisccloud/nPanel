import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { socialMediaIntegration } from "@npanel/db/schema/social-media-marketing";
import { router, protectedProcedure } from '../../trpc';
import { TRPCError } from "@trpc/server";
import { getStoredMetaAccessToken } from '../../lib/meta-credentials';

const isAgencyUserRole = (role: string | null | undefined) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

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
	getStoredCredentials: protectedProcedure.query(async ({ ctx }) => {
		try {
			const role = ctx.session?.user?.role;
			if (!isAgencyUserRole(role)) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only agency users can access Meta Ads credentials',
				});
			}
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







