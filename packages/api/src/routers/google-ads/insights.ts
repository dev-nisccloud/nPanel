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
import { getUserGoogleAdsIntegration } from '../../lib/google-ads-user-integration';

/**
 * Format date for Google Ads API (YYYYMMDD format)
 */
function formatDateForGoogleAds(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

export const googleAdsInsightsRouter = router({
    /**
     * Get daily performance metrics for a specific campaign
     */
    getDailyPerformance: protectedProcedure
        .input(
            z.object({
                customerId: z.string().min(1, 'Customer ID is required'),
                campaignId: z.string().min(1, 'Campaign ID is required'),
                timeRange: z.object({
                    since: z.string(), // YYYY-MM-DD
                    until: z.string(), // YYYY-MM-DD
                }),
            })
        )
        .query(async ({ input, ctx }) => {
            try {
                const userId = ctx.session?.user?.id;
                if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User session not found' });

                const integration = await getUserGoogleAdsIntegration(userId);
                const customerIdWithoutDashes = input.customerId.replace(/-/g, '');

                const client = createGoogleAdsClient({
                    developerToken: getGoogleAdsDeveloperToken(),
                    clientId: getGoogleAdsClientId(),
                    clientSecret: getGoogleAdsClientSecret(),
                    refreshToken: integration.refreshToken,
                });

                const customer = getCustomerInstance(client, customerIdWithoutDashes, integration.refreshToken);

                const sinceDate = formatDateForGoogleAds(input.timeRange.since);
                const untilDate = formatDateForGoogleAds(input.timeRange.until);

                const query = `
					SELECT
						segments.date,
						metrics.impressions,
						metrics.clicks,
						metrics.cost_micros,
						metrics.conversions,
						metrics.conversions_value,
						metrics.interaction_rate,
						metrics.average_cpc,
						metrics.ctr
					FROM campaign
					WHERE campaign.id = ${input.campaignId}
					  AND segments.date BETWEEN '${sinceDate}' AND '${untilDate}'
					ORDER BY segments.date ASC
				`;

                const results = await customer.query(query);

                return {
                    success: true,
                    data: (results as any[]).map(row => ({
                        date: row.segments?.date as string | undefined,
                        impressions: row.metrics?.impressions ? String(row.metrics.impressions) : "0",
                        clicks: row.metrics?.clicks ? String(row.metrics.clicks) : "0",
                        spend: (Number(row.metrics?.cost_micros || 0) / 1000000).toFixed(2),
                        conversions: row.metrics?.conversions ? String(row.metrics.conversions) : "0",
                        conversions_value: row.metrics?.conversions_value ? String(row.metrics.conversions_value) : "0",
                        interaction_rate: row.metrics?.interaction_rate ? String(row.metrics.interaction_rate) : "0",
                        cpc: (Number(row.metrics?.average_cpc || 0) / 1000000).toFixed(2),
                        ctr: (Number(row.metrics?.ctr || 0) * 100).toFixed(2),
                    })),
                };
            } catch (error) {
                const errorInfo = GoogleAdsErrorHandler.handleError(error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: errorInfo.message || 'Failed to fetch daily performance',
                });
            }
        }),

    /**
     * Get breakdown metrics (device, geography, demographics)
     */
    getBreakdowns: protectedProcedure
        .input(
            z.object({
                customerId: z.string().min(1, 'Customer ID is required'),
                campaignId: z.string().min(1, 'Campaign ID is required'),
                timeRange: z.object({
                    since: z.string(),
                    until: z.string(),
                }),
                breakdown: z.enum(['device', 'region', 'gender', 'age_range', 'search_terms']),
            })
        )
        .query(async ({ input, ctx }) => {
            try {
                const userId = ctx.session?.user?.id;
                if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User session not found' });

                const integration = await getUserGoogleAdsIntegration(userId);
                const customerIdWithoutDashes = input.customerId.replace(/-/g, '');

                const client = createGoogleAdsClient({
                    developerToken: getGoogleAdsDeveloperToken(),
                    clientId: getGoogleAdsClientId(),
                    clientSecret: getGoogleAdsClientSecret(),
                    refreshToken: integration.refreshToken,
                });

                const customer = getCustomerInstance(client, customerIdWithoutDashes, integration.refreshToken);

                const sinceDate = formatDateForGoogleAds(input.timeRange.since);
                const untilDate = formatDateForGoogleAds(input.timeRange.until);

                let query = '';
                let mappingFn = (row: any) => row;

                const US_STATE_MAPPING: Record<string, string> = {
                    '21133': 'Alabama', '21134': 'Alaska', '20135': 'Arizona', '21136': 'Arkansas',
                    '21137': 'California', '21138': 'Colorado', '21139': 'Connecticut', '21140': 'Delaware',
                    '21141': 'Florida', '21142': 'Georgia', '21143': 'Hawaii', '21144': 'Idaho',
                    '21145': 'Illinois', '21146': 'Indiana', '21147': 'Iowa', '21148': 'Kansas',
                    '21149': 'Kentucky', '21150': 'Louisiana', '21151': 'Maine', '21152': 'Maryland',
                    '21153': 'Massachusetts', '21154': 'Michigan', '21155': 'Minnesota', '21156': 'Mississippi',
                    '21157': 'Missouri', '21158': 'Montana', '21159': 'Nebraska', '21160': 'Nevada',
                    '21161': 'New Hampshire', '21162': 'New Jersey', '21163': 'New Mexico', '21164': 'New York',
                    '21165': 'North Carolina', '21166': 'North Dakota', '21167': 'Ohio', '21168': 'Oklahoma',
                    '21169': 'Oregon', '21170': 'Pennsylvania', '21171': 'Rhode Island', '21172': 'South Carolina',
                    '21173': 'South Dakota', '21174': 'Tennessee', '21175': 'Texas', '21176': 'Utah',
                    '21177': 'Vermont', '21178': 'Virginia', '21179': 'Washington', '21180': 'West Virginia',
                    '21181': 'Wisconsin', '21182': 'Wyoming', '21183': 'District of Columbia'
                };

                const COUNTRY_MAPPING: Record<string, string> = {
                    '2840': 'United States',
                    '2826': 'United Kingdom',
                    '2124': 'Canada',
                    '2036': 'Australia',
                    '2404': 'Kenya',
                    '2566': 'Nigeria',
                    '2710': 'South Africa',
                    '2356': 'India',
                    '2250': 'France',
                    '2276': 'Germany',
                    '2724': 'Spain',
                    '2380': 'Italy',
                    '2392': 'Japan',
                    '2410': 'South Korea',
                    '2156': 'China',
                    '2076': 'Brazil',
                    '2484': 'Mexico',
                    '2752': 'Sweden',
                    '2578': 'Norway',
                    '2208': 'Denmark',
                    '2246': 'Finland',
                    '2528': 'Netherlands',
                    '2056': 'Belgium',
                    '2756': 'Switzerland',
                    '2040': 'Austria',
                };

                const formatLabel = (str: string) => {
                    return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
                };

                // Mappings for Google Ads Enum IDs
                const DEVICE_MAPPING: Record<string, string> = {
                    '2': 'Mobile',
                    '3': 'Tablet',
                    '4': 'Desktop',
                    '6': 'Connected TV',
                    '7': 'Other'
                };

                const GENDER_MAPPING: Record<string, string> = {
                    '10': 'Male',
                    '11': 'Female',
                    '20': 'Undetermined'
                };

                const AGE_MAPPING: Record<string, string> = {
                    '503001': '18-24',
                    '503002': '25-34',
                    '503003': '35-44',
                    '503004': '45-54',
                    '503005': '55-64',
                    '503006': '65+',
                    '503999': 'Undetermined'
                };

                switch (input.breakdown) {
                    case 'device':
                        query = `
                            SELECT
                                segments.device,
                                metrics.impressions,
                                metrics.clicks,
                                metrics.cost_micros
                            FROM campaign
                            WHERE campaign.id = ${input.campaignId}
                              AND segments.date BETWEEN '${sinceDate}' AND '${untilDate}'
                        `;
                        mappingFn = (row: any) => {
                            const deviceValue = String(row.segments?.device || 'UNKNOWN');
                            let label = DEVICE_MAPPING[deviceValue];
                            if (!label) {
                                const clean = deviceValue.replace('DEVICE_', '');
                                label = clean === 'Connected_tv' ? 'Connected TV' : formatLabel(clean);
                            }
                            return {
                                device: label,
                                impressions: Number(row.metrics?.impressions || 0),
                                clicks: Number(row.metrics?.clicks || 0),
                                spend: (Number(row.metrics?.cost_micros || 0) / 1000000).toFixed(2),
                            };
                        };
                        break;
                    case 'region':
                        query = `
                            SELECT
                                geographic_view.country_criterion_id,
                                segments.geo_target_state,
                                metrics.impressions,
                                metrics.clicks,
                                metrics.cost_micros
                            FROM geographic_view
                            WHERE campaign.id = ${input.campaignId}
                              AND segments.date BETWEEN '${sinceDate}' AND '${untilDate}'
                        `;
                        mappingFn = (row: any) => {
                            const stateResource = row.segments?.geo_target_state;
                            const countryId = String(row.geographic_view?.country_criterion_id || '');

                            let regionName = 'Unknown';
                            if (stateResource) {
                                const regionId = String(stateResource).split('/').pop() || '';
                                regionName = US_STATE_MAPPING[regionId] || `Region ${regionId}`;
                            } else if (countryId) {
                                const cId = countryId.split('/').pop() || '';
                                regionName = COUNTRY_MAPPING[cId] || `Country ${cId}`;
                            }

                            return {
                                region: regionName,
                                impressions: Number(row.metrics?.impressions || 0),
                                clicks: Number(row.metrics?.clicks || 0),
                                spend: (Number(row.metrics?.cost_micros || 0) / 1000000).toFixed(2),
                            };
                        };
                        break;
                    case 'search_terms':
                        query = `
                            SELECT
                                search_term_view.search_term,
                                metrics.impressions,
                                metrics.clicks,
                                metrics.cost_micros
                            FROM search_term_view
                            WHERE campaign.id = ${input.campaignId}
                              AND segments.date BETWEEN '${sinceDate}' AND '${untilDate}'
                              AND metrics.impressions > 0
                            ORDER BY metrics.impressions DESC
                            LIMIT 15
                        `;
                        mappingFn = (row: any) => ({
                            term: row.search_term_view?.search_term || 'Unknown',
                            impressions: Number(row.metrics?.impressions || 0),
                            clicks: Number(row.metrics?.clicks || 0),
                            spend: (Number(row.metrics?.cost_micros || 0) / 1000000).toFixed(2),
                        });
                        break;
                    case 'gender':
                        query = `
                            SELECT
                                ad_group_criterion.gender.type,
                                metrics.impressions,
                                metrics.clicks,
                                metrics.cost_micros
                            FROM gender_view
                            WHERE campaign.id = ${input.campaignId}
                              AND segments.date BETWEEN '${sinceDate}' AND '${untilDate}'
                        `;
                        mappingFn = (row: any) => {
                            const genderType = String(row.ad_group_criterion?.gender?.type || 'UNKNOWN');
                            let label = GENDER_MAPPING[genderType];
                            if (!label) {
                                label = formatLabel(genderType.replace('GENDER_', ''));
                            }
                            return {
                                gender: label,
                                impressions: Number(row.metrics?.impressions || 0),
                                clicks: Number(row.metrics?.clicks || 0),
                                spend: (Number(row.metrics?.cost_micros || 0) / 1000000).toFixed(2),
                            };
                        };
                        break;
                    case 'age_range':
                        query = `
                            SELECT
                                ad_group_criterion.age_range.type,
                                metrics.impressions,
                                metrics.clicks,
                                metrics.cost_micros
                            FROM age_range_view
                            WHERE campaign.id = ${input.campaignId}
                              AND segments.date BETWEEN '${sinceDate}' AND '${untilDate}'
                        `;
                        mappingFn = (row: any) => {
                            const ageRange = String(row.ad_group_criterion?.age_range?.type || 'UNKNOWN');
                            let label = AGE_MAPPING[ageRange];
                            if (!label) {
                                const clean = ageRange.replace('AGE_RANGE_', '').replace('UNDETERMINED', 'Undetermined');
                                label = clean.replace(/_/g, '-');
                            }
                            return {
                                age_range: label,
                                impressions: Number(row.metrics?.impressions || 0),
                                clicks: Number(row.metrics?.clicks || 0),
                                spend: (Number(row.metrics?.cost_micros || 0) / 1000000).toFixed(2),
                            };
                        };
                        break;
                }

                try {
                    const results = await customer.query(query);
                    return {
                        success: true,
                        data: (results as any[]).map(row => mappingFn(row) as Record<string, any>),
                    };
                } catch (queryError: any) {
                    // Diagnostic logging to catch the real GAQL error
                    console.error(`[Google Ads] Breakdown query failed for ${input.breakdown}:`, {
                        campaignId: input.campaignId,
                        error: queryError?.message || queryError,
                        query: query.trim()
                    });

                    // Return empty data instead of crashing the process
                    // This allows the UI to show "No Data" instead of a 500 Internal Error
                    return {
                        success: true,
                        data: [],
                    };
                }
            } catch (error) {
                const errorInfo = GoogleAdsErrorHandler.handleError(error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: errorInfo.message || 'Failed to fetch breakdowns',
                });
            }
        }),

    /**
     * Get keyword performance for a specific campaign
     */
    getKeywordsPerformance: protectedProcedure
        .input(
            z.object({
                customerId: z.string().min(1, 'Customer ID is required'),
                campaignId: z.string().min(1, 'Campaign ID is required'),
                timeRange: z.object({
                    since: z.string(),
                    until: z.string(),
                }),
            })
        )
        .query(async ({ input, ctx }) => {
            try {
                const userId = ctx.session?.user?.id;
                if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User session not found' });

                const integration = await getUserGoogleAdsIntegration(userId);
                const customerIdWithoutDashes = input.customerId.replace(/-/g, '');

                const client = createGoogleAdsClient({
                    developerToken: getGoogleAdsDeveloperToken(),
                    clientId: getGoogleAdsClientId(),
                    clientSecret: getGoogleAdsClientSecret(),
                    refreshToken: integration.refreshToken,
                });

                const customer = getCustomerInstance(client, customerIdWithoutDashes, integration.refreshToken);
                const sinceDate = formatDateForGoogleAds(input.timeRange.since);
                const untilDate = formatDateForGoogleAds(input.timeRange.until);

                const query = `
                     SELECT
                         ad_group_criterion.keyword.text,
                         ad_group_criterion.keyword.match_type,
                         ad_group_criterion.status,
                         metrics.impressions,
                         metrics.clicks,
                         metrics.cost_micros,
                         metrics.ctr,
                         metrics.average_cpc,
                         metrics.conversions
                     FROM keyword_view
                     WHERE campaign.id = ${input.campaignId}
                       AND segments.date BETWEEN '${sinceDate}' AND '${untilDate}'
                       AND ad_group_criterion.negative = FALSE
                     ORDER BY metrics.impressions DESC
                     LIMIT 10
                 `;

                const results = await customer.query(query);

                const KEYWORD_MATCH_TYPE_MAPPING: Record<string, string> = {
                    '2': 'EXACT',
                    '3': 'PHRASE',
                    '4': 'BROAD',
                };

                const CRITERION_STATUS_MAPPING: Record<string, string> = {
                    '2': 'ENABLED',
                    '3': 'PAUSED',
                    '4': 'REMOVED',
                };

                return {
                    success: true,
                    data: (results as any[]).map(row => ({
                        keyword: row.ad_group_criterion?.keyword?.text as string | undefined,
                        matchType: KEYWORD_MATCH_TYPE_MAPPING[String(row.ad_group_criterion?.keyword?.match_type)] || String(row.ad_group_criterion?.keyword?.match_type),
                        status: CRITERION_STATUS_MAPPING[String(row.ad_group_criterion?.status)] || String(row.ad_group_criterion?.status),
                        impressions: Number(row.metrics?.impressions || 0),
                        clicks: Number(row.metrics?.clicks || 0),
                        spend: (Number(row.metrics?.cost_micros || 0) / 1000000).toFixed(2),
                        ctr: (Number(row.metrics?.ctr || 0) * 100).toFixed(2),
                        cpc: (Number(row.metrics?.average_cpc || 0) / 1000000).toFixed(2),
                        conversions: Number(row.metrics?.conversions || 0),
                    })),
                };
            } catch (error) {
                const errorInfo = GoogleAdsErrorHandler.handleError(error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: errorInfo.message || 'Failed to fetch keywords',
                });
            }
        }),

    /**
     * Get network performance breakdown
     */
    getNetworkBreakdown: protectedProcedure
        .input(
            z.object({
                customerId: z.string().min(1, 'Customer ID is required'),
                campaignId: z.string().min(1, 'Campaign ID is required'),
                timeRange: z.object({
                    since: z.string(),
                    until: z.string(),
                }),
            })
        )
        .query(async ({ input, ctx }) => {
            try {
                const userId = ctx.session?.user?.id;
                if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User session not found' });

                const integration = await getUserGoogleAdsIntegration(userId);
                const customerIdWithoutDashes = input.customerId.replace(/-/g, '');

                const client = createGoogleAdsClient({
                    developerToken: getGoogleAdsDeveloperToken(),
                    clientId: getGoogleAdsClientId(),
                    clientSecret: getGoogleAdsClientSecret(),
                    refreshToken: integration.refreshToken,
                });

                const customer = getCustomerInstance(client, customerIdWithoutDashes, integration.refreshToken);
                const sinceDate = formatDateForGoogleAds(input.timeRange.since);
                const untilDate = formatDateForGoogleAds(input.timeRange.until);

                const query = `
                     SELECT
                         segments.ad_network_type,
                         metrics.impressions,
                         metrics.clicks,
                         metrics.cost_micros
                     FROM campaign
                     WHERE campaign.id = ${input.campaignId}
                       AND segments.date BETWEEN '${sinceDate}' AND '${untilDate}'
                 `;

                const results = await customer.query(query);

                const AD_NETWORK_TYPE_MAPPING: Record<string, string> = {
                    '2': 'Search',
                    '3': 'Display',
                    '4': 'Search Partners',
                    '5': 'YouTube Search',
                    '6': 'YouTube Watch',
                    '7': 'Mixed',
                    '8': 'Partners',
                };

                return {
                    success: true,
                    data: (results as any[]).map(row => {
                        const networkId = String(row.segments?.ad_network_type || 'UNKNOWN');
                        return {
                            network: AD_NETWORK_TYPE_MAPPING[networkId] || networkId.replace('SEARCH_', '').replace(/_/g, ' '),
                            impressions: Number(row.metrics?.impressions || 0),
                            clicks: Number(row.metrics?.clicks || 0),
                            spend: (Number(row.metrics?.cost_micros || 0) / 1000000).toFixed(2),
                        };
                    }),
                };
            } catch (error) {
                const errorInfo = GoogleAdsErrorHandler.handleError(error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: errorInfo.message || 'Failed to fetch network breakdown',
                });
            }
        }),

    /**
     * Get time-of-day and day-of-week breakdown
     */
    getTimeOfDayBreakdown: protectedProcedure
        .input(
            z.object({
                customerId: z.string().min(1, 'Customer ID is required'),
                campaignId: z.string().min(1, 'Campaign ID is required'),
                timeRange: z.object({
                    since: z.string(),
                    until: z.string(),
                }),
            })
        )
        .query(async ({ input, ctx }) => {
            try {
                const userId = ctx.session?.user?.id;
                if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User session not found' });

                const integration = await getUserGoogleAdsIntegration(userId);
                const customerIdWithoutDashes = input.customerId.replace(/-/g, '');

                const client = createGoogleAdsClient({
                    developerToken: getGoogleAdsDeveloperToken(),
                    clientId: getGoogleAdsClientId(),
                    clientSecret: getGoogleAdsClientSecret(),
                    refreshToken: integration.refreshToken,
                });

                const customer = getCustomerInstance(client, customerIdWithoutDashes, integration.refreshToken);
                const sinceDate = formatDateForGoogleAds(input.timeRange.since);
                const untilDate = formatDateForGoogleAds(input.timeRange.until);

                const query = `
                     SELECT
                         segments.day_of_week,
                         segments.hour,
                         metrics.impressions,
                         metrics.clicks,
                         metrics.cost_micros
                     FROM campaign
                     WHERE campaign.id = ${input.campaignId}
                       AND segments.date BETWEEN '${sinceDate}' AND '${untilDate}'
                 `;

                const results = await customer.query(query);

                const DAY_OF_WEEK_MAPPING: Record<string, string> = {
                    '2': 'MONDAY',
                    '3': 'TUESDAY',
                    '4': 'WEDNESDAY',
                    '5': 'THURSDAY',
                    '6': 'FRIDAY',
                    '7': 'SATURDAY',
                    '8': 'SUNDAY',
                };

                return {
                    success: true,
                    data: (results as any[]).map(row => {
                        const d = String(row.segments?.day_of_week);
                        const dayLabel = DAY_OF_WEEK_MAPPING[d] || d;

                        return {
                            dayOfWeek: dayLabel,
                            hour: row.segments?.hour ? Number(row.segments.hour) : undefined,
                            impressions: Number(row.metrics?.impressions || 0),
                            clicks: Number(row.metrics?.clicks || 0),
                            spend: (Number(row.metrics?.cost_micros || 0) / 1000000).toFixed(2),
                        };
                    }),
                };
            } catch (error) {
                const errorInfo = GoogleAdsErrorHandler.handleError(error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: errorInfo.message || 'Failed to fetch time-of-day breakdown',
                });
            }
        }),
});
