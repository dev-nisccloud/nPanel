import { and, desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
	socialMediaIntegration,
} from "@npanel/db/schema/social-media-marketing";

/**
 * Get stored Instagram (standalone Instagram API with Instagram Login)
 * access token for the global agency integration. Returns the access token
 * if available and not expired, or null.
 */
export async function getStoredInstagramAccessToken(): Promise<{
	accessToken: string;
	integrationId: string;
} | null> {
	try {
		const [integration] = await db
			.select({
				id: socialMediaIntegration.id,
				accessToken: socialMediaIntegration.accessToken,
				accessTokenExpiresAt: socialMediaIntegration.accessTokenExpiresAt,
				status: socialMediaIntegration.status,
			})
			.from(socialMediaIntegration)
			.where(
				and(
					eq(socialMediaIntegration.platform, "INSTAGRAM"),
					eq(socialMediaIntegration.status, "ACTIVE"),
				),
			)
			.orderBy(desc(socialMediaIntegration.createdAt))
			.limit(1);

		if (!integration || !integration.accessToken) {
			return null;
		}

		if (
			integration.accessTokenExpiresAt &&
			new Date(integration.accessTokenExpiresAt) < new Date()
		) {
			await db
				.update(socialMediaIntegration)
				.set({ status: "EXPIRED" })
				.where(eq(socialMediaIntegration.id, integration.id));
			return null;
		}

		return {
			accessToken: integration.accessToken,
			integrationId: integration.id,
		};
	} catch (error) {
		console.error('Error retrieving stored Instagram credentials:', error);
		return null;
	}
}

/**
 * Get stored Instagram access token for a specific user (used by non-agency
 * flows where each user owns their own Instagram integration).
 */
export async function getStoredInstagramAccessTokenForUser(
	userId: string,
): Promise<{
	accessToken: string;
	integrationId: string;
} | null> {
	try {
		const [integration] = await db
			.select({
				id: socialMediaIntegration.id,
				accessToken: socialMediaIntegration.accessToken,
				accessTokenExpiresAt: socialMediaIntegration.accessTokenExpiresAt,
				status: socialMediaIntegration.status,
			})
			.from(socialMediaIntegration)
			.where(
				and(
					eq(socialMediaIntegration.platform, "INSTAGRAM"),
					eq(socialMediaIntegration.status, "ACTIVE"),
					eq(socialMediaIntegration.userId, userId),
				),
			)
			.orderBy(desc(socialMediaIntegration.createdAt))
			.limit(1);

		if (!integration || !integration.accessToken) {
			return null;
		}

		if (
			integration.accessTokenExpiresAt &&
			new Date(integration.accessTokenExpiresAt) < new Date()
		) {
			await db
				.update(socialMediaIntegration)
				.set({ status: "EXPIRED" })
				.where(eq(socialMediaIntegration.id, integration.id));
			return null;
		}

		return {
			accessToken: integration.accessToken,
			integrationId: integration.id,
		};
	} catch (error) {
		console.error('Error retrieving stored Instagram credentials for user:', error);
		return null;
	}
}

/**
 * Resolve the Instagram access token to use given the current session.
 * Agency users share a single global integration; client users use their own.
 */
export async function getStoredInstagramAccessTokenForSession(params: {
	userId: string;
	role?: string | null;
}): Promise<{
	accessToken: string;
	integrationId: string;
} | null> {
	const isAgencyUser = (params.role ?? '').includes('AGENCY');
	if (isAgencyUser) {
		return getStoredInstagramAccessToken();
	}
	return getStoredInstagramAccessTokenForUser(params.userId);
}
