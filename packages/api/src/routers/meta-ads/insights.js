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
        .input(z.object({
        entityId: z.string().min(1, 'Entity ID is required'),
        level: z.enum(['campaign', 'adset', 'ad']),
        timeRange: z.object({
            since: z.string(), // YYYY-MM-DD
            until: z.string(), // YYYY-MM-DD
        }),
        publisherPlatform: z.enum(['facebook', 'instagram', 'audience_network', 'messenger']).optional(),
    }))
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
                    'frequency', // Added: Ad fatigue
                    'ctr',
                    'cpc',
                    'unique_clicks', // Added: Real reach
                    'unique_ctr', // Added: Real CTR
                    'purchase_roas', // Added: ROI
                    'quality_ranking', // Added: Ad relevance
                    'engagement_rate_ranking', // Added: Ad relevance
                    'conversion_rate_ranking', // Added: Ad relevance
                    'video_p25_watched_actions', // Added: Funnel
                    'video_p50_watched_actions', // Added: Funnel
                    'video_p75_watched_actions', // Added: Funnel
                    'video_p100_watched_actions', // Added: Funnel
                    'date_start',
                    'date_stop',
                    'actions',
                ],
                breakdowns: input.publisherPlatform ? ['publisher_platform'] : undefined,
            });
            // Filter rows if platform specified
            const filteredData = input.publisherPlatform
                ? response.data.filter((row) => row.publisher_platform === input.publisherPlatform)
                : response.data;
            return {
                success: true,
                data: filteredData,
            };
        }
        catch (error) {
            const oauthError = await handleMetaAdsOAuthError(error);
            if (oauthError)
                throw oauthError;
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
        .input(z.object({
        entityId: z.string().min(1, 'Entity ID is required'),
        level: z.enum(['campaign', 'adset', 'ad']),
        timeRange: z.object({
            since: z.string(),
            until: z.string(),
        }),
        breakdown: z.enum(['age', 'gender', 'publisher_platform', 'device_platform', 'region', 'platform_position', 'hourly_stats_aggregated_by_audience_time_zone']),
        publisherPlatform: z.enum(['facebook', 'instagram', 'audience_network', 'messenger']).optional(),
    }))
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
                // Avoid action-derived metrics here; they can force action_type combinations
                // that Meta rejects with age/gender/region/hourly breakdowns.
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
                    ? response.data.filter((row) => row.publisher_platform === input.publisherPlatform)
                    : response.data;
                return {
                    success: true,
                    data: filteredData,
                    meta: {
                        fallbackUsed: false,
                    },
                };
            }
            catch (primaryError) {
                const message = primaryError instanceof Error ? primaryError.message : String(primaryError ?? '');
                const hasInvalidBreakdownCombo = message.includes('Current combination of data breakdown columns') ||
                    message.includes('action_type');
                // Fallback: retry without forcing publisher_platform in breakdowns.
                // This keeps charts loading even when Meta rejects the combined breakdown set.
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
        }
        catch (error) {
            const oauthError = await handleMetaAdsOAuthError(error);
            if (oauthError)
                throw oauthError;
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to fetch breakdowns',
            });
        }
    }),
});
