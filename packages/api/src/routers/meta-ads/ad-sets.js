import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { MetaAdsClient } from '../../lib/meta-ads-client';
import { getStoredMetaAccessToken } from '../../lib/meta-credentials';
import { handleMetaAdsOAuthError } from './error-handler';
/**
 * Map Meta API status to our status format
 */
function mapAdSetStatus(status) {
    const statusUpper = status.toUpperCase();
    if (statusUpper === 'ACTIVE')
        return 'ACTIVE';
    if (statusUpper === 'PAUSED')
        return 'PAUSED';
    if (statusUpper === 'ARCHIVED')
        return 'ARCHIVED';
    if (statusUpper === 'DELETED')
        return 'DELETED';
    return statusUpper;
}
export const metaAdsAdSetsRouter = router({
    /**
     * List ad sets for a campaign
     * GET /{campaign-id}/adsets
     */
    listAdSets: protectedProcedure
        .input(z.object({
        campaignId: z.string().min(1, 'Campaign ID is required'),
        datePreset: z.string().optional(),
        timeRange: z.object({
            since: z.string().optional(),
            until: z.string().optional(),
        }).optional(),
        publisherPlatform: z.enum(['facebook', 'instagram', 'audience_network', 'messenger']).optional(),
    }))
        .query(async ({ input, ctx }) => {
        try {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User session not found',
                });
            }
            const tokenData = await getStoredMetaAccessToken();
            if (!tokenData) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'No active Meta integration found. Please connect your account first.',
                });
            }
            const client = new MetaAdsClient({ accessToken: tokenData.accessToken });
            // Add initial delay before making requests to avoid hitting rate limits
            await new Promise(resolve => setTimeout(resolve, 300));
            const response = await client.getAdSets(input.campaignId, {
                fields: [
                    'id',
                    'name',
                    'status',
                    'daily_budget',
                    'lifetime_budget',
                    'budget_remaining',
                    'bid_amount',
                    'targeting',
                    'publisher_platforms', // e.g. ["facebook", "instagram"]
                    'instagram_positions', // e.g. ["stream", "story", "reels"]
                    'start_time',
                    'stop_time',
                    'created_time',
                    'updated_time',
                ],
            });
            // Fetch insights for all ad sets in bulk at the campaign level
            let adSetInsightsMap = {};
            try {
                let insightsOptions = {
                    level: 'adset',
                    metrics: [
                        'adset_id',
                        'impressions',
                        'clicks',
                        'spend',
                        'reach',
                        'frequency',
                        'ctr',
                        'cpc',
                        'cpm',
                        'cpp',
                        'unique_clicks',
                        'unique_ctr',
                        'purchase_roas',
                        'quality_ranking',
                        'engagement_rate_ranking',
                        'conversion_rate_ranking',
                        'inline_link_click_ctr',
                        'cost_per_result',
                        'cost_per_action_type',
                        'actions',
                    ],
                    breakdowns: input.publisherPlatform ? ['publisher_platform'] : undefined,
                };
                if (input.timeRange?.since && input.timeRange?.until) {
                    insightsOptions.timeRange = {
                        since: input.timeRange.since,
                        until: input.timeRange.until,
                    };
                }
                else if (input.datePreset) {
                    insightsOptions.datePreset = input.datePreset;
                }
                else {
                    // Default to maximum (lifetime) if no range provided
                    insightsOptions.datePreset = 'maximum';
                }
                const insightsResponse = await client.getInsights(input.campaignId, insightsOptions);
                if (insightsResponse.data && insightsResponse.data.length > 0) {
                    const filteredRows = input.publisherPlatform
                        ? insightsResponse.data.filter((row) => row.publisher_platform === input.publisherPlatform)
                        : insightsResponse.data;
                    filteredRows.forEach((insight) => {
                        if (insight.adset_id) {
                            adSetInsightsMap[insight.adset_id] = insight;
                        }
                    });
                }
            }
            catch (error) {
                console.error('Failed to fetch bulk insights for ad sets:', error);
                // Insights are optional, continue with empty map
            }
            const adSetsWithInsights = response.data.map((adSet) => {
                const insights = adSetInsightsMap[adSet.id] || null;
                // Format budget values
                const formatBudget = (budget) => {
                    if (budget === null || budget === undefined)
                        return null;
                    if (budget === '')
                        return null;
                    const num = typeof budget === 'string' ? parseFloat(budget) : budget;
                    if (isNaN(num))
                        return null;
                    return String(num / 100);
                };
                return {
                    id: adSet.id,
                    name: adSet.name || `Ad Set ${adSet.id}`,
                    status: mapAdSetStatus(adSet.status || 'ACTIVE'),
                    daily_budget: formatBudget(adSet.daily_budget),
                    lifetime_budget: formatBudget(adSet.lifetime_budget),
                    budget_remaining: formatBudget(adSet.budget_remaining),
                    bid_amount: adSet.bid_amount || null,
                    targeting: adSet.targeting || null,
                    publisher_platforms: adSet.publisher_platforms || null, // ['facebook','instagram',...]
                    instagram_positions: adSet.instagram_positions || null, // ['stream','story','reels',...]
                    start_time: adSet.start_time || null,
                    stop_time: adSet.stop_time || null,
                    created_time: adSet.created_time || null,
                    updated_time: adSet.updated_time || null,
                    insights: insights ? {
                        reach: (insights.reach && insights.reach !== '') ? String(insights.reach) : null,
                        impressions: (insights.impressions && insights.impressions !== '') ? String(insights.impressions) : null,
                        clicks: (insights.clicks && insights.clicks !== '') ? String(insights.clicks) : null,
                        link_clicks: (() => {
                            if (insights.actions && Array.isArray(insights.actions)) {
                                const linkClickAction = insights.actions.find((action) => action.action_type === 'link_click' || action.action_type === 'inline_link_click');
                                if (linkClickAction && linkClickAction.value) {
                                    return String(linkClickAction.value);
                                }
                            }
                            return null;
                        })(),
                        cpc: (insights.cpc && insights.cpc !== '') ? String(insights.cpc) : null,
                        ctr: (insights.ctr && insights.ctr !== '') ? String(insights.ctr) : null,
                        spend: (insights.spend && insights.spend !== '') ? String(insights.spend) : null,
                        cpm: (insights.cpm && insights.cpm !== '') ? String(insights.cpm) : null,
                        cpp: (insights.cpp && insights.cpp !== '') ? String(insights.cpp) : null,
                        frequency: (insights.frequency && insights.frequency !== '') ? String(insights.frequency) : null,
                        unique_clicks: (insights.unique_clicks && insights.unique_clicks !== '') ? String(insights.unique_clicks) : null,
                        unique_ctr: (insights.unique_ctr && insights.unique_ctr !== '') ? String(insights.unique_ctr) : null,
                        purchase_roas: insights.purchase_roas || null,
                        quality_ranking: insights.quality_ranking || null,
                        engagement_rate_ranking: insights.engagement_rate_ranking || null,
                        conversion_rate_ranking: insights.conversion_rate_ranking || null,
                        cost_per_result: (() => {
                            if (insights.cost_per_result && insights.cost_per_result !== '') {
                                return String(insights.cost_per_result);
                            }
                            if (insights.cost_per_action_type && Array.isArray(insights.cost_per_action_type)) {
                                const resultAction = insights.cost_per_action_type.find((action) => action.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
                                    action.action_type === 'link_click' ||
                                    action.action_type === 'offsite_conversion.fb_pixel_purchase');
                                if (resultAction && resultAction.value) {
                                    return String(resultAction.value);
                                }
                                if (insights.cost_per_action_type[0]?.value) {
                                    return String(insights.cost_per_action_type[0].value);
                                }
                            }
                            return null;
                        })(),
                        leads: (() => {
                            if (insights.actions && Array.isArray(insights.actions)) {
                                const leadAction = insights.actions.find((action) => action.action_type === 'lead');
                                if (leadAction && leadAction.value) {
                                    return String(leadAction.value);
                                }
                            }
                            return null;
                        })(),
                        cost_per_lead: (() => {
                            if (insights.cost_per_action_type && Array.isArray(insights.cost_per_action_type)) {
                                const leadCost = insights.cost_per_action_type.find((action) => action.action_type === 'lead');
                                if (leadCost && leadCost.value) {
                                    return String(leadCost.value);
                                }
                            }
                            return null;
                        })(),
                        actions: insights.actions || [],
                    } : null,
                };
            });
            return {
                data: adSetsWithInsights,
                paging: response.paging,
            };
        }
        catch (error) {
            console.error('Meta Ads API list ad sets error:', error);
            // Handle OAuth token errors - delete credentials and require re-authentication
            const oauthError = await handleMetaAdsOAuthError(error);
            if (oauthError) {
                throw oauthError;
            }
            // Handle rate limit errors specifically
            if (error.code === 17 || error.message?.includes('request limit') || error.message?.includes('rate limit')) {
                throw new TRPCError({
                    code: 'TOO_MANY_REQUESTS',
                    message: 'Meta Ads API rate limit reached. Please wait a moment and try again.',
                    cause: error,
                });
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Failed to fetch ad sets. Please try again.',
                cause: error,
            });
        }
    }),
    /**
     * Get ad set details
     * GET /{ad-set-id}
     */
    getAdSetDetails: protectedProcedure
        .input(z.object({
        adSetId: z.string().min(1, 'Ad Set ID is required'),
        publisherPlatform: z.enum(['facebook', 'instagram', 'audience_network', 'messenger']).optional(),
    }))
        .query(async ({ input, ctx }) => {
        try {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User session not found',
                });
            }
            const tokenData = await getStoredMetaAccessToken();
            if (!tokenData) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'No active Meta integration found. Please connect your account first.',
                });
            }
            const client = new MetaAdsClient({ accessToken: tokenData.accessToken });
            const adSet = await client.getAdSetDetails(input.adSetId, [
                'id',
                'name',
                'status',
                'daily_budget',
                'lifetime_budget',
                'budget_remaining',
                'bid_amount',
                'targeting',
                'publisher_platforms',
                'instagram_positions',
                'start_time',
                'stop_time',
                'created_time',
                'updated_time',
            ]);
            return {
                data: {
                    id: adSet.id,
                    name: adSet.name || `Ad Set ${adSet.id}`,
                    status: mapAdSetStatus(adSet.status || 'ACTIVE'),
                    daily_budget: adSet.daily_budget || null,
                    lifetime_budget: adSet.lifetime_budget || null,
                    budget_remaining: adSet.budget_remaining || null,
                    bid_amount: adSet.bid_amount || null,
                    targeting: adSet.targeting || null,
                    publisher_platforms: adSet.publisher_platforms || null,
                    instagram_positions: adSet.instagram_positions || null,
                    start_time: adSet.start_time || null,
                    stop_time: adSet.stop_time || null,
                    created_time: adSet.created_time || null,
                    updated_time: adSet.updated_time || null,
                },
            };
        }
        catch (error) {
            console.error('Meta Ads API get ad set details error:', error);
            // Handle OAuth token errors - delete credentials and require re-authentication
            const oauthError = await handleMetaAdsOAuthError(error);
            if (oauthError) {
                throw oauthError;
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Failed to fetch ad set details. Please try again.',
                cause: error,
            });
        }
    }),
    /**
     * Get human-readable targeting description for an ad set
     * GET /{ad-set-id}/targetingsentencelines
     */
    getTargetingSentenceLines: protectedProcedure
        .input(z.object({
        adSetId: z.string().min(1, 'Ad Set ID is required'),
    }))
        .query(async ({ input, ctx }) => {
        try {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User session not found',
                });
            }
            const tokenData = await getStoredMetaAccessToken();
            if (!tokenData) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'No active Meta integration found. Please connect your account first.',
                });
            }
            const client = new MetaAdsClient({ accessToken: tokenData.accessToken });
            const result = await client.getTargetingSentenceLines(input.adSetId);
            return {
                data: result.targetingsentencelines || [],
            };
        }
        catch (error) {
            console.warn('Meta Ads API get targeting sentence lines error (fallback to raw targeting):', error?.message || error);
            // OAuth errors should still be thrown so user can reconnect
            const oauthError = await handleMetaAdsOAuthError(error);
            if (oauthError) {
                throw oauthError;
            }
            // On rate limit or other errors, return empty so UI can show parsed targeting instead
            return { data: [] };
        }
    }),
    /**
     * Get human-readable targeting descriptions for multiple ad sets in bulk
     */
    getBulkTargetingSentenceLines: protectedProcedure
        .input(z.object({
        adSetIds: z.array(z.string()).min(1, 'Ad Set IDs are required'),
    }))
        .query(async ({ input, ctx }) => {
        try {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User session not found',
                });
            }
            const tokenData = await getStoredMetaAccessToken();
            if (!tokenData) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'No active Meta integration found. Please connect your account first.',
                });
            }
            const client = new MetaAdsClient({ accessToken: tokenData.accessToken });
            // Fetch targeting for each ad set in parallel
            const results = await Promise.all(input.adSetIds.map(async (id) => {
                try {
                    const res = await client.getTargetingSentenceLines(id);
                    return { id, data: res.targetingsentencelines || [] };
                }
                catch (e) {
                    console.warn(`Failed to fetch targeting for ad set ${id}:`, e);
                    return { id, data: [] };
                }
            }));
            const targetingMap = {};
            results.forEach(r => {
                targetingMap[r.id] = r.data;
            });
            return {
                data: targetingMap,
            };
        }
        catch (error) {
            console.error('Meta Ads API bulk targeting error:', error);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to fetch bulk targeting',
            });
        }
    }),
});
