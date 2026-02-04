import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import prisma from '@nPanel/db';
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

/**
 * Get user's Google Ads integration with valid tokens
 */
async function getUserIntegration(userId: string) {
    const integration = await prisma.googleAdsIntegration.findFirst({
        where: {
            userId,
            status: 'ACTIVE',
        },
    });

    if (!integration) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No active Google Ads integration found. Please connect your account first.',
        });
    }

    // Check if access token is expired and refresh if needed
    const isExpired =
        integration.accessTokenExpiresAt &&
        new Date(integration.accessTokenExpiresAt) < new Date();

    if (isExpired && integration.refreshToken) {
        const { refreshAccessToken } = await import('../../lib/google-ads-client');
        const clientId = getGoogleAdsClientId();
        const clientSecret = getGoogleAdsClientSecret();

        try {
            const tokenResponse = await refreshAccessToken(
                integration.refreshToken,
                clientId,
                clientSecret
            );

            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

            await prisma.googleAdsIntegration.update({
                where: { id: integration.id },
                data: {
                    accessToken: tokenResponse.access_token,
                    accessTokenExpiresAt: expiresAt,
                    lastTokenRefreshAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            integration.accessToken = tokenResponse.access_token;
            integration.accessTokenExpiresAt = expiresAt;
        } catch (error) {
            const errorInfo = GoogleAdsErrorHandler.handleError(error);
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: `Failed to refresh access token: ${errorInfo.message}`,
            });
        }
    }

    return integration;
}

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

                const integration = await getUserIntegration(userId);
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
                    data: results.map(row => ({
                        date: row.segments?.date,
                        impressions: row.metrics?.impressions,
                        clicks: row.metrics?.clicks,
                        spend: (Number(row.metrics?.cost_micros || 0) / 1000000).toFixed(2),
                        conversions: row.metrics?.conversions,
                        conversions_value: row.metrics?.conversions_value,
                        interaction_rate: row.metrics?.interaction_rate,
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
                breakdown: z.enum(['device', 'region', 'gender', 'age_range']),
            })
        )
        .query(async ({ input, ctx }) => {
            try {
                const userId = ctx.session?.user?.id;
                if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User session not found' });

                const integration = await getUserIntegration(userId);
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
                            // Check map first for numeric IDs
                            let label = DEVICE_MAPPING[deviceValue];
                            if (!label) {
                                // Fallback to string formatting
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
                                segments.geo_target_state,
                                metrics.impressions,
                                metrics.clicks,
                                metrics.cost_micros
                            FROM user_location_view
                            WHERE campaign.id = ${input.campaignId}
                              AND segments.date BETWEEN '${sinceDate}' AND '${untilDate}'
                              AND metrics.impressions > 0
                        `;
                        mappingFn = (row: any) => {
                            const resourceName = row.segments?.geo_target_state || '';
                            const regionId = resourceName.split('/').pop() || 'Unknown';
                            // Try to map US state ID, otherwise show ID
                            const regionName = US_STATE_MAPPING[regionId] || `Region ${regionId}`;

                            return {
                                region: regionName,
                                impressions: Number(row.metrics?.impressions || 0),
                                clicks: Number(row.metrics?.clicks || 0),
                                spend: (Number(row.metrics?.cost_micros || 0) / 1000000).toFixed(2),
                            };
                        };
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
                            // Check map first for exact numeric matches e.g. "10"
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
                            // Check map first for exact numeric matches e.g. "503001"
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

                const results = await customer.query(query);

                return {
                    success: true,
                    data: results.map(mappingFn),
                };
            } catch (error) {
                const errorInfo = GoogleAdsErrorHandler.handleError(error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: errorInfo.message || 'Failed to fetch breakdowns',
                });
            }
        }),
});
