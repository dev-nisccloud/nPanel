import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { LinkedInAdsClient } from '../../lib/linkedin-ads-client';
import { getStoredLinkedInAccessToken } from '../../lib/linkedin-credentials';

/**
 * Get user's LinkedIn integration with valid tokens
 */
async function getUserIntegration() {
	const tokenData = await getStoredLinkedInAccessToken();

	if (!tokenData) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'No active LinkedIn integration found. Please connect your account first.',
		});
	}

	return tokenData;
}

/**
 * Format date to LinkedIn Analytics date format
 */
function formatDateForLinkedIn(date: Date): { year: number; month: number; day: number } {
	return {
		year: date.getFullYear(),
		month: date.getMonth() + 1, // LinkedIn uses 1-based months
		day: date.getDate(),
	};
}

export const linkedInAdsCampaignGroupsRouter = router({
	/**
	 * List campaign groups for a specific ad account
	 * Returns campaign groups directly from LinkedIn API with optional insights
	 */
	listCampaignGroups: protectedProcedure
		.input(
			z.object({
				accountId: z.string().min(1, 'Account ID is required'),
				datePreset: z.string().optional(), // e.g., 'last_7d', 'last_30d', 'last_365d'
				timeRange: z
					.object({
						since: z.string(), // YYYY-MM-DD format
						until: z.string(), // YYYY-MM-DD format
					})
					.optional(),
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

				// Create LinkedIn Ads client
				const client = new LinkedInAdsClient({ accessToken });

				// Ensure account ID is in URN format
				let accountUrn = input.accountId;
				if (!accountUrn.startsWith('urn:li:sponsoredAccount:')) {
					// Extract numeric ID if it's just a number
					const numericId = accountUrn.replace(/[^0-9]/g, '');
					if (numericId) {
						accountUrn = `urn:li:sponsoredAccount:${numericId}`;
					}
				}

				// Get campaign groups directly from LinkedIn API
				const response = await client.getCampaignGroups(accountUrn);

				// Fetch insights for each campaign group if time range is provided
				const campaignGroupsWithInsights = await Promise.all(
					(response.elements || []).map(async (campaignGroup: any) => {
						let insights = null;

						// Determine date range for insights
						if (input.timeRange || input.datePreset) {
							try {
								let startDate: Date;
								let endDate = new Date();

								if (input.timeRange) {
									startDate = new Date(input.timeRange.since);
									endDate = new Date(input.timeRange.until);
								} else if (input.datePreset) {
									// Calculate date range from preset
									const days = input.datePreset === 'last_7d' ? 7 : input.datePreset === 'last_30d' ? 30 : 365;
									startDate = new Date();
									startDate.setDate(startDate.getDate() - days);
								} else {
									// Default to last 30 days
									startDate = new Date();
									startDate.setDate(startDate.getDate() - 30);
								}

								// Fetch insights for this campaign group
								const insightsResponse = await client.getAnalytics({
									dateRange: {
										start: formatDateForLinkedIn(startDate),
										end: formatDateForLinkedIn(endDate),
									},
									campaignGroups: [campaignGroup.id],
									fields: [
										'impressions',
										'clicks',
										'costInLocalCurrency',
										'externalWebsiteConversions',
										'oneClickLeads',
										'videoViews',
										'videoCompletions',
									],
								});

								if (insightsResponse.elements && insightsResponse.elements.length > 0) {
									// Aggregate insights across all elements
									const aggregated = insightsResponse.elements.reduce(
										(acc: any, elem: any) => {
											acc.impressions = (acc.impressions || 0) + (elem.impressions || 0);
											acc.clicks = (acc.clicks || 0) + (elem.clicks || 0);
											acc.costInLocalCurrency = (acc.costInLocalCurrency || 0) + (elem.costInLocalCurrency || 0);
											acc.externalWebsiteConversions = (acc.externalWebsiteConversions || 0) + (elem.externalWebsiteConversions || 0);
											acc.oneClickLeads = (acc.oneClickLeads || 0) + (elem.oneClickLeads || 0);
											acc.videoViews = (acc.videoViews || 0) + (elem.videoViews || 0);
											acc.videoCompletions = (acc.videoCompletions || 0) + (elem.videoCompletions || 0);
											return acc;
										},
										{}
									);

									// Calculate derived metrics
									const cpc = aggregated.clicks > 0 ? aggregated.costInLocalCurrency / aggregated.clicks : null;
									const ctr = aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions) * 100 : null;

									insights = {
										impressions: aggregated.impressions || null,
										clicks: aggregated.clicks || null,
										spend: aggregated.costInLocalCurrency || null,
										externalWebsiteConversions: aggregated.externalWebsiteConversions || null,
										oneClickLeads: aggregated.oneClickLeads || null,
										videoViews: aggregated.videoViews || null,
										videoCompletions: aggregated.videoCompletions || null,
										cpc: cpc ? String(cpc) : null,
										ctr: ctr ? String(ctr) : null,
									};
								}
							} catch (error) {
								// If insights fail, continue without them
							}
						}

						return {
							id: campaignGroup.id,
							name: campaignGroup.name || null,
							status: campaignGroup.status || campaignGroup.campaignGroupStatus || null,
							account: campaignGroup.account || null,
							runSchedule: campaignGroup.runSchedule || null,
							created: campaignGroup.created || null,
							lastModified: campaignGroup.lastModified || null,
							insights,
							// Include any other fields returned by LinkedIn API
							...campaignGroup,
						};
					})
				);

				return {
					success: true,
					data: campaignGroupsWithInsights,
					meta: {
						retrieved_at: new Date().toISOString(),
						total_campaign_groups: campaignGroupsWithInsights.length,
						paging: response.paging,
					},
				};
			} catch (error) {

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error instanceof Error ? error.message : 'Failed to list campaign groups',
				});
			}
		}),

	/**
	 * Get campaign group details
	 */
	getCampaignGroupDetails: protectedProcedure
		.input(
			z.object({
				accountId: z.string().min(1, 'Account ID is required'),
				campaignGroupId: z.string().min(1, 'Campaign Group ID is required'),
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

				// Create LinkedIn Ads client
				const client = new LinkedInAdsClient({ accessToken });

				// Get campaign group details directly from LinkedIn API
				const campaignGroupDetails = await client.getCampaignGroupDetails(input.campaignGroupId);

				// Return campaign group details
				return {
					success: true,
					data: {
						// Include all fields from LinkedIn API response
						...campaignGroupDetails,
					},
				};
			} catch (error) {

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error instanceof Error ? error.message : 'Failed to get campaign group details',
				});
			}
		}),
});

