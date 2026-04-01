import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { LinkedInAdsClient } from '../../lib/linkedin-ads-client';
import { getStoredLinkedInAccessTokenForUser } from '../../lib/linkedin-credentials';

/**
 * Get user's LinkedIn integration with valid tokens
 */
async function getUserIntegration(userId: string) {
	const tokenData = await getStoredLinkedInAccessTokenForUser(userId);

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

function normalizeStatusLabel(status: string | null | undefined): string | null {
	if (!status) return null;
	return status;
}

export const linkedInAdsCampaignsRouter = router({
	/**
	 * List campaigns (ad sets) for a campaign group
	 * Returns campaigns directly from LinkedIn API with optional insights
	 */
	listCampaigns: protectedProcedure
		.input(
			z.object({
				accountId: z.string().min(1, 'Account ID is required'),
				campaignGroupId: z.string().min(1, 'Campaign Group ID is required'),
				timeRange: z
					.object({
						since: z.string().optional(),
						until: z.string().optional(),
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

				const { accessToken } = await getUserIntegration(userId);

				// Create LinkedIn Ads client
				const client = new LinkedInAdsClient({ accessToken });

				// Ensure campaign group ID is in URN format
				let campaignGroupUrn = input.campaignGroupId;
				if (!campaignGroupUrn.startsWith('urn:li:sponsoredCampaignGroup:')) {
					// Extract numeric ID if it's just a number
					const numericId = campaignGroupUrn.replace(/[^0-9]/g, '');
					if (numericId) {
						campaignGroupUrn = `urn:li:sponsoredCampaignGroup:${numericId}`;
					}
				}

				// Add delay to avoid rate limits
				await new Promise((resolve) => setTimeout(resolve, 300));

				// Get campaigns directly from LinkedIn API
				const response = await client.getCampaigns(campaignGroupUrn, input.accountId);

				// Bulk-fetch insights for all campaigns in this campaign group.
				// This avoids one-request-per-campaign and gives better consistency.
				const insightsByCampaignId: Record<string, any> = {};
				let insightsDiagnostics: {
					requested: boolean;
					responseElements: number;
					mappedCampaigns: number;
					error: string | null;
				} = {
					requested: false,
					responseElements: 0,
					mappedCampaigns: 0,
					error: null,
				};

				if (input.timeRange?.since && input.timeRange?.until) {
					insightsDiagnostics.requested = true;
					try {
						const startDate = new Date(input.timeRange.since);
						const endDate = new Date(input.timeRange.until);
						const insightsResponse = await client.getAnalytics({
							dateRange: {
								start: formatDateForLinkedIn(startDate),
								end: formatDateForLinkedIn(endDate),
							},
							campaignGroups: [input.campaignGroupId],
							pivots: [{ pivot: 'CAMPAIGN' }],
							fields: [
								'impressions',
								'clicks',
								'costInLocalCurrency',
								'externalWebsiteConversions',
								'oneClickLeads',
								'videoViews',
								'videoCompletions',
								'pivotValues',
							],
						});

						insightsDiagnostics.responseElements = (insightsResponse.elements || []).length;

						for (const elem of insightsResponse.elements || []) {
							const pivot = Array.isArray((elem as any).pivotValues) ? (elem as any).pivotValues[0] : undefined;
							if (!pivot) continue;
							const campaignId = String(pivot).split(':').pop();
							if (!campaignId) continue;
							const acc = insightsByCampaignId[campaignId] || {
								impressions: 0,
								clicks: 0,
								costInLocalCurrency: 0,
								externalWebsiteConversions: 0,
								oneClickLeads: 0,
								videoViews: 0,
								videoCompletions: 0,
							};
							acc.impressions += Number((elem as any).impressions || 0);
							acc.clicks += Number((elem as any).clicks || 0);
							acc.costInLocalCurrency += Number((elem as any).costInLocalCurrency || 0);
							acc.externalWebsiteConversions += Number((elem as any).externalWebsiteConversions || 0);
							acc.oneClickLeads += Number((elem as any).oneClickLeads || 0);
							acc.videoViews += Number((elem as any).videoViews || 0);
							acc.videoCompletions += Number((elem as any).videoCompletions || 0);
							insightsByCampaignId[campaignId] = acc;
						}

						insightsDiagnostics.mappedCampaigns = Object.keys(insightsByCampaignId).length;
					} catch (error: any) {
						insightsDiagnostics.error = error?.message || 'Unknown analytics error';
					}
				}

				const campaignsWithInsights = [];
				for (let i = 0; i < (response.elements || []).length; i++) {
					const campaign = response.elements[i];
					let insights = null;
					const aggregated = insightsByCampaignId[String(campaign.id)];
					if (aggregated) {
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

					// Format budget values - LinkedIn returns in micro-currency (divide by 1000000)
					const formatBudget = (budget: number | string | null | undefined): string | null => {
						if (budget === null || budget === undefined) return null;
						const num = typeof budget === 'string' ? parseFloat(budget) : budget;
						if (isNaN(num)) return null;
						// LinkedIn returns budget in micro-currency (e.g., 100000000 = $100.00)
						return String(num / 1000000);
					};

					campaignsWithInsights.push({
						...campaign,
						id: campaign.id,
						name: campaign.name || null,
						status: normalizeStatusLabel(campaign.status || null),
						campaignGroup: campaign.campaignGroup || null,
						account: campaign.account || null,
						runSchedule: campaign.runSchedule || null,
						costType: campaign.costType || null,
						unitCost: campaign.unitCost ? formatBudget(campaign.unitCost) : null,
						dailyBudget: campaign.dailyBudget ? formatBudget(campaign.dailyBudget) : null,
						totalBudget: campaign.totalBudget ? formatBudget(campaign.totalBudget) : null,
						targetingCriteria: campaign.targetingCriteria || null,
						created: campaign.created || null,
						lastModified: campaign.lastModified || null,
						insights,
					});
				}

				return {
					success: true,
					data: campaignsWithInsights,
					meta: {
						retrieved_at: new Date().toISOString(),
						total_campaigns: campaignsWithInsights.length,
						paging: response.paging,
						insightsDiagnostics,
					},
				};
			} catch (error: any) {

				// Handle rate limit errors specifically
				if (error.status === 429 || error.message?.includes('rate limit')) {
					throw new TRPCError({
						code: 'TOO_MANY_REQUESTS',
						message: 'LinkedIn Ads API rate limit reached. Please wait a moment and try again.',
						cause: error,
					});
				}

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error.message || 'Failed to list campaigns. Please try again.',
					cause: error,
				});
			}
		}),

	/**
	 * Get campaign details
	 */
	getCampaignDetails: protectedProcedure
		.input(
			z.object({
				campaignGroupId: z.string().min(1, 'Campaign Group ID is required'),
				campaignId: z.string().min(1, 'Campaign ID is required'),
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

				const { accessToken } = await getUserIntegration(userId);

				// Create LinkedIn Ads client
				const client = new LinkedInAdsClient({ accessToken });

				// Get campaign details directly from LinkedIn API
				const campaignDetails = await client.getCampaignDetails(input.campaignId);

				// Format budget values
				const formatBudget = (budget: number | string | null | undefined): string | null => {
					if (budget === null || budget === undefined) return null;
					const num = typeof budget === 'string' ? parseFloat(budget) : budget;
					if (isNaN(num)) return null;
					return String(num / 1000000);
				};

				// Return campaign details
				return {
					success: true,
					data: {
						...campaignDetails,
						unitCost: campaignDetails.unitCost ? formatBudget(campaignDetails.unitCost) : null,
						dailyBudget: campaignDetails.dailyBudget ? formatBudget(campaignDetails.dailyBudget) : null,
						totalBudget: campaignDetails.totalBudget ? formatBudget(campaignDetails.totalBudget) : null,
					},
				};
			} catch (error) {

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

