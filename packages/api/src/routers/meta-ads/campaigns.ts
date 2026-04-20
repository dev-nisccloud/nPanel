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


export const metaAdsCampaignsRouter = router({
	/**
	 * List campaigns for a specific ad account
	 * Returns campaigns directly from Meta API (no DB storage)
	 */
	listCampaigns: protectedProcedure
		.input(
			z.object({
				accountId: z.string().min(1, 'Account ID is required'),
				datePreset: z.string().optional(), // e.g., 'last_7d', 'last_30d', 'last_365d'
				timeRange: z.object({
					since: z.string(), // YYYY-MM-DD format
					until: z.string(), // YYYY-MM-DD format
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

				// Normalize account ID to ensure it has 'act_' prefix
				let normalizedAccountId = input.accountId;
				if (!normalizedAccountId.startsWith('act_')) {
					normalizedAccountId = `act_${normalizedAccountId}`;
				}

				// Get campaigns directly from Meta API
				const response = await client.getCampaigns(normalizedAccountId);

				// Fetch insights for all campaigns in bulk at the account level
				let campaignInsightsMap: Record<string, any> = {};
				try {
					let insightsOptions: {
						level: 'campaign';
						metrics: string[];
						datePreset?: string;
						timeRange?: { since: string; until: string };
						breakdowns?: string[];
					} = {
						level: 'campaign',
						metrics: [
							'campaign_id',
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

					if (input.timeRange) {
						insightsOptions.timeRange = input.timeRange;
					} else if (input.datePreset) {
						insightsOptions.datePreset = input.datePreset;
					} else {
						// Default to maximum (lifetime) if no range provided to ensure we get data for all campaigns
						insightsOptions.datePreset = 'maximum';
					}

					// When filtering by platform, add publisher_platform breakdown so the API
					// returns per-platform rows; we then filter to the requested platform below.
					if (input.publisherPlatform) {
						insightsOptions.breakdowns = ['publisher_platform'];
					}

					const insightsResponse = await client.getInsights(normalizedAccountId, insightsOptions);

					// Map insights by campaign_id
					// When a publisher_platform breakdown was requested, filter rows first so
					// each campaign only gets insight data for the chosen platform.
					if (insightsResponse.data && insightsResponse.data.length > 0) {
						const filteredRows = input.publisherPlatform
							? insightsResponse.data.filter(
									(row: any) => row.publisher_platform === input.publisherPlatform
								)
							: insightsResponse.data;

						filteredRows.forEach((insight: any) => {
							if (insight.campaign_id) {
								campaignInsightsMap[insight.campaign_id] = insight;
							}
						});
					}
				} catch (error) {
					console.error('Failed to fetch bulk insights for campaigns:', error);
					// Insights are optional, continue with empty map
				}

				const campaignsWithInsights = response.data.map((campaign: any) => {
					const insights = campaignInsightsMap[campaign.id] || null;

					// Format budget values
					const formatBudget = (budget: string | number | null | undefined): string | null => {
						if (budget === null || budget === undefined) return null;
						if (budget === '') return null;
						const num = typeof budget === 'string' ? parseFloat(budget) : budget;
						if (isNaN(num)) return null;
						return String(num / 100);
					};

					return {
						...campaign,
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
							actions: insights.actions || [],
						} : null,
						id: campaign.id,
						name: campaign.name,
						objective: campaign.objective,
						status: campaign.status,
						daily_budget: formatBudget(campaign.daily_budget),
						lifetime_budget: formatBudget(campaign.lifetime_budget),
						budget_remaining: formatBudget(campaign.budget_remaining),
						start_time: campaign.start_time,
						stop_time: campaign.stop_time,
						created_time: campaign.created_time,
						updated_time: campaign.updated_time,
					};
				});

				return {
					success: true,
					data: campaignsWithInsights,
					meta: {
						retrieved_at: new Date().toISOString(),
						total_campaigns: campaignsWithInsights.length,
						paging: response.paging,
					},
				};
			} catch (error) {
				console.error('Meta Ads API list campaigns error:', error);

				// Handle OAuth token errors - delete credentials and require re-authentication
				const oauthError = await handleMetaAdsOAuthError(error);
				if (oauthError) {
					throw oauthError;
				}

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error instanceof Error ? error.message : 'Failed to list campaigns',
				});
			}
		}),

	/**
	 * Get campaign details
	 */
	getCampaignDetails: protectedProcedure
		.input(
			z.object({
				accountId: z.string().min(1, 'Account ID is required'),
				campaignId: z.string().min(1, 'Campaign ID is required'),
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

				// Get campaign details directly from Meta API
				const campaignDetails = await client.getCampaignDetails(input.campaignId);

				let insights = null;
				try {
					// Determine time range for insights
					let insightsOptions: {
						level: 'campaign';
						metrics: string[];
						datePreset?: string;
						timeRange?: { since: string; until: string };
						breakdowns?: string[];
					} = {
						level: 'campaign',
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
					};

					// When filtering by platform, add publisher_platform breakdown
					if (input.publisherPlatform) {
						insightsOptions.breakdowns = ['publisher_platform'];
					}

					if (campaignDetails.start_time) {
						// If campaign has a start_time, use time range from start to now
						const startDate = new Date(campaignDetails.start_time);
						const endDate = new Date();
						const sinceStr = startDate.toISOString().split('T')[0];
						const untilStr = endDate.toISOString().split('T')[0];
						if (sinceStr && untilStr) {
							insightsOptions.timeRange = {
								since: sinceStr, // YYYY-MM-DD format
								until: untilStr,
							};
						}
					} else {
						// Fallback to maximum (lifetime) if no start_time
						insightsOptions.datePreset = 'maximum';
					}

					// Fetch insights for this campaign
					const insightsResponse = await client.getInsights(campaignDetails.id, insightsOptions);

					if (insightsResponse.data && insightsResponse.data.length > 0) {
						// When a publisher_platform breakdown was requested, find the row matching the platform.
						if (input.publisherPlatform) {
							insights = insightsResponse.data.find(
								(row: any) => row.publisher_platform === input.publisherPlatform
							) || null;
						} else {
							insights = insightsResponse.data[0]; // Get first (and usually only) insight record
						}
					}
				} catch (error) {
					// If insights fail, continue without them
					console.error('Failed to fetch insights for campaign details:', error);
				}

				// Format budget values
				const formatBudget = (budget: string | number | null | undefined): string | null => {
					if (budget === null || budget === undefined) return null;
					if (budget === '') return null;
					const num = typeof budget === 'string' ? parseFloat(budget) : budget;
					if (isNaN(num)) return null;
					return String(num / 100);
				};

				// Return campaign details exactly as returned from Meta API
				return {
					success: true,
					data: {
						// Include all fields from Meta API response
						...campaignDetails,
						daily_budget: formatBudget(campaignDetails.daily_budget),
						lifetime_budget: formatBudget(campaignDetails.lifetime_budget),
						budget_remaining: formatBudget(campaignDetails.budget_remaining),
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
							actions: insights.actions || [],
						} : null,
					},
				};
			} catch (error) {
				console.error('Meta Ads API get campaign details error:', error);

				// Handle OAuth token errors - delete credentials and require re-authentication
				const oauthError = await handleMetaAdsOAuthError(error);
				if (oauthError) {
					throw oauthError;
				}

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error instanceof Error ? error.message : 'Failed to get campaign details',
				});
			}
		}),
});

