import { TRPCError } from '@trpc/server';
import prisma from '@nPanel/db';
import { MetaAdsApiError } from '../../lib/meta-ads-client';
import { getStoredMetaAccessToken } from '../../lib/meta-credentials';

/**
 * Handle Meta Ads API OAuth errors
 * Detects OAuth token invalidation errors and deletes stored credentials
 * Returns a TRPCError with requiresReconnect flag if credentials were deleted
 */
export async function handleMetaAdsOAuthError(error: unknown): Promise<TRPCError | null> {
	// Check if error is an OAuth token error
	if (error instanceof MetaAdsApiError) {
		// Check for OAuth token errors: code 190 (OAuthException) or errorSubcode 460 (session invalidated)
		if (
			error.code === 190 &&
			error.type === 'OAuthException' &&
			(error.errorSubcode === 460 || error.message.toLowerCase().includes('session has been invalidated'))
		) {
			// Invalidate stored credentials
			try {
				const tokenData = await getStoredMetaAccessToken();
				if (tokenData) {
					await prisma.socialMediaIntegration.update({
						where: { id: tokenData.integrationId },
						data: {
							status: 'EXPIRED',
							accessTokenExpiresAt: null,
						},
					});
					console.log('Invalidated Meta credentials due to OAuth error');
				}
			} catch (deleteError) {
				console.error('Error invalidating credentials:', deleteError);
			}

			return new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'Your Facebook session has been invalidated. Please reconnect your account.',
				cause: {
					requiresReconnect: true,
					originalError: {
						code: error.code,
						type: error.type,
						errorSubcode: error.errorSubcode,
						message: error.message,
					},
				},
			});
		}
	}
	return null;
}
