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

export const googleAdsAdsRouter = router({
	/**
	 * List ads for a specific ad group
	 * Uses GAQL to fetch ads with metrics
	 */
	listAds: protectedProcedure
		.input(
			z.object({
				customerId: z.string().min(1, 'Customer ID is required'),
				adGroupId: z.string().min(1, 'Ad Group ID is required'),
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

				// Query ads with metrics using GAQL
				// Note: ad_group_ad is the resource for ads
				// Use ad group resource name format to filter by ad group
				// Format: customers/{customer_id}/adGroups/{ad_group_id}
				const adGroupResourceName = `customers/${customerIdWithoutDashes}/adGroups/${input.adGroupId}`;
				
				const query = `
					SELECT
						ad_group_ad.ad.id,
						ad_group_ad.ad.type,
						ad_group_ad.status,
						ad_group_ad.ad.responsive_search_ad.headlines,
						ad_group_ad.ad.responsive_search_ad.descriptions,
						ad_group_ad.ad.expanded_text_ad.headline_part1,
						ad_group_ad.ad.expanded_text_ad.headline_part2,
						ad_group_ad.ad.expanded_text_ad.headline_part3,
						ad_group_ad.ad.expanded_text_ad.description,
						ad_group_ad.ad.expanded_text_ad.description2,
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
					FROM ad_group_ad
					WHERE ad_group_ad.ad_group = '${adGroupResourceName}'
						AND ad_group_ad.status != 'REMOVED'
					${dateRangeClause}
					ORDER BY ad_group_ad.ad.id, segments.date DESC
				`;

				const results = await customer.query(query);

				// Group results by ad ID and aggregate metrics
				const adsMap = new Map<
					string,
					{
						id: string;
						type?: string;
						status: string;
						headlines?: string[];
						descriptions?: string[];
						headline_part1?: string;
						headline_part2?: string;
						headline_part3?: string;
						description?: string;
						description2?: string;
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
					const adId = String(row.ad_group_ad?.ad?.id || '');
					if (!adId) continue;

					if (!adsMap.has(adId)) {
						const ad = row.ad_group_ad?.ad;
						const responsiveAd = ad?.responsive_search_ad;
						const expandedAd = ad?.expanded_text_ad;

						// Extract headlines and descriptions based on ad type
						let headlines: string[] = [];
						let descriptions: string[] = [];

						if (responsiveAd) {
							// Responsive Search Ad
							if (responsiveAd.headlines && Array.isArray(responsiveAd.headlines)) {
								headlines = responsiveAd.headlines
									.map((h: any) => h?.text)
									.filter((text: string) => text);
							}
							if (responsiveAd.descriptions && Array.isArray(responsiveAd.descriptions)) {
								descriptions = responsiveAd.descriptions
									.map((d: any) => d?.text)
									.filter((text: string) => text);
							}
						}

						adsMap.set(adId, {
							id: adId,
							type: ad?.type 
								? String(ad.type) 
								: undefined,
							status: String(row.ad_group_ad?.status || 'UNKNOWN'),
							headlines: headlines.length > 0 ? headlines : undefined,
							descriptions: descriptions.length > 0 ? descriptions : undefined,
							headline_part1: expandedAd?.headline_part1 ?? undefined,
							headline_part2: expandedAd?.headline_part2 ?? undefined,
							headline_part3: expandedAd?.headline_part3 ?? undefined,
							description: expandedAd?.description ?? undefined,
							description2: expandedAd?.description2 ?? undefined,
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

					const ad = adsMap.get(adId)!;

					// Aggregate metrics (sum across all dates)
					if (row.metrics) {
						ad.metrics.impressions += Number(row.metrics.impressions || 0);
						ad.metrics.clicks += Number(row.metrics.clicks || 0);
						ad.metrics.interactions = (ad.metrics.interactions || 0) + Number(row.metrics.interactions || 0);
						if (row.metrics.interaction_rate !== undefined && Number(row.metrics.interaction_rate || 0) > 0) {
							ad.metrics.interaction_rate = Number(row.metrics.interaction_rate || 0);
						}
						ad.metrics.cost_micros += Number(row.metrics.cost_micros || 0);
						if (row.metrics.conversions !== undefined && row.metrics.conversions !== null) {
							// Ensure conversions is initialized
							if (ad.metrics.conversions === undefined) {
								ad.metrics.conversions = 0;
							}
							ad.metrics.conversions += Number(row.metrics.conversions || 0);
						}
						if (row.metrics.conversions_value !== undefined && row.metrics.conversions_value !== null) {
							ad.metrics.conversions_value = (ad.metrics.conversions_value || 0) + Number(row.metrics.conversions_value || 0);
						}
						if (row.metrics.all_conversions !== undefined && row.metrics.all_conversions !== null) {
							ad.metrics.all_conversions = (ad.metrics.all_conversions || 0) + Number(row.metrics.all_conversions || 0);
						}
						if (row.metrics.all_conversions_value !== undefined && row.metrics.all_conversions_value !== null) {
							ad.metrics.all_conversions_value = (ad.metrics.all_conversions_value || 0) + Number(row.metrics.all_conversions_value || 0);
						}
						if (row.metrics.average_cpc !== undefined && Number(row.metrics.average_cpc || 0) > 0) {
							ad.metrics.average_cpc_micros = Number(row.metrics.average_cpc || 0);
						}
						if (row.metrics.cost_per_conversion !== undefined && Number(row.metrics.cost_per_conversion || 0) > 0) {
							ad.metrics.cost_per_conversion_micros = Number(
								row.metrics.cost_per_conversion || 0
							);
						}
					}
				}

				// Convert to array and format for response
				const ads = Array.from(adsMap.values()).map((ad) => {
					// Convert micros to currency units (divide by 1,000,000)
					const cost = ad.metrics.cost_micros / 1000000;
					const averageCpc = ad.metrics.average_cpc_micros
						? ad.metrics.average_cpc_micros / 1000000
						: ad.metrics.clicks > 0
							? cost / ad.metrics.clicks
							: 0;
					const costPerConversion = ad.metrics.cost_per_conversion_micros
						? ad.metrics.cost_per_conversion_micros / 1000000
						: ad.metrics.conversions && ad.metrics.conversions > 0
							? cost / ad.metrics.conversions
							: 0;

					// Calculate CTR from aggregated totals
					const ctr = ad.metrics.impressions > 0
						? (ad.metrics.clicks / ad.metrics.impressions) * 100
						: 0;
					const interactionRate = ad.metrics.impressions > 0
						? ((ad.metrics.interactions || 0) / ad.metrics.impressions) * 100
						: 0;

					// Generate ad name from headlines or parts
					let adName = `Ad ${ad.id}`;
					if (ad.headlines && ad.headlines.length > 0) {
						adName = ad.headlines[0] ?? adName;
					} else if (ad.headline_part1) {
						adName = ad.headline_part1;
					}

					return {
						id: ad.id,
						name: adName,
						type: ad.type,
						status: ad.status,
						headlines: ad.headlines,
						descriptions: ad.descriptions,
						headline_part1: ad.headline_part1,
						headline_part2: ad.headline_part2,
						headline_part3: ad.headline_part3,
						description: ad.description,
						description2: ad.description2,
						insights: {
							impressions: ad.metrics.impressions > 0 ? String(ad.metrics.impressions) : null,
							clicks: ad.metrics.clicks > 0 ? String(ad.metrics.clicks) : null,
							interactions: (ad.metrics.interactions || 0) > 0 ? String(ad.metrics.interactions) : null,
							cost: cost > 0 ? String(cost.toFixed(2)) : null,
							ctr: ctr > 0 ? String(ctr.toFixed(2)) : null,
							interaction_rate: interactionRate > 0 ? String(interactionRate.toFixed(2)) : null,
							cpc: averageCpc > 0 ? String(averageCpc.toFixed(2)) : null,
							conversions: ad.metrics.conversions && ad.metrics.conversions > 0
								? String(ad.metrics.conversions)
								: null,
							conversions_value: (ad.metrics.conversions_value || 0) > 0
								? String((ad.metrics.conversions_value || 0).toFixed(2))
								: null,
							all_conversions: (ad.metrics.all_conversions || 0) > 0 ? String(ad.metrics.all_conversions) : null,
							all_conversions_value: (ad.metrics.all_conversions_value || 0) > 0
								? String((ad.metrics.all_conversions_value || 0).toFixed(2))
								: null,
							cost_per_conversion: costPerConversion > 0 ? String(costPerConversion.toFixed(2)) : null,
						},
					};
				});

				return {
					success: true,
					data: ads,
					meta: {
						retrieved_at: new Date().toISOString(),
						total_ads: ads.length,
					},
				};
			} catch (error) {
				console.error('Google Ads API list ads error:', error);

				if (error instanceof TRPCError) {
					throw error;
				}

				const errorInfo = GoogleAdsErrorHandler.handleError(error);
				throw new TRPCError({
					code:
						errorInfo.type === 'refresh-token' || errorInfo.type === 'permission'
							? 'UNAUTHORIZED'
							: 'INTERNAL_SERVER_ERROR',
					message: errorInfo.message || (error instanceof Error ? error.message : 'Failed to list ads'),
				});
			}
		}),

	/**
	 * Bulk list ads for multiple ad groups (for report export)
	 * Uses a single GAQL query per chunk of ad groups, then aggregates by ad group + ad.
	 */
	listAdsBulk: protectedProcedure
		.input(
			z.object({
				customerId: z.string().min(1, 'Customer ID is required'),
				adGroupIds: z.array(z.string().min(1)).min(1, 'At least one ad group is required'),
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

				const client = createGoogleAdsClient({
					developerToken: getGoogleAdsDeveloperToken(),
					clientId: getGoogleAdsClientId(),
					clientSecret: getGoogleAdsClientSecret(),
					refreshToken: integration.refreshToken,
				});

				const customer = getCustomerInstance(
					client,
					customerIdWithoutDashes,
					integration.refreshToken
				);

				let dateRangeClause = '';
				if (input.timeRange) {
					const sinceDate = formatDateForGoogleAds(new Date(input.timeRange.since));
					const untilDate = formatDateForGoogleAds(new Date(input.timeRange.until));
					dateRangeClause = `AND segments.date BETWEEN '${sinceDate}' AND '${untilDate}'`;
				} else {
					const untilDate = new Date();
					const sinceDate = new Date();
					sinceDate.setDate(sinceDate.getDate() - 30);
					const sinceFormatted = formatDateForGoogleAds(sinceDate);
					const untilFormatted = formatDateForGoogleAds(untilDate);
					dateRangeClause = `AND segments.date BETWEEN '${sinceFormatted}' AND '${untilFormatted}'`;
				}

				const cleanIds = Array.from(
					new Set(
						(input.adGroupIds || [])
							.map((id) => String(id).trim())
							.filter(Boolean)
					)
				);

				const chunk = <T,>(arr: T[], size: number): T[][] => {
					const out: T[][] = [];
					for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
					return out;
				};

				const adsByAdGroupId = new Map<string, any[]>();

				for (const idsChunk of chunk(cleanIds, 100)) {
					const idsCsv = idsChunk
						.map((x) => Number(String(x)))
						.filter((n) => Number.isFinite(n))
						.join(', ');

					if (!idsCsv) continue;

					const query = `
						SELECT
							ad_group.id,
							ad_group_ad.ad.id,
							ad_group_ad.ad.type,
							ad_group_ad.status,
							ad_group_ad.ad.responsive_search_ad.headlines,
							ad_group_ad.ad.responsive_search_ad.descriptions,
							ad_group_ad.ad.expanded_text_ad.headline_part1,
							ad_group_ad.ad.expanded_text_ad.headline_part2,
							ad_group_ad.ad.expanded_text_ad.headline_part3,
							ad_group_ad.ad.expanded_text_ad.description,
							ad_group_ad.ad.expanded_text_ad.description2,
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
						FROM ad_group_ad
						WHERE ad_group.id IN (${idsCsv})
							AND ad_group_ad.status != 'REMOVED'
						${dateRangeClause}
						ORDER BY ad_group.id, ad_group_ad.ad.id, segments.date DESC
					`;

					const results = await customer.query(query);

					// adGroupId -> adId -> aggregate
					const map = new Map<
						string,
						Map<
							string,
							{
								id: string;
								type?: string;
								status: string;
								headlines?: string[];
								descriptions?: string[];
								headline_part1?: string;
								headline_part2?: string;
								headline_part3?: string;
								description?: string;
								description2?: string;
								metrics: {
									impressions: number;
									clicks: number;
									interactions?: number;
									interaction_rate?: number;
									cost_micros: number;
									average_cpc_micros?: number;
									conversions?: number;
									conversions_value?: number;
								};
							}
						>
					>();

					for (const row of results as any[]) {
						const adGroupId = String(row.ad_group?.id || '');
						const adId = String(row.ad_group_ad?.ad?.id || '');
						if (!adGroupId || !adId) continue;

						if (!map.has(adGroupId)) map.set(adGroupId, new Map());
						const perGroup = map.get(adGroupId)!;

						if (!perGroup.has(adId)) {
							const ad = row.ad_group_ad?.ad;
							const responsiveAd = ad?.responsive_search_ad;
							const expandedAd = ad?.expanded_text_ad;

							let headlines: string[] = [];
							let descriptions: string[] = [];
							if (responsiveAd) {
								if (Array.isArray(responsiveAd.headlines)) {
									headlines = responsiveAd.headlines.map((h: any) => h?.text).filter(Boolean);
								}
								if (Array.isArray(responsiveAd.descriptions)) {
									descriptions = responsiveAd.descriptions.map((d: any) => d?.text).filter(Boolean);
								}
							}

							perGroup.set(adId, {
								id: adId,
								type: ad?.type ? String(ad.type) : undefined,
								status: String(row.ad_group_ad?.status || 'UNKNOWN'),
								headlines: headlines.length ? headlines : undefined,
								descriptions: descriptions.length ? descriptions : undefined,
								headline_part1: expandedAd?.headline_part1 ?? undefined,
								headline_part2: expandedAd?.headline_part2 ?? undefined,
								headline_part3: expandedAd?.headline_part3 ?? undefined,
								description: expandedAd?.description ?? undefined,
								description2: expandedAd?.description2 ?? undefined,
								metrics: {
									impressions: 0,
									clicks: 0,
									interactions: 0,
									interaction_rate: 0,
									cost_micros: 0,
									average_cpc_micros: 0,
									conversions: 0,
									conversions_value: 0,
								},
							});
						}

						const agg = perGroup.get(adId)!;
						agg.metrics.impressions += Number(row.metrics?.impressions || 0);
						agg.metrics.clicks += Number(row.metrics?.clicks || 0);
						agg.metrics.interactions = (agg.metrics.interactions || 0) + Number(row.metrics?.interactions || 0);
						agg.metrics.cost_micros += Number(row.metrics?.cost_micros || 0);
						agg.metrics.conversions = (agg.metrics.conversions || 0) + Number(row.metrics?.conversions || 0);
						agg.metrics.conversions_value = (agg.metrics.conversions_value || 0) + Number(row.metrics?.conversions_value || 0);

						if (row.metrics?.average_cpc !== undefined && Number(row.metrics?.average_cpc || 0) > 0) {
							agg.metrics.average_cpc_micros = Number(row.metrics.average_cpc || 0);
						}
						if (row.metrics?.interaction_rate !== undefined && Number(row.metrics?.interaction_rate || 0) > 0) {
							agg.metrics.interaction_rate = Number(row.metrics.interaction_rate || 0);
						}
					}

					for (const [adGroupId, adsMap] of map.entries()) {
						const existing = adsByAdGroupId.get(adGroupId) || [];
						const ads = Array.from(adsMap.values()).map((ad) => {
							const cost = ad.metrics.cost_micros / 1000000;
							const ctr = ad.metrics.impressions > 0 ? (ad.metrics.clicks / ad.metrics.impressions) * 100 : 0;

							let adName = `Ad ${ad.id}`;
							if (ad.headlines && ad.headlines.length > 0) adName = ad.headlines[0] ?? adName;
							else if (ad.headline_part1) adName = ad.headline_part1;

							return {
								id: ad.id,
								name: adName,
								type: ad.type,
								status: ad.status,
								insights: {
									impressions: ad.metrics.impressions > 0 ? String(ad.metrics.impressions) : null,
									clicks: ad.metrics.clicks > 0 ? String(ad.metrics.clicks) : null,
									cost: cost > 0 ? String(cost.toFixed(2)) : null,
									ctr: ctr > 0 ? String(ctr.toFixed(2)) : null,
									conversions: (ad.metrics.conversions || 0) > 0 ? String(ad.metrics.conversions || 0) : null,
									conversions_value: (ad.metrics.conversions_value || 0) > 0 ? String((ad.metrics.conversions_value || 0).toFixed(2)) : null,
								},
							};
						});

						adsByAdGroupId.set(adGroupId, [...existing, ...ads]);
					}
				}

				const out: Record<string, any[]> = {};
				for (const [k, v] of adsByAdGroupId.entries()) out[k] = v;

				return {
					success: true,
					data: out,
					meta: {
						retrieved_at: new Date().toISOString(),
						total_ad_groups: cleanIds.length,
					},
				};
			} catch (error) {
				console.error('Google Ads API bulk list ads error:', error);

				if (error instanceof TRPCError) {
					throw error;
				}

				const errorInfo = GoogleAdsErrorHandler.handleError(error);
				throw new TRPCError({
					code:
						errorInfo.type === 'refresh-token' || errorInfo.type === 'permission'
							? 'UNAUTHORIZED'
							: 'INTERNAL_SERVER_ERROR',
					message: errorInfo.message || (error instanceof Error ? error.message : 'Failed to list ads (bulk)'),
				});
			}
		}),
});

