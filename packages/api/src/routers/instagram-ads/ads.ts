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

export const instagramAdsAdsRouter = router({
	/**
	 * List ads for an ad set using Instagram token
	 * GET /{ad-set-id}/ads
	 */
	listAds: protectedProcedure
		.input(
			z.object({
				adSetId: z.string().min(1, 'Ad Set ID is required'),
				datePreset: z.string().optional(),
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

				const tokenData = await getStoredInstagramAccessToken();
				if (!tokenData) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'No active Instagram integration found. Please connect your account first.',
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

				// Fetch insights for all ads in bulk at the ad set level
				let adInsightsMap: Record<string, any> = {};
				try {
					let insightsOptions: {
						level: 'ad';
						metrics: string[];
						datePreset?: string;
						timeRange?: { since: string; until: string };
					} = {
						level: 'ad',
						metrics: [
							'ad_id',
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
					};

					if (input.timeRange?.since && input.timeRange?.until) {
						insightsOptions.timeRange = {
							since: input.timeRange.since,
							until: input.timeRange.until,
						};
					} else if (input.datePreset) {
						insightsOptions.datePreset = input.datePreset;
					} else {
						// Default to maximum (lifetime) if no range provided
						insightsOptions.datePreset = 'maximum';
					}

					const insightsResponse = await client.getInsights(input.adSetId, insightsOptions);

					if (insightsResponse.data && insightsResponse.data.length > 0) {
						insightsResponse.data.forEach((insight: any) => {
							if (insight.ad_id) {
								adInsightsMap[insight.ad_id] = insight;
							}
						});
					}
				} catch (error) {
					console.error('Failed to fetch bulk insights for Instagram ads:', error);
				}

				const adsWithInsights = response.data.map((ad: any) => {
					const insights = adInsightsMap[ad.id] || null;

					return {
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
							cost_per_result: (() => {
								if (insights.cost_per_result && insights.cost_per_result !== '') {
									return String(insights.cost_per_result);
								}
								if (insights.cost_per_action_type && Array.isArray(insights.cost_per_action_type)) {
									const resultAction = insights.cost_per_action_type.find(
										(action: any) => action.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
											action.action_type === 'link_click' ||
											action.action_type === 'offsite_conversion.fb_pixel_purchase'
									);
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
									const leadAction = insights.actions.find(
										(action: any) => action.action_type === 'lead'
									);
									if (leadAction && leadAction.value) {
										return String(leadAction.value);
									}
								}
								return null;
							})(),
							cost_per_lead: (() => {
								if (insights.cost_per_action_type && Array.isArray(insights.cost_per_action_type)) {
									const leadCost = insights.cost_per_action_type.find(
										(action: any) => action.action_type === 'lead'
									);
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
					data: adsWithInsights,
					paging: response.paging,
				};
			} catch (error: any) {
				console.error('Instagram Ads API list ads error:', error);

				// Handle OAuth token errors
				const oauthError = await handleInstagramAdsOAuthError(error);
				if (oauthError) {
					throw oauthError;
				}

				// Handle rate limit errors
				if (error.code === 17 || error.message?.includes('request limit') || error.message?.includes('rate limit')) {
					throw new TRPCError({
						code: 'TOO_MANY_REQUESTS',
						message: 'Instagram Ads API rate limit reached. Please wait a moment and try again.',
						cause: error,
					});
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error.message || 'Failed to fetch Instagram ads. Please try again.',
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

				const tokenData = await getStoredInstagramAccessToken();
				if (!tokenData) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'No active Instagram integration found. Please connect your account first.',
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
				console.error('Instagram Ads API get ad details error:', error);

				// Handle OAuth token errors
				const oauthError = await handleInstagramAdsOAuthError(error);
				if (oauthError) {
					throw oauthError;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error.message || 'Failed to fetch Instagram ad details. Please try again.',
					cause: error,
				});
			}
		}),

	/**
	 * List all ads for a campaign in bulk (with insights) using Instagram token
	 */
	listCampaignAds: protectedProcedure
		.input(
			z.object({
				accountId: z.string().min(1, 'Account ID is required'),
				campaignId: z.string().min(1, 'Campaign ID is required'),
				datePreset: z.string().optional(),
				timeRange: z.object({
					since: z.string().optional(),
					until: z.string().optional(),
				}).optional(),
				/**
				 * When set, fetches insights with a publisher_platform breakdown and filters
				 * to rows matching this platform. Omit for aggregated totals (default behaviour).
				 */
				publisherPlatform: z.enum(['facebook', 'instagram', 'audience_network', 'messenger']).optional(),
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

				const { accessToken } = await getUserIntegration();

				// Create Meta Ads client
				const client = new MetaAdsClient({ accessToken });

				// 1. Fetch all ads specifically for this campaign
				const response = await client.getAds(input.campaignId, {
					fields: [
						'id',
						'name',
						'status',
						'effective_status',
						'adset_id',
						'created_time',
						'updated_time',
						'creative'
					],
					filtering: [
						{
							field: 'effective_status',
							operator: 'IN',
							value: ['ACTIVE', 'PAUSED', 'PENDING_REVIEW', 'DISAPPROVED', 'PREAPPROVED', 'PENDING_BILLING_INFO', 'CAMPAIGN_PAUSED', 'ADSET_PAUSED', 'IN_PROCESS', 'WITH_ISSUES', 'ARCHIVED']
						}
					],
					limit: 1000
				});

				// 2. Fetch insights for all ads in bulk at the campaign level
				let adInsightsMap: Record<string, any> = {};
				try {
					let insightsOptions: {
						level: 'ad';
						metrics: string[];
						datePreset?: string;
						timeRange?: { since: string; until: string };
						breakdowns?: string[];
					} = {
						level: 'ad',
						metrics: [
							'ad_id',
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
					};

					if (input.timeRange?.since && input.timeRange?.until) {
						insightsOptions.timeRange = {
							since: input.timeRange.since,
							until: input.timeRange.until,
						};
					} else if (input.datePreset) {
						insightsOptions.datePreset = input.datePreset;
					} else {
						// Default to maximum (lifetime) if no range provided
						insightsOptions.datePreset = 'maximum';
					}

					if (input.publisherPlatform) {
						insightsOptions.breakdowns = ['publisher_platform'];
					}

					const insightsResponse = await client.getInsights(input.campaignId, insightsOptions);

					if (insightsResponse.data && insightsResponse.data.length > 0) {
						const filteredRows = input.publisherPlatform
							? insightsResponse.data.filter(
									(row: any) => row.publisher_platform === input.publisherPlatform
								)
							: insightsResponse.data;

						filteredRows.forEach((insight: any) => {
							if (insight.ad_id) {
								adInsightsMap[insight.ad_id] = insight;
							}
						});
					}
				} catch (error) {
					console.error('Failed to fetch bulk insights for Instagram campaign ads:', error);
				}

				// 3. Map insights to ads
				const adsWithInsights = response.data.map((ad: any) => {
					const insights = ad.id ? adInsightsMap[ad.id] : null;

					return {
						id: ad.id,
						adset_id: ad.adset_id || (ad.adset && ad.adset.id) || null,
						name: ad.name || `Ad ${ad.id}`,
						status: mapAdStatus(ad.effective_status || ad.status || 'ACTIVE'),
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
							cost_per_result: (() => {
								if (insights.cost_per_result && insights.cost_per_result !== '') {
									return String(insights.cost_per_result);
								}
								if (insights.cost_per_action_type && Array.isArray(insights.cost_per_action_type)) {
									const resultAction = insights.cost_per_action_type.find(
										(action: any) => action.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
											action.action_type === 'link_click' ||
											action.action_type === 'offsite_conversion.fb_pixel_purchase'
									);
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
									const leadAction = insights.actions.find(
										(action: any) => action.action_type === 'lead'
									);
									if (leadAction && leadAction.value) {
										return String(leadAction.value);
									}
								}
								return null;
							})(),
							cost_per_lead: (() => {
								if (insights.cost_per_action_type && Array.isArray(insights.cost_per_action_type)) {
									const leadCost = insights.cost_per_action_type.find(
										(action: any) => action.action_type === 'lead'
									);
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
					data: adsWithInsights,
					paging: response.paging,
				};
			} catch (error) {
				console.error('Instagram Ads API list campaign ads error:', error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error instanceof Error ? error.message : 'Failed to list Instagram campaign ads',
				});
			}
		}),
});

