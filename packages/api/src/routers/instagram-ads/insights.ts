import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { MetaAdsClient } from '../../lib/meta-ads-client';
import { getStoredInstagramAccessToken } from '../../lib/meta-credentials';
import { handleInstagramAdsOAuthError } from './error-handler';

/**
 * Get user's Instagram integration with valid tokens
 */
async function getUserIntegration() {
    const tokenData = await getStoredInstagramAccessToken();

    if (!tokenData) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No active Instagram integration found. Please connect your account first.',
        });
    }

    return tokenData;
}

export const instagramAdsInsightsRouter = router({
    /**
     * Get daily performance metrics for a specific entity using Instagram token
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
                publisherPlatform: z.enum(['facebook', 'instagram', 'audience_network', 'messenger']).optional(),
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
                        'frequency',
                        'ctr',
                        'cpc',
                        'unique_clicks',
                        'unique_ctr',
                        'purchase_roas',
                        'quality_ranking',
                        'engagement_rate_ranking',
                        'conversion_rate_ranking',
                        'video_p25_watched_actions',
                        'video_p50_watched_actions',
                        'video_p75_watched_actions',
                        'video_p100_watched_actions',
                        'date_start',
                        'date_stop',
                        'actions',
                    ],
                    breakdowns: input.publisherPlatform ? ['publisher_platform'] : undefined,
                });

                // Filter rows if platform specified
                const filteredData = input.publisherPlatform
                    ? response.data.filter((row: any) => row.publisher_platform === input.publisherPlatform)
                    : response.data;

                return {
                    success: true,
                    data: filteredData,
                };
            } catch (error) {
                const oauthError = await handleInstagramAdsOAuthError(error);
                if (oauthError) throw oauthError;

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to fetch Instagram daily performance',
                });
            }
        }),

    /**
     * Get audience and platform breakdowns for a specific entity using Instagram token
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
                breakdown: z.enum(['age', 'gender', 'publisher_platform', 'device_platform', 'region', 'platform_position', 'hourly_stats_aggregated_by_audience_time_zone']),
                publisherPlatform: z.enum(['facebook', 'instagram', 'audience_network', 'messenger']).optional(),
            })
        )
        .query(async ({ input }) => {
            try {
                const { accessToken } = await getUserIntegration();
                const client = new MetaAdsClient({ accessToken });

                const breakdowns = input.breakdown === 'platform_position'
                    ? ['publisher_platform', 'platform_position']
                    : input.breakdown === 'device_platform'
                        ? ['publisher_platform', 'device_platform']
                        : [input.breakdown];

                // If we have a filter but it's not the primary breakdown, we need to add publisher_platform to the breakdown list
                const allBreakdowns = input.publisherPlatform && !breakdowns.includes('publisher_platform')
                    ? [...breakdowns, 'publisher_platform']
                    : breakdowns;

                const metrics = [
                    'impressions',
                    'clicks',
                    'spend',
                    'date_start',
                    'date_stop',
                ];

                try {
                    const response = await client.getInsights(input.entityId, {
                        level: input.level,
                        timeRange: input.timeRange,
                        breakdowns: allBreakdowns,
                        metrics,
                    });

                    // Filter rows if platform specified
                    const filteredData = input.publisherPlatform
                        ? response.data.filter((row: any) => row.publisher_platform === input.publisherPlatform)
                        : response.data;

                    return {
                        success: true,
                        data: filteredData,
                        meta: {
                            fallbackUsed: false,
                        },
                    };
                } catch (primaryError) {
                    const message = primaryError instanceof Error ? primaryError.message : String(primaryError ?? '');
                    const hasInvalidBreakdownCombo =
                        message.includes('Current combination of data breakdown columns') ||
                        message.includes('action_type');

                    if (hasInvalidBreakdownCombo && allBreakdowns.includes('publisher_platform')) {
                        const fallbackResponse = await client.getInsights(input.entityId, {
                            level: input.level,
                            timeRange: input.timeRange,
                            breakdowns,
                            metrics,
                        });

                        return {
                            success: true,
                            data: fallbackResponse.data,
                            meta: {
                                fallbackUsed: true,
                                fallbackReason: 'invalid_breakdown_combination',
                            },
                        };
                    }

                    throw primaryError;
                }
            } catch (error) {
                const oauthError = await handleInstagramAdsOAuthError(error);
                if (oauthError) throw oauthError;

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to fetch Instagram breakdowns',
                });
            }
        }),
});
