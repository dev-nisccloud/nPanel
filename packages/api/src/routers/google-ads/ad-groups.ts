import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import {
	createGoogleAdsClient,
	getCustomerInstance,
} from '../../lib/google-ads-client';
import {
	getGoogleAdsClientId,
	getGoogleAdsClientSecret,
	getGoogleAdsDeveloperToken,
} from '../../lib/google-ads-credentials';
import { GoogleAdsErrorHandler } from '../../lib/google-ads-error-handler';
import { getGoogleAdsExecutionContext } from './access';

/**
 * Format date for Google Ads API (YYYYMMDD format)
 */
function formatDateForGoogleAds(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}${month}${day}`;
}

export const googleAdsAdGroupsRouter = router({
	/**
	 * List ad groups for a specific campaign
	 * Uses GAQL to fetch ad groups with metrics
	 */
	listAdGroups: protectedProcedure
		.input(
			z.object({
				customerId: z.string().min(1, 'Customer ID is required'),
				campaignId: z.string().min(1, 'Campaign ID is required'),
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
				const { integration, customerIdWithoutDashes } = await getGoogleAdsExecutionContext(
					ctx,
					input.customerId,
				);

				// Create Google Ads client
				const client = createGoogleAdsClient({
					developerToken: getGoogleAdsDeveloperToken(),
					clientId: getGoogleAdsClientId(),
					clientSecret: getGoogleAdsClientSecret(),
					refreshToken: integration.refreshToken,
				});

				// Get customer instance
				const customer = getCustomerInstance(
					client,
					customerIdWithoutDashes,
					integration.refreshToken
				);

				// Build date range clause for metrics
				let dateRangeClause = '';
				if (input.timeRange) {
					const sinceDate = formatDateForGoogleAds(new Date(input.timeRange.since));
					const untilDate = formatDateForGoogleAds(new Date(input.timeRange.until));
					dateRangeClause = `AND segments.date BETWEEN '${sinceDate}' AND '${untilDate}'`;
				} else {
					// Default to last 30 days if no time range provided
					const untilDate = new Date();
					const sinceDate = new Date();
					sinceDate.setDate(sinceDate.getDate() - 30);
					const sinceFormatted = formatDateForGoogleAds(sinceDate);
					const untilFormatted = formatDateForGoogleAds(untilDate);
					dateRangeClause = `AND segments.date BETWEEN '${sinceFormatted}' AND '${untilFormatted}'`;
				}

				// Query ad groups with metrics using GAQL
				// Use campaign resource name format to filter by campaign
				// Format: customers/{customer_id}/campaigns/{campaign_id}
				const campaignResourceName = `customers/${customerIdWithoutDashes}/campaigns/${input.campaignId}`;
				
				const query = `
					SELECT
						ad_group.id,
						ad_group.name,
						ad_group.status,
						ad_group.type,
						ad_group.cpc_bid_micros,
						ad_group.cpm_bid_micros,
						ad_group.cpv_bid_micros,
						ad_group.target_cpa_micros,
						ad_group.target_cpm_micros,
						ad_group.target_roas,
						ad_group.campaign,
						metrics.impressions,
						metrics.clicks,
						metrics.interactions,
						metrics.interaction_rate,
						metrics.cost_micros,
						metrics.ctr,
						metrics.average_cpc,
						metrics.conversions,
						metrics.conversions_value,
						metrics.all_conversions,
						metrics.all_conversions_value,
						metrics.cost_per_conversion,
						segments.date
					FROM ad_group
					WHERE ad_group.campaign = '${campaignResourceName}'
						AND ad_group.status != 'REMOVED'
					${dateRangeClause}
					ORDER BY ad_group.id, segments.date DESC
				`;

				const results = await customer.query(query);

				// Group results by ad group ID and aggregate metrics
				const adGroupsMap = new Map<
					string,
					{
						id: string;
						name: string;
						status: string;
						type?: string;
						cpc_bid_micros?: string;
						cpm_bid_micros?: string;
						cpv_bid_micros?: string;
						target_cpa_micros?: string;
						target_cpm_micros?: string;
						target_roas?: number;
						metrics: {
							impressions: number;
							clicks: number;
							interactions?: number;
							interaction_rate?: number;
							cost_micros: number;
							ctr?: number;
							average_cpc_micros?: number;
							conversions?: number;
							conversions_value?: number;
							all_conversions?: number;
							all_conversions_value?: number;
							cost_per_conversion_micros?: number;
						};
					}
				>();

				// Process results and aggregate metrics
				for (const row of results) {
					const adGroupId = String(row.ad_group?.id || '');
					if (!adGroupId) continue;

					if (!adGroupsMap.has(adGroupId)) {
						adGroupsMap.set(adGroupId, {
							id: adGroupId,
							name: row.ad_group?.name || `Ad Group ${adGroupId}`,
							status: String(row.ad_group?.status || 'UNKNOWN'),
							type: row.ad_group?.type 
								? String(row.ad_group.type) 
								: undefined,
							cpc_bid_micros: row.ad_group?.cpc_bid_micros
								? String(row.ad_group.cpc_bid_micros)
								: undefined,
							cpm_bid_micros: row.ad_group?.cpm_bid_micros
								? String(row.ad_group.cpm_bid_micros)
								: undefined,
							cpv_bid_micros: row.ad_group?.cpv_bid_micros
								? String(row.ad_group.cpv_bid_micros)
								: undefined,
							target_cpa_micros: row.ad_group?.target_cpa_micros
								? String(row.ad_group.target_cpa_micros)
								: undefined,
							target_cpm_micros: row.ad_group?.target_cpm_micros
								? String(row.ad_group.target_cpm_micros)
								: undefined,
							target_roas: row.ad_group?.target_roas
								? Number(row.ad_group.target_roas)
								: undefined,
							metrics: {
								impressions: 0,
								clicks: 0,
								interactions: 0,
								interaction_rate: 0,
								cost_micros: 0,
								ctr: 0,
								average_cpc_micros: 0,
								conversions: 0,
								conversions_value: 0,
								all_conversions: 0,
								all_conversions_value: 0,
								cost_per_conversion_micros: 0,
							},
						});
					}

					const adGroup = adGroupsMap.get(adGroupId)!;

					// Aggregate metrics (sum across all dates)
					if (row.metrics) {
						adGroup.metrics.impressions += Number(row.metrics.impressions || 0);
						adGroup.metrics.clicks += Number(row.metrics.clicks || 0);
						adGroup.metrics.interactions = (adGroup.metrics.interactions || 0) + Number(row.metrics.interactions || 0);
						// rate fields can't be summed; we'll compute from totals or keep latest non-zero
						if (row.metrics.interaction_rate !== undefined && Number(row.metrics.interaction_rate || 0) > 0) {
							adGroup.metrics.interaction_rate = Number(row.metrics.interaction_rate || 0);
						}
						adGroup.metrics.cost_micros += Number(row.metrics.cost_micros || 0);
						if (row.metrics.conversions !== undefined && row.metrics.conversions !== null) {
							// Ensure conversions is initialized
							if (adGroup.metrics.conversions === undefined) {
								adGroup.metrics.conversions = 0;
							}
							adGroup.metrics.conversions += Number(row.metrics.conversions || 0);
						}
						if (row.metrics.conversions_value !== undefined && row.metrics.conversions_value !== null) {
							adGroup.metrics.conversions_value = (adGroup.metrics.conversions_value || 0) + Number(row.metrics.conversions_value || 0);
						}
						if (row.metrics.all_conversions !== undefined && row.metrics.all_conversions !== null) {
							adGroup.metrics.all_conversions = (adGroup.metrics.all_conversions || 0) + Number(row.metrics.all_conversions || 0);
						}
						if (row.metrics.all_conversions_value !== undefined && row.metrics.all_conversions_value !== null) {
							adGroup.metrics.all_conversions_value = (adGroup.metrics.all_conversions_value || 0) + Number(row.metrics.all_conversions_value || 0);
						}
						if (row.metrics.average_cpc !== undefined && Number(row.metrics.average_cpc || 0) > 0) {
							adGroup.metrics.average_cpc_micros = Number(row.metrics.average_cpc || 0);
						}
						if (row.metrics.cost_per_conversion !== undefined && Number(row.metrics.cost_per_conversion || 0) > 0) {
							adGroup.metrics.cost_per_conversion_micros = Number(
								row.metrics.cost_per_conversion || 0
							);
						}
					}
				}

				// Convert to array and format for response
				const adGroups = Array.from(adGroupsMap.values()).map((adGroup) => {
					// Convert micros to currency units (divide by 1,000,000)
					const cost = adGroup.metrics.cost_micros / 1000000;
					const averageCpc = adGroup.metrics.average_cpc_micros
						? adGroup.metrics.average_cpc_micros / 1000000
						: adGroup.metrics.clicks > 0
							? cost / adGroup.metrics.clicks
							: 0;
					const costPerConversion = adGroup.metrics.cost_per_conversion_micros
						? adGroup.metrics.cost_per_conversion_micros / 1000000
						: adGroup.metrics.conversions && adGroup.metrics.conversions > 0
							? cost / adGroup.metrics.conversions
							: 0;
					const cpcBid = adGroup.cpc_bid_micros
						? Number(adGroup.cpc_bid_micros) / 1000000
						: null;
					const cpmBid = adGroup.cpm_bid_micros
						? Number(adGroup.cpm_bid_micros) / 1000000
						: null;
					const targetCpa = adGroup.target_cpa_micros
						? Number(adGroup.target_cpa_micros) / 1000000
						: null;

					// Calculate CTR from aggregated totals
					const ctr = adGroup.metrics.impressions > 0
						? (adGroup.metrics.clicks / adGroup.metrics.impressions) * 100
						: 0;
					const interactionRate = adGroup.metrics.impressions > 0
						? ((adGroup.metrics.interactions || 0) / adGroup.metrics.impressions) * 100
						: 0;

					return {
						id: adGroup.id,
						name: adGroup.name,
						status: adGroup.status,
						type: adGroup.type,
						cpc_bid: cpcBid,
						cpm_bid: cpmBid,
						target_cpa: targetCpa,
						target_roas: adGroup.target_roas,
						insights: {
							impressions: adGroup.metrics.impressions > 0 ? String(adGroup.metrics.impressions) : null,
							clicks: adGroup.metrics.clicks > 0 ? String(adGroup.metrics.clicks) : null,
							interactions: (adGroup.metrics.interactions || 0) > 0 ? String(adGroup.metrics.interactions) : null,
							cost: cost > 0 ? String(cost.toFixed(2)) : null,
							ctr: ctr > 0 ? String(ctr.toFixed(2)) : null,
							interaction_rate: interactionRate > 0 ? String(interactionRate.toFixed(2)) : null,
							cpc: averageCpc > 0 ? String(averageCpc.toFixed(2)) : null,
							conversions: adGroup.metrics.conversions && adGroup.metrics.conversions > 0
								? String(adGroup.metrics.conversions)
								: null,
							conversions_value: (adGroup.metrics.conversions_value || 0) > 0
								? String((adGroup.metrics.conversions_value || 0).toFixed(2))
								: null,
							all_conversions: (adGroup.metrics.all_conversions || 0) > 0 ? String(adGroup.metrics.all_conversions) : null,
							all_conversions_value: (adGroup.metrics.all_conversions_value || 0) > 0
								? String((adGroup.metrics.all_conversions_value || 0).toFixed(2))
								: null,
							cost_per_conversion: costPerConversion > 0 ? String(costPerConversion.toFixed(2)) : null,
						},
					};
				});

				return {
					success: true,
					data: adGroups,
					meta: {
						retrieved_at: new Date().toISOString(),
						total_ad_groups: adGroups.length,
					},
				};
			} catch (error) {
				console.error('Google Ads API list ad groups error:', error);

				if (error instanceof TRPCError) {
					throw error;
				}

				const errorInfo = GoogleAdsErrorHandler.handleError(error);
				throw new TRPCError({
					code:
						errorInfo.type === 'refresh-token' || errorInfo.type === 'permission'
							? 'UNAUTHORIZED'
							: 'INTERNAL_SERVER_ERROR',
					message: errorInfo.message || (error instanceof Error ? error.message : 'Failed to list ad groups'),
				});
			}
		}),
});

