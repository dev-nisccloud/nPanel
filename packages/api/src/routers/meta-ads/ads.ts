import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { MetaAdsClient } from '../../lib/meta-ads-client';
import { getStoredMetaAccessToken } from '../../lib/meta-credentials';
import { handleMetaAdsOAuthError } from './error-handler';

/**
 * Map Meta API status to our status format
 */
function mapAdStatus(status: string): string {
	const statusUpper = status.toUpperCase();
	if (statusUpper === 'ACTIVE') return 'ACTIVE';
	if (statusUpper === 'PAUSED') return 'PAUSED';
	if (statusUpper === 'ARCHIVED') return 'ARCHIVED';
	if (statusUpper === 'DELETED') return 'DELETED';
	return statusUpper;
}

export const metaAdsAdsRouter = router({
	/**
	 * List ads for an ad set
	 * GET /{ad-set-id}/ads
	 */
	listAds: protectedProcedure
		.input(
			z.object({
				adSetId: z.string().min(1, 'Ad Set ID is required'),
				timeRange: z.object({
					since: z.string().optional(),
					until: z.string().optional(),
				}).optional(),
			})
		)
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

				const response = await client.getAds(input.adSetId, {
					fields: [
						'id',
						'name',
						'status',
						'creative{image_url,thumbnail_url,name,title,body}',
						'created_time',
						'updated_time',
					],
				});

				// Fetch insights for each ad if timeRange is provided
				// Process sequentially with delay to avoid rate limits
				const adsWithInsights = [];
				let rateLimitHit = false;

				for (let i = 0; i < (response.data || []).length; i++) {
					const ad = response.data[i];
					let insights = null;

					// Skip insights if we've hit rate limit
					if (input.timeRange?.since && input.timeRange?.until && !rateLimitHit) {
						try {
							const insightsResponse = await client.getInsights(ad.id, {
								level: 'ad',
								metrics: [
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
								timeRange: {
									since: input.timeRange.since,
									until: input.timeRange.until,
								},
							});

							if (insightsResponse.data && insightsResponse.data.length > 0) {
								insights = insightsResponse.data[0];
							}
						} catch (error: any) {
							// Insights are optional, continue without them
							// If rate limit hit, stop making insights requests for remaining items
							if (error.code === 17 || error.message?.includes('request limit') || error.message?.includes('rate limit')) {
								console.warn(`Rate limit hit for ad ${ad.id}, skipping remaining insights`);
								rateLimitHit = true;
							}
						}

						// Add delay between requests to avoid rate limits (500ms delay)
						// Increase delay if we're getting close to rate limit
						const delay = rateLimitHit ? 1000 : 500;
						if (i < (response.data || []).length - 1) {
							await new Promise(resolve => setTimeout(resolve, delay));
						}
					}

					adsWithInsights.push({
						id: ad.id,
						name: ad.name || `Ad ${ad.id}`,
						status: mapAdStatus(ad.status || 'ACTIVE'),
						creative: ad.creative || null,
						created_time: ad.created_time || null,
						updated_time: ad.updated_time || null,
						insights: insights ? {
							reach: (insights.reach && insights.reach !== '') ? String(insights.reach) : null,
							impressions: (insights.impressions && insights.impressions !== '') ? String(insights.impressions) : null,
							clicks: (insights.clicks && insights.clicks !== '') ? String(insights.clicks) : null,
							link_clicks: (() => {
								if (insights.actions && Array.isArray(insights.actions)) {
									const linkClickAction = insights.actions.find(
										(action: any) => action.action_type === 'link_click' || action.action_type === 'inline_link_click'
									);
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
							// cost_per_result might be cost_per_action_type or need calculation
							cost_per_result: (() => {
								// Try direct field first
								if (insights.cost_per_result && insights.cost_per_result !== '') {
									return String(insights.cost_per_result);
								}
								// Try cost_per_action_type
								if (insights.cost_per_action_type && Array.isArray(insights.cost_per_action_type)) {
									const resultAction = insights.cost_per_action_type.find(
										(action: any) => action.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
											action.action_type === 'link_click' ||
											action.action_type === 'offsite_conversion.fb_pixel_purchase'
									);
									if (resultAction && resultAction.value) {
										return String(resultAction.value);
									}
									// If no specific action type, use first available
									if (insights.cost_per_action_type[0]?.value) {
										return String(insights.cost_per_action_type[0].value);
									}
								}
								return null;
							})(),
							actions: insights.actions || [],
						} : null,
					});
				}

				return {
					data: adsWithInsights,
					paging: response.paging,
				};
			} catch (error: any) {
				console.error('Meta Ads API list ads error:', error);

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
					message: error.message || 'Failed to fetch ads. Please try again.',
					cause: error,
				});
			}
		}),

	/**
	 * Get ad details
	 * GET /{ad-id}
	 */
	getAdDetails: protectedProcedure
		.input(
			z.object({
				adId: z.string().min(1, 'Ad ID is required'),
			})
		)
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
				const ad = await client.getAdDetails(input.adId, [
					'id',
					'name',
					'status',
					'creative',
					'created_time',
					'updated_time',
				]);

				return {
					data: {
						id: ad.id,
						name: ad.name || `Ad ${ad.id}`,
						status: mapAdStatus(ad.status || 'ACTIVE'),
						creative: ad.creative || null,
						created_time: ad.created_time || null,
						updated_time: ad.updated_time || null,
					},
				};
			} catch (error: any) {
				console.error('Meta Ads API get ad details error:', error);

				// Handle OAuth token errors - delete credentials and require re-authentication
				const oauthError = await handleMetaAdsOAuthError(error);
				if (oauthError) {
					throw oauthError;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error.message || 'Failed to fetch ad details. Please try again.',
					cause: error,
				});
			}
		}),
});

