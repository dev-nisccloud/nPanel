import prisma from '@nPanel/db';

/**
 * Get stored Meta access token (global integration)
 * Returns the access token if available and not expired, or null
 */
export async function getStoredMetaAccessToken(): Promise<{
	accessToken: string;
	integrationId: string;
} | null> {
	try {
		const integration = await prisma.socialMediaIntegration.findFirst({
			where: {
				platform: 'META_FACEBOOK' as const,
				status: 'ACTIVE' as const,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		if (!integration || !integration.accessToken) {
			return null;
		}

		// Check if token is expired
		if (
			integration.accessTokenExpiresAt &&
			new Date(integration.accessTokenExpiresAt) < new Date()
		) {
			// Update status to expired
			await prisma.socialMediaIntegration.update({
				where: { id: integration.id },
				data: { status: 'EXPIRED' as const },
			});
			return null;
		}

		return {
			accessToken: integration.accessToken,
			integrationId: integration.id,
		};
	} catch (error) {
		console.error('Error retrieving stored Meta credentials:', error);
		return null;
	}
}

/**
 * Get stored page access token for a specific Facebook Page
 */
export async function getStoredPageAccessToken(
	pageId: string
): Promise<{ accessToken: string; integrationId: string } | null> {
	try {
		const pageToken = await prisma.socialMediaPageToken.findFirst({
			where: {
				pageId,
				isActive: true,
			},
			include: {
				integration: true,
			},
		});

		if (!pageToken || pageToken.integration.status !== 'ACTIVE') {
			return null;
		}

		return {
			accessToken: pageToken.accessToken,
			integrationId: pageToken.integrationId,
		};
	} catch (error) {
		console.error('Error retrieving stored page token:', error);
		return null;
	}
}
