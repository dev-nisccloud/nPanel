import { TRPCError } from '@trpc/server';
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { socialMediaIntegration } from "@npanel/db/schema/social-media-marketing";
import { MetaAdsApiError } from '../../lib/meta-ads-client';
import { getStoredInstagramAccessToken } from '../../lib/meta-credentials';
/**
 * Handle Instagram Ads API OAuth errors
 * Detects OAuth token invalidation errors and marks stored credentials as EXPIRED
 * Returns a TRPCError with requiresReconnect flag if credentials were invalidated
 */
export async function handleInstagramAdsOAuthError(error) {
    if (error instanceof MetaAdsApiError) {
        // code 190 (OAuthException) or errorSubcode 460 (session invalidated)
        if (error.code === 190 &&
            error.type === 'OAuthException' &&
            (error.errorSubcode === 460 || error.message.toLowerCase().includes('session has been invalidated'))) {
            try {
                const tokenData = await getStoredInstagramAccessToken();
                if (tokenData) {
                    await db
                        .update(socialMediaIntegration)
                        .set({
                        status: 'EXPIRED',
                        accessTokenExpiresAt: null,
                    })
                        .where(eq(socialMediaIntegration.id, tokenData.integrationId));
                    console.log('Invalidated Instagram credentials due to OAuth error');
                }
            }
            catch (err) {
                console.error('Error invalidating Instagram credentials:', err);
            }
            return new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Your Instagram session has been invalidated. Please reconnect your account.',
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
