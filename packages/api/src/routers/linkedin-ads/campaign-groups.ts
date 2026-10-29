import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { LinkedInAdsClient } from '../../lib/linkedin-ads-client';
import { getStoredLinkedInAccessToken, getStoredLinkedInAccessTokenForSession } from '../../lib/linkedin-credentials';

/**
 * Get user's LinkedIn integration with valid tokens
 */
async function getUserIntegration(userId: string, role?: string | null) {
	const tokenData =
		(await getStoredLinkedInAccessTokenForSession({ userId, role })) ??
		(await getStoredLinkedInAccessToken());

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

function normalizeStatusArray(statuses: unknown): string[] {
	if (!Array.isArray(statuses)) return [];
	return statuses
		.map((status) => (typeof status === 'string' ? status : null))
		.filter((status): status is string => Boolean(status));
}

function parseDateInput(value: string): Date {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (m) {
		const [, year, month, day] = m;
		return new Date(Number(year), Number(month) - 1, Number(day));
	}
	return new Date(value);
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

				const { accessToken } = await getUserIntegration(userId, ctx.session?.user?.role);

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

				const campaignGroups = response.elements || [];
				let insightsByCampaignGroupId: Record<string, any> = {};

				// Bulk insights query (docs-aligned adAnalytics finder) to avoid one-request-per-group
				if ((input.timeRange || input.datePreset) && campaignGroups.length > 0) {
					try {
						let startDate: Date;
						let endDate = new Date();

						if (input.timeRange) {
							startDate = parseDateInput(input.timeRange.since);
							endDate = parseDateInput(input.timeRange.until);
						} else if (input.datePreset) {
							const days = input.datePreset === 'last_7d' ? 7 : input.datePreset === 'last_30d' ? 30 : 365;
							startDate = new Date();
							startDate.setDate(startDate.getDate() - days);
						} else {
							startDate = new Date();
							startDate.setDate(startDate.getDate() - 30);
						}

						const insightsResponse = await client.getAnalytics({
							dateRange: {
								start: formatDateForLinkedIn(startDate),
								end: formatDateForLinkedIn(endDate),
							},
							accounts: [accountUrn],
							pivots: [{ pivot: 'CAMPAIGN_GROUP' }],
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

						for (const elem of insightsResponse.elements || []) {
							const pivot = Array.isArray((elem as any).pivotValues) ? (elem as any).pivotValues[0] : undefined;
							if (!pivot) continue;
							const groupId = String(pivot).split(':').pop();
							if (!groupId) continue;

							const acc = insightsByCampaignGroupId[groupId] || {
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
							insightsByCampaignGroupId[groupId] = acc;
						}
					} catch {
						// Keep list endpoint healthy even if insights fail
					}
				}

				const campaignGroupsWithInsights = campaignGroups.map((campaignGroup: any) => {
					const aggregated = insightsByCampaignGroupId[String(campaignGroup.id)];
					let insights = null;
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

					return {
						...campaignGroup,
						id: campaignGroup.id,
						name: campaignGroup.name || null,
						status: normalizeStatusLabel(campaignGroup.status || campaignGroup.campaignGroupStatus || null),
						servingStatuses: normalizeStatusArray(campaignGroup.servingStatuses),
						account: campaignGroup.account || null,
						runSchedule: campaignGroup.runSchedule || null,
						created: campaignGroup.created || null,
						lastModified: campaignGroup.lastModified || null,
						insights,
					};
				});

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

				const { accessToken } = await getUserIntegration(userId, ctx.session?.user?.role);

				// Create LinkedIn Ads client
				const client = new LinkedInAdsClient({ accessToken });

				// Get campaign group details directly from LinkedIn API
				const campaignGroupDetails = await client.getCampaignGroupDetails(
					input.campaignGroupId,
					input.accountId,
				);

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

