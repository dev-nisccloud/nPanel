import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { MetaAdsClient } from '../../lib/meta-ads-client';
import { getStoredMetaAccessToken } from '../../lib/meta-credentials';
import { handleMetaAdsOAuthError } from './error-handler';

/**
 * Get user's Meta integration with valid tokens
 */
async function getUserIntegration() {
    const tokenData = await getStoredMetaAccessToken();

    if (!tokenData) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No active Meta integration found. Please connect your account first.',
        });
    }

    return tokenData;
}

export const metaAdsInsightsRouter = router({
    /**
     * Get daily performance metrics for a specific entity
     */
    getDailyPerformance: protectedProcedure
        .input(
            z.object({
                entityId: z.string().min(1, 'Entity ID is required'),
                level: z.enum(['campaign', 'adset', 'ad']),
                timeRange: z.object({
                    since: z.string(), // YYYY-MM-DD
                    until: z.string(), // YYYY-MM-DD
                }),
            })
        )
        .query(async ({ input }) => {
            try {
                const { accessToken } = await getUserIntegration();
                const client = new MetaAdsClient({ accessToken });

                const response = await client.getInsights(input.entityId, {
                    level: input.level,
                    timeRange: input.timeRange,
                    timeIncrement: 1, // Daily
                    metrics: [
                        'impressions',
                        'clicks',
                        'inline_link_clicks',
                        'spend',
                        'reach',
                        'ctr',
                        'cpc',
                        'date_start',
                        'date_stop',
                        'actions',
                    ],
                });

                return {
                    success: true,
                    data: response.data,
                };
            } catch (error) {
                const oauthError = await handleMetaAdsOAuthError(error);
                if (oauthError) throw oauthError;

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to fetch daily performance',
                });
            }
        }),

    /**
     * Get audience and platform breakdowns for a specific entity
     */
    getBreakdowns: protectedProcedure
        .input(
            z.object({
                entityId: z.string().min(1, 'Entity ID is required'),
                level: z.enum(['campaign', 'adset', 'ad']),
                timeRange: z.object({
                    since: z.string(),
                    until: z.string(),
                }),
                breakdown: z.enum(['age', 'gender', 'publisher_platform', 'device_platform']),
            })
        )
        .query(async ({ input }) => {
            try {
                const { accessToken } = await getUserIntegration();
                const client = new MetaAdsClient({ accessToken });

                const response = await client.getInsights(input.entityId, {
                    level: input.level,
                    timeRange: input.timeRange,
                    breakdowns: [input.breakdown],
                    metrics: [
                        'impressions',
                        'clicks',
                        'inline_link_clicks',
                        'spend',
                        'date_start',
                        'date_stop',
                    ],
                });

                return {
                    success: true,
                    data: response.data,
                };
            } catch (error) {
                const oauthError = await handleMetaAdsOAuthError(error);
                if (oauthError) throw oauthError;

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to fetch breakdowns',
                });
            }
        }),
});
