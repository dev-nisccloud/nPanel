import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { createGoogleAdsClient, getCustomerInstance, } from '../../lib/google-ads-client';
import { getGoogleAdsClientId, getGoogleAdsClientSecret, getGoogleAdsDeveloperToken, } from '../../lib/google-ads-credentials';
import { GoogleAdsErrorHandler } from '../../lib/google-ads-error-handler';
import { getUserGoogleAdsIntegration } from '../../lib/google-ads-user-integration';
/**
 * Format date for Google Ads API (YYYYMMDD format)
 */
function formatDateForGoogleAds(date) {
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
        .input(z.object({
        customerId: z.string().min(1, 'Customer ID is required'),
        adGroupId: z.string().min(1, 'Ad Group ID is required'),
        timeRange: z
            .object({
            since: z.string(), // YYYY-MM-DD format
            until: z.string(), // YYYY-MM-DD format
        })
            .optional(),
    }))
        .query(async ({ input, ctx }) => {
        try {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User session not found',
                });
            }
            const integration = await getUserGoogleAdsIntegration(userId);
            // Remove dashes from customer ID for API call
            const customerIdWithoutDashes = input.customerId.replace(/-/g, '');
            // Create Google Ads client
            const client = createGoogleAdsClient({
                developerToken: getGoogleAdsDeveloperToken(),
                clientId: getGoogleAdsClientId(),
                clientSecret: getGoogleAdsClientSecret(),
                refreshToken: integration.refreshToken,
            });
            // Get customer instance
            const customer = getCustomerInstance(client, customerIdWithoutDashes, integration.refreshToken);
            // Build date range clause for metrics
            let dateRangeClause = '';
            if (input.timeRange) {
                const sinceDate = formatDateForGoogleAds(new Date(input.timeRange.since));
                const untilDate = formatDateForGoogleAds(new Date(input.timeRange.until));
                dateRangeClause = `AND segments.date BETWEEN '${sinceDate}' AND '${untilDate}'`;
            }
            else {
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
						metrics.cost_micros,
						metrics.ctr,
						metrics.average_cpc,
						metrics.conversions,
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
            const adsMap = new Map();
            // Process results and aggregate metrics
            for (const row of results) {
                const adId = String(row.ad_group_ad?.ad?.id || '');
                if (!adId)
                    continue;
                if (!adsMap.has(adId)) {
                    const ad = row.ad_group_ad?.ad;
                    const responsiveAd = ad?.responsive_search_ad;
                    const expandedAd = ad?.expanded_text_ad;
                    // Extract headlines and descriptions based on ad type
                    let headlines = [];
                    let descriptions = [];
                    if (responsiveAd) {
                        // Responsive Search Ad
                        if (responsiveAd.headlines && Array.isArray(responsiveAd.headlines)) {
                            headlines = responsiveAd.headlines
                                .map((h) => h?.text)
                                .filter((text) => text);
                        }
                        if (responsiveAd.descriptions && Array.isArray(responsiveAd.descriptions)) {
                            descriptions = responsiveAd.descriptions
                                .map((d) => d?.text)
                                .filter((text) => text);
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
                            cost_micros: 0,
                            ctr: 0,
                            average_cpc_micros: 0,
                            conversions: 0,
                            cost_per_conversion_micros: 0,
                        },
                    });
                }
                const ad = adsMap.get(adId);
                // Aggregate metrics (sum across all dates)
                if (row.metrics) {
                    ad.metrics.impressions += Number(row.metrics.impressions || 0);
                    ad.metrics.clicks += Number(row.metrics.clicks || 0);
                    ad.metrics.cost_micros += Number(row.metrics.cost_micros || 0);
                    if (row.metrics.conversions !== undefined && row.metrics.conversions !== null) {
                        // Ensure conversions is initialized
                        if (ad.metrics.conversions === undefined) {
                            ad.metrics.conversions = 0;
                        }
                        ad.metrics.conversions += Number(row.metrics.conversions || 0);
                    }
                    if (row.metrics.average_cpc !== undefined && Number(row.metrics.average_cpc || 0) > 0) {
                        ad.metrics.average_cpc_micros = Number(row.metrics.average_cpc || 0);
                    }
                    if (row.metrics.cost_per_conversion !== undefined && Number(row.metrics.cost_per_conversion || 0) > 0) {
                        ad.metrics.cost_per_conversion_micros = Number(row.metrics.cost_per_conversion || 0);
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
                // Generate ad name from headlines or parts
                let adName = `Ad ${ad.id}`;
                if (ad.headlines && ad.headlines.length > 0) {
                    adName = ad.headlines[0] ?? adName;
                }
                else if (ad.headline_part1) {
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
                        cost: cost > 0 ? String(cost.toFixed(2)) : null,
                        ctr: ctr > 0 ? String(ctr.toFixed(2)) : null,
                        cpc: averageCpc > 0 ? String(averageCpc.toFixed(2)) : null,
                        conversions: ad.metrics.conversions && ad.metrics.conversions > 0
                            ? String(ad.metrics.conversions)
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
        }
        catch (error) {
            console.error('Google Ads API list ads error:', error);
            if (error instanceof TRPCError) {
                throw error;
            }
            const errorInfo = GoogleAdsErrorHandler.handleError(error);
            throw new TRPCError({
                code: errorInfo.type === 'refresh-token' || errorInfo.type === 'permission'
                    ? 'UNAUTHORIZED'
                    : 'INTERNAL_SERVER_ERROR',
                message: errorInfo.message || (error instanceof Error ? error.message : 'Failed to list ads'),
            });
        }
    }),
});
