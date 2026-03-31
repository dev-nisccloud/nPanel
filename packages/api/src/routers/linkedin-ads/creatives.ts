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
	return status.replace(/_/g, ' ');
}

export const linkedInAdsCreativesRouter = router({
	/**
	 * List creatives (ads) for a campaign
	 * Returns creatives directly from LinkedIn API with optional insights
	 */
	listCreatives: protectedProcedure
		.input(
			z.object({
				accountId: z.string().min(1, 'Account ID is required'),
				campaignId: z.string().min(1, 'Campaign ID is required'),
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

				// Ensure campaign ID is in URN format
				let campaignUrn = input.campaignId;
				if (!campaignUrn.startsWith('urn:li:sponsoredCampaign:')) {
					// Extract numeric ID if it's just a number
					const numericId = campaignUrn.replace(/[^0-9]/g, '');
					if (numericId) {
						campaignUrn = `urn:li:sponsoredCampaign:${numericId}`;
					}
				}

				// Add delay to avoid rate limits
				await new Promise((resolve) => setTimeout(resolve, 300));

				// Get creatives directly from LinkedIn API
				const response = await client.getCreatives(campaignUrn, input.accountId);

				// Fetch insights for each creative if time range is provided
				const creativesWithInsights = [];
				let rateLimitHit = false;

				for (let i = 0; i < (response.elements || []).length; i++) {
					const creative = response.elements[i];
					let insights = null;

					// Skip insights if we've hit rate limit
					if (input.timeRange?.since && input.timeRange?.until && !rateLimitHit) {
						try {
							const startDate = new Date(input.timeRange.since);
							const endDate = new Date(input.timeRange.until);

							// Fetch insights for this creative
							const insightsResponse = await client.getAnalytics({
								dateRange: {
									start: formatDateForLinkedIn(startDate),
									end: formatDateForLinkedIn(endDate),
								},
								creatives: [creative.id],
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
							} catch (error: any) {
							// Insights are optional, continue without them
							// If rate limit hit, stop making insights requests for remaining items
							if (error.status === 429 || error.message?.includes('rate limit')) {
								rateLimitHit = true;
							}
						}

						// Add delay between requests to avoid rate limits
						const delay = rateLimitHit ? 1000 : 500;
						if (i < (response.elements || []).length - 1) {
							await new Promise((resolve) => setTimeout(resolve, delay));
						}
					}

					creativesWithInsights.push({
						...creative,
						id: creative.id,
						name: creative.name || null,
						status: normalizeStatusLabel(creative.status || null),
						campaign: creative.campaign || null,
						type: creative.type || null,
						variables: creative.variables || null,
						created: creative.created || null,
						lastModified: creative.lastModified || null,
						changeAuditStamps: creative.changeAuditStamps || null,
						insights,
					});
				}

				return {
					success: true,
					data: creativesWithInsights,
					meta: {
						retrieved_at: new Date().toISOString(),
						total_creatives: creativesWithInsights.length,
						paging: response.paging,
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
					message: error.message || 'Failed to list creatives. Please try again.',
					cause: error,
				});
			}
		}),

	/**
	 * Get creative details
	 */
	getCreativeDetails: protectedProcedure
		.input(
			z.object({
				campaignId: z.string().min(1, 'Campaign ID is required'),
				creativeId: z.string().min(1, 'Creative ID is required'),
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

				// Get creative details directly from LinkedIn API
				const creativeDetails = await client.getCreativeDetails(input.creativeId);

				// Return creative details
				return {
					success: true,
					data: {
						// Include all fields from LinkedIn API response
						...creativeDetails,
					},
				};
			} catch (error) {

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error instanceof Error ? error.message : 'Failed to get creative details',
				});
			}
		}),
});

