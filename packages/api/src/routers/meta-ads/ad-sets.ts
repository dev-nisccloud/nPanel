import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { MetaAdsClient } from '../../lib/meta-ads-client';
import { getStoredMetaAccessToken } from '../../lib/meta-credentials';
import { handleMetaAdsOAuthError } from './error-handler';

/**
 * Map Meta API status to our status format
 */
function mapAdSetStatus(status: string): string {
	const statusUpper = status.toUpperCase();
	if (statusUpper === 'ACTIVE') return 'ACTIVE';
	if (statusUpper === 'PAUSED') return 'PAUSED';
	if (statusUpper === 'ARCHIVED') return 'ARCHIVED';
	if (statusUpper === 'DELETED') return 'DELETED';
	return statusUpper;
}

export const metaAdsAdSetsRouter = router({
	/**
	 * List ad sets for a campaign
	 * GET /{campaign-id}/adsets
	 */
	listAdSets: protectedProcedure
		.input(
			z.object({
				campaignId: z.string().min(1, 'Campaign ID is required'),
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
						'start_time',
						'stop_time',
						'created_time',
						'updated_time',
					],
				});

				// Fetch insights for each ad set if timeRange is provided
				// Process sequentially with delay to avoid rate limits
				const adSetsWithInsights = [];
				let rateLimitHit = false;
				
				for (let i = 0; i < (response.data || []).length; i++) {
					const adSet = response.data[i];
					let insights = null;
					
					// Skip insights if we've hit rate limit
					if (input.timeRange?.since && input.timeRange?.until && !rateLimitHit) {
						try {
							const insightsResponse = await client.getInsights(adSet.id, {
								level: 'adset',
									metrics: [
										'impressions',
										'clicks',
										'spend',
										'reach',
										'ctr',
										'cpc',
										'cpm',
										'cpp',
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
								console.warn(`Rate limit hit for ad set ${adSet.id}, skipping remaining insights`);
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

					// Format budget values - Meta API returns budgets in smallest currency unit (cents for USD)
					// Convert to currency units by dividing by 100
					const formatBudget = (budget: string | number | null | undefined): string | null => {
						if (budget === null || budget === undefined) return null;
						// Handle empty string
						if (budget === '') return null;
						const num = typeof budget === 'string' ? parseFloat(budget) : budget;
						if (isNaN(num)) return null;
						// Meta API returns budget in smallest currency unit (e.g., 10000 = $100.00)
						// Always divide by 100 to convert to currency units
						return String(num / 100);
					};

					adSetsWithInsights.push({
						id: adSet.id,
						name: adSet.name || `Ad Set ${adSet.id}`,
						status: mapAdSetStatus(adSet.status || 'ACTIVE'),
						daily_budget: formatBudget(adSet.daily_budget),
						lifetime_budget: formatBudget(adSet.lifetime_budget),
						budget_remaining: formatBudget(adSet.budget_remaining),
						bid_amount: adSet.bid_amount || null,
						targeting: adSet.targeting || null,
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
					data: adSetsWithInsights,
					paging: response.paging,
				};
			} catch (error: any) {
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
		.input(
			z.object({
				adSetId: z.string().min(1, 'Ad Set ID is required'),
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
				const adSet = await client.getAdSetDetails(input.adSetId, [
					'id',
					'name',
					'status',
					'daily_budget',
					'lifetime_budget',
					'budget_remaining',
					'bid_amount',
					'targeting',
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
						start_time: adSet.start_time || null,
						stop_time: adSet.stop_time || null,
						created_time: adSet.created_time || null,
						updated_time: adSet.updated_time || null,
					},
				};
			} catch (error: any) {
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
		.input(
			z.object({
				adSetId: z.string().min(1, 'Ad Set ID is required'),
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
				const result = await client.getTargetingSentenceLines(input.adSetId);

				return {
					data: result.targetingsentencelines || [],
				};
			} catch (error: any) {
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
});

