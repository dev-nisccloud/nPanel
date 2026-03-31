import { and, desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
	socialMediaIntegration,
	socialMediaPageToken,
} from "@npanel/db/schema/social-media-marketing";

/**
 * Get stored LinkedIn access token (global integration)
 * Returns the access token if available and not expired, or null
 */
export async function getStoredLinkedInAccessToken(): Promise<{
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
					eq(socialMediaIntegration.platform, "LINKEDIN"),
					eq(socialMediaIntegration.status, "ACTIVE"),
				),
			)
			.orderBy(desc(socialMediaIntegration.createdAt))
			.limit(1);

		if (!integration || !integration.accessToken) {
			return null;
		}

		// Check if token is expired
		if (
			integration.accessTokenExpiresAt &&
			new Date(integration.accessTokenExpiresAt) < new Date()
		) {
			// Update status to expired
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
		console.error('Error retrieving stored LinkedIn credentials:', error);
		return null;
	}
}

export async function getStoredLinkedInAccessTokenForUser(
	userId: string
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
					eq(socialMediaIntegration.platform, "LINKEDIN"),
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
		console.error('Error retrieving stored LinkedIn credentials for user:', error);
		return null;
	}
}

/**
 * Get stored page access token for a specific LinkedIn Organization
 * Returns the access token if available, not expired, and integration is active
 * Note: Filters by LINKEDIN platform to ensure correct platform token
 */
export async function getStoredLinkedInPageAccessToken(
	pageId: string
): Promise<{ accessToken: string; integrationId: string } | null> {
	try {
		const [pageToken] = await db
			.select({
				id: socialMediaPageToken.id,
				accessToken: socialMediaPageToken.accessToken,
				accessTokenExpiresAt: socialMediaPageToken.accessTokenExpiresAt,
				integrationId: socialMediaPageToken.integrationId,
				pageIsActive: socialMediaPageToken.isActive,
				integrationStatus: socialMediaIntegration.status,
			})
			.from(socialMediaPageToken)
			.leftJoin(
				socialMediaIntegration,
				eq(socialMediaPageToken.integrationId, socialMediaIntegration.id),
			)
			.where(
				and(
					eq(socialMediaPageToken.pageId, pageId),
					eq(socialMediaPageToken.platform, "LINKEDIN"),
					eq(socialMediaPageToken.isActive, true),
				),
			)
			.limit(1);

		if (!pageToken || pageToken.integrationStatus !== "ACTIVE") {
			return null;
		}

		// Check if token is expired
		if (
			pageToken.accessTokenExpiresAt &&
			new Date(pageToken.accessTokenExpiresAt) < new Date()
		) {
			// Update status to inactive
			await db
				.update(socialMediaPageToken)
				.set({ isActive: false })
				.where(eq(socialMediaPageToken.id, pageToken.id));
			return null;
		}

		return {
			accessToken: pageToken.accessToken,
			integrationId: pageToken.integrationId,
		};
	} catch (error) {
		console.error('Error retrieving stored LinkedIn page token:', error);
		return null;
	}
}




