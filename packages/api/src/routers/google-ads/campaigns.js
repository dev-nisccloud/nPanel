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
function humanizeCriterionType(value) {
    if (value === null || value === undefined)
        return 'Unknown';
    const raw = String(value);
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) {
        // Official mapping comes from CriterionTypeEnum in googleapis protos.
        // We map only common targeting-related types we currently query.
        const map = {
            0: 'Unspecified',
            1: 'Unknown',
            6: 'Device',
            2: 'Keyword',
            3: 'Placement',
            7: 'Location',
            10: 'Age Range',
            11: 'Gender',
            16: 'User List',
            18: 'Topic',
            20: 'Language',
            24: 'User Interest',
        };
        return map[numeric] ?? raw;
    }
    return raw
        .replace(/^CRITERION_TYPE_/, '')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
function pickCriterionDisplayName(row) {
    const display = row?.campaign_criterion?.display_name ?? row?.ad_group_criterion?.display_name;
    if (display && String(display).trim())
        return String(display);
    const kwText = row?.campaign_criterion?.keyword?.text ?? row?.ad_group_criterion?.keyword?.text;
    if (kwText && String(kwText).trim())
        return String(kwText);
    const placementUrl = row?.campaign_criterion?.placement?.url ?? row?.ad_group_criterion?.placement?.url;
    if (placementUrl && String(placementUrl).trim())
        return String(placementUrl);
    const age = row?.campaign_criterion?.age_range?.type ?? row?.ad_group_criterion?.age_range?.type;
    if (age && String(age).trim())
        return String(age).replace(/^AGE_RANGE_/, '').replace(/_/g, '-');
    const gender = row?.campaign_criterion?.gender?.type ?? row?.ad_group_criterion?.gender?.type;
    if (gender && String(gender).trim())
        return String(gender).replace(/^GENDER_/, '');
    return null;
}
function uniqueStrings(values) {
    return Array.from(new Set(values.filter((v) => !!v && v.trim().length > 0)));
}
async function queryInChunks(customer, items, chunkSize, makeQuery, mapRow) {
    const out = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const q = makeQuery(chunk);
        const rows = (await customer.query(q));
        for (const r of rows)
            out.push(mapRow(r));
    }
    return out;
}
function extractIdFromPossiblyPrefixed(value) {
    // Handles patterns like "boomuserlist::9188392524" or plain numeric IDs.
    const m = value.match(/(\d{4,})$/);
    return m ? m[1] : null;
}
export const googleAdsCampaignsRouter = router({
    /**
     * List campaigns for a specific Google Ads customer account
     * Uses GAQL (Google Ads Query Language) to fetch campaigns with metrics
     */
    listCampaigns: protectedProcedure
        .input(z.object({
        customerId: z.string().min(1, 'Customer ID is required'),
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
            // Query campaigns with metrics using GAQL
            // Google Ads API uses segments.date for date filtering in metrics
            // Note: conversion_rate is not a valid field, we calculate it from conversions/clicks
            const query = `
					SELECT
						campaign.id,
						campaign.name,
						campaign.status,
						campaign.advertising_channel_type,
						campaign.advertising_channel_sub_type,
						campaign.bidding_strategy_type,
						campaign_budget.amount_micros,
						campaign_budget.period,
						metrics.impressions,
						metrics.clicks,
						metrics.cost_micros,
						metrics.ctr,
						metrics.average_cpc,
						metrics.conversions,
						metrics.cost_per_conversion,
						metrics.search_impression_share,
						metrics.search_rank_lost_impression_share,
						segments.date
					FROM campaign
					WHERE campaign.status != 'REMOVED'
					${dateRangeClause}
					ORDER BY campaign.id, segments.date DESC
				`;
            const results = await customer.query(query);
            // Group results by campaign ID and aggregate metrics
            const campaignsMap = new Map();
            // Process results and aggregate metrics
            for (const row of results) {
                const campaignId = String(row.campaign?.id || '');
                if (!campaignId)
                    continue;
                if (!campaignsMap.has(campaignId)) {
                    // Convert status to string (Google Ads API may return enum numbers)
                    const statusValue = row.campaign?.status;
                    const statusStr = statusValue !== undefined && statusValue !== null
                        ? String(statusValue)
                        : 'UNKNOWN';
                    campaignsMap.set(campaignId, {
                        id: campaignId,
                        name: row.campaign?.name || `Campaign ${campaignId}`,
                        status: statusStr,
                        advertising_channel_type: row.campaign?.advertising_channel_type
                            ? String(row.campaign.advertising_channel_type)
                            : undefined,
                        advertising_channel_sub_type: row.campaign?.advertising_channel_sub_type
                            ? String(row.campaign.advertising_channel_sub_type)
                            : undefined,
                        start_date: row.campaign?.start_date ?? undefined,
                        end_date: row.campaign?.end_date ?? undefined,
                        bidding_strategy_type: row.campaign?.bidding_strategy_type
                            ? String(row.campaign.bidding_strategy_type)
                            : undefined,
                        budget_amount_micros: row.campaign_budget?.amount_micros
                            ? String(row.campaign_budget.amount_micros)
                            : undefined,
                        budget_period: row.campaign_budget?.period
                            ? String(row.campaign_budget.period)
                            : undefined,
                        metrics: {
                            impressions: 0,
                            clicks: 0,
                            cost_micros: 0,
                            ctr: 0,
                            average_cpc_micros: 0,
                            conversions: 0,
                            cost_per_conversion_micros: 0,
                            conversion_rate: 0,
                            search_impression_share: 0,
                            search_rank_lost_impression_share: 0,
                        },
                    });
                }
                const campaign = campaignsMap.get(campaignId);
                // Aggregate metrics (sum across all dates)
                if (row.metrics) {
                    campaign.metrics.impressions += Number(row.metrics.impressions || 0);
                    campaign.metrics.clicks += Number(row.metrics.clicks || 0);
                    campaign.metrics.cost_micros += Number(row.metrics.cost_micros || 0);
                    if (row.metrics.conversions !== undefined && row.metrics.conversions !== null) {
                        // Ensure conversions is initialized
                        if (campaign.metrics.conversions === undefined) {
                            campaign.metrics.conversions = 0;
                        }
                        campaign.metrics.conversions += Number(row.metrics.conversions || 0);
                    }
                    // For rate metrics, we'll calculate from aggregated totals later
                    // Store the latest values as fallback
                    if (row.metrics.average_cpc !== undefined && Number(row.metrics.average_cpc || 0) > 0) {
                        campaign.metrics.average_cpc_micros = Number(row.metrics.average_cpc || 0);
                    }
                    if (row.metrics.cost_per_conversion !== undefined && Number(row.metrics.cost_per_conversion || 0) > 0) {
                        campaign.metrics.cost_per_conversion_micros = Number(row.metrics.cost_per_conversion || 0);
                    }
                    if (row.metrics.search_impression_share !== undefined && Number(row.metrics.search_impression_share || 0) > 0) {
                        campaign.metrics.search_impression_share = Number(row.metrics.search_impression_share || 0);
                    }
                    if (row.metrics.search_rank_lost_impression_share !== undefined && Number(row.metrics.search_rank_lost_impression_share || 0) > 0) {
                        campaign.metrics.search_rank_lost_impression_share = Number(row.metrics.search_rank_lost_impression_share || 0);
                    }
                }
            }
            // Convert to array and format for response
            const campaigns = Array.from(campaignsMap.values()).map((campaign) => {
                // Convert micros to currency units (divide by 1,000,000)
                const cost = campaign.metrics.cost_micros / 1000000;
                const averageCpc = campaign.metrics.average_cpc_micros
                    ? campaign.metrics.average_cpc_micros / 1000000
                    : campaign.metrics.clicks > 0
                        ? cost / campaign.metrics.clicks
                        : 0;
                const costPerConversion = campaign.metrics.cost_per_conversion_micros
                    ? campaign.metrics.cost_per_conversion_micros / 1000000
                    : campaign.metrics.conversions && campaign.metrics.conversions > 0
                        ? cost / campaign.metrics.conversions
                        : 0;
                const budgetAmount = campaign.budget_amount_micros
                    ? Number(campaign.budget_amount_micros) / 1000000
                    : null;
                // Calculate CTR from aggregated totals
                const ctr = campaign.metrics.impressions > 0
                    ? (campaign.metrics.clicks / campaign.metrics.impressions) * 100
                    : 0;
                // Calculate conversion rate from aggregated totals
                const conversionRate = campaign.metrics.clicks > 0 && campaign.metrics.conversions !== undefined
                    ? (campaign.metrics.conversions / campaign.metrics.clicks) * 100
                    : 0;
                return {
                    id: campaign.id,
                    name: campaign.name,
                    status: campaign.status,
                    advertising_channel_type: campaign.advertising_channel_type,
                    advertising_channel_sub_type: campaign.advertising_channel_sub_type,
                    start_date: campaign.start_date,
                    end_date: campaign.end_date,
                    bidding_strategy_type: campaign.bidding_strategy_type,
                    budget_amount: budgetAmount,
                    budget_period: campaign.budget_period,
                    insights: {
                        impressions: campaign.metrics.impressions > 0 ? String(campaign.metrics.impressions) : null,
                        clicks: campaign.metrics.clicks > 0 ? String(campaign.metrics.clicks) : null,
                        cost: cost > 0 ? String(cost.toFixed(2)) : null,
                        ctr: ctr > 0 ? String(ctr.toFixed(2)) : null,
                        cpc: averageCpc > 0 ? String(averageCpc.toFixed(2)) : null,
                        conversions: campaign.metrics.conversions && campaign.metrics.conversions > 0
                            ? String(campaign.metrics.conversions)
                            : null,
                        cost_per_conversion: costPerConversion > 0 ? String(costPerConversion.toFixed(2)) : null,
                        conversion_rate: conversionRate > 0 ? String(conversionRate.toFixed(2)) : null,
                        search_impression_share: campaign.metrics.search_impression_share && campaign.metrics.search_impression_share > 0
                            ? String(campaign.metrics.search_impression_share.toFixed(2))
                            : null,
                    },
                };
            });
            return {
                success: true,
                data: campaigns,
                meta: {
                    retrieved_at: new Date().toISOString(),
                    total_campaigns: campaigns.length,
                },
            };
        }
        catch (error) {
            console.error('Google Ads API list campaigns error:', error);
            if (error instanceof TRPCError) {
                throw error;
            }
            const errorInfo = GoogleAdsErrorHandler.handleError(error);
            throw new TRPCError({
                code: errorInfo.type === 'refresh-token' || errorInfo.type === 'permission'
                    ? 'UNAUTHORIZED'
                    : 'INTERNAL_SERVER_ERROR',
                message: errorInfo.message || (error instanceof Error ? error.message : 'Failed to list campaigns'),
            });
        }
    }),
    /**
     * Get campaign details for a specific campaign
     */
    getCampaignDetails: protectedProcedure
        .input(z.object({
        customerId: z.string().min(1, 'Customer ID is required'),
        campaignId: z.string().min(1, 'Campaign ID is required'),
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
            // Query campaign details
            const query = `
					SELECT
						campaign.id,
						campaign.name,
						campaign.status,
						campaign.advertising_channel_type,
						campaign.advertising_channel_sub_type,
						campaign.bidding_strategy_type,
						campaign_budget.amount_micros,
						campaign_budget.period
					FROM campaign
					WHERE campaign.id = ${input.campaignId}
				`;
            const results = await customer.query(query);
            if (!results || results.length === 0) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `Campaign ${input.campaignId} not found`,
                });
            }
            const campaignData = results[0];
            const budgetAmount = campaignData.campaign_budget?.amount_micros
                ? Number(campaignData.campaign_budget.amount_micros) / 1000000
                : null;
            // Convert status to string (Google Ads API may return enum numbers)
            const statusValue = campaignData.campaign?.status;
            const statusStr = statusValue !== undefined && statusValue !== null
                ? String(statusValue)
                : 'UNKNOWN';
            return {
                success: true,
                data: {
                    id: String(campaignData.campaign?.id || ''),
                    name: campaignData.campaign?.name || '',
                    status: statusStr,
                    advertising_channel_type: campaignData.campaign?.advertising_channel_type
                        ? String(campaignData.campaign.advertising_channel_type)
                        : undefined,
                    advertising_channel_sub_type: campaignData.campaign?.advertising_channel_sub_type
                        ? String(campaignData.campaign.advertising_channel_sub_type)
                        : undefined,
                    start_date: campaignData.campaign?.start_date ?? undefined,
                    end_date: campaignData.campaign?.end_date ?? undefined,
                    bidding_strategy_type: campaignData.campaign?.bidding_strategy_type
                        ? String(campaignData.campaign.bidding_strategy_type)
                        : undefined,
                    budget_amount: budgetAmount,
                    budget_period: campaignData.campaign_budget?.period
                        ? String(campaignData.campaign_budget.period)
                        : undefined,
                },
            };
        }
        catch (error) {
            console.error('Google Ads API get campaign details error:', error);
            if (error instanceof TRPCError) {
                throw error;
            }
            const errorInfo = GoogleAdsErrorHandler.handleError(error);
            throw new TRPCError({
                code: errorInfo.type === 'refresh-token' || errorInfo.type === 'permission'
                    ? 'UNAUTHORIZED'
                    : 'INTERNAL_SERVER_ERROR',
                message: errorInfo.message || (error instanceof Error ? error.message : 'Failed to get campaign details'),
            });
        }
    }),
    /**
     * Get campaign-level targeting criteria (campaign_criterion).
     */
    getCampaignTargeting: protectedProcedure
        .input(z.object({
        customerId: z.string().min(1, 'Customer ID is required'),
        campaignId: z.string().min(1, 'Campaign ID is required'),
    }))
        .query(async ({ input, ctx }) => {
        try {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User session not found' });
            }
            const integration = await getUserGoogleAdsIntegration(userId);
            const customerIdWithoutDashes = input.customerId.replace(/-/g, '');
            const client = createGoogleAdsClient({
                developerToken: getGoogleAdsDeveloperToken(),
                clientId: getGoogleAdsClientId(),
                clientSecret: getGoogleAdsClientSecret(),
                refreshToken: integration.refreshToken,
            });
            const customer = getCustomerInstance(client, customerIdWithoutDashes, integration.refreshToken);
            const query = `
					SELECT
						campaign.id,
						campaign_criterion.criterion_id,
						campaign_criterion.type,
						campaign_criterion.negative,
						campaign_criterion.status,
						campaign_criterion.display_name,
						campaign_criterion.keyword.text,
						campaign_criterion.keyword.match_type,
						campaign_criterion.location.geo_target_constant,
						campaign_criterion.language.language_constant,
						campaign_criterion.age_range.type,
						campaign_criterion.gender.type,
						campaign_criterion.user_interest.user_interest_category,
						campaign_criterion.user_list.user_list,
						campaign_criterion.topic.topic_constant,
						campaign_criterion.placement.url
					FROM campaign_criterion
					WHERE campaign.id = ${input.campaignId}
					  AND campaign_criterion.status != 'REMOVED'
					ORDER BY campaign_criterion.type
				`;
            const results = (await customer.query(query));
            // Resolve common resource references into human-readable names.
            const languageConstants = uniqueStrings(results.map((r) => r?.campaign_criterion?.language?.language_constant ? String(r.campaign_criterion.language.language_constant) : null));
            const geoTargets = uniqueStrings(results.map((r) => r?.campaign_criterion?.location?.geo_target_constant ? String(r.campaign_criterion.location.geo_target_constant) : null));
            const userListValues = uniqueStrings(results.map((r) => r?.campaign_criterion?.user_list?.user_list ? String(r.campaign_criterion.user_list.user_list) : null));
            const userInterestValues = uniqueStrings(results.map((r) => r?.campaign_criterion?.user_interest?.user_interest_category ? String(r.campaign_criterion.user_interest.user_interest_category) : null));
            const topicConstants = uniqueStrings(results.map((r) => r?.campaign_criterion?.topic?.topic_constant ? String(r.campaign_criterion.topic.topic_constant) : null));
            const languageMap = new Map();
            if (languageConstants.length > 0) {
                const resolved = await queryInChunks(customer, languageConstants, 200, (chunk) => `
							SELECT language_constant.resource_name, language_constant.code, language_constant.name
							FROM language_constant
							WHERE language_constant.resource_name IN (${chunk.map((v) => `'${v}'`).join(',')})
						`, (row) => ({
                    resourceName: String(row.language_constant?.resource_name || ''),
                    code: row.language_constant?.code ? String(row.language_constant.code) : '',
                    name: row.language_constant?.name ? String(row.language_constant.name) : '',
                }));
                for (const r of resolved) {
                    if (!r.resourceName)
                        continue;
                    languageMap.set(r.resourceName, r.code || r.name || r.resourceName);
                }
            }
            const geoTargetMap = new Map();
            if (geoTargets.length > 0) {
                const resolved = await queryInChunks(customer, geoTargets, 200, (chunk) => `
							SELECT geo_target_constant.resource_name, geo_target_constant.name, geo_target_constant.target_type, geo_target_constant.country_code
							FROM geo_target_constant
							WHERE geo_target_constant.resource_name IN (${chunk.map((v) => `'${v}'`).join(',')})
						`, (row) => ({
                    resourceName: String(row.geo_target_constant?.resource_name || ''),
                    name: row.geo_target_constant?.name ? String(row.geo_target_constant.name) : '',
                    targetType: row.geo_target_constant?.target_type ? String(row.geo_target_constant.target_type) : '',
                    countryCode: row.geo_target_constant?.country_code ? String(row.geo_target_constant.country_code) : '',
                }));
                for (const r of resolved) {
                    if (!r.resourceName)
                        continue;
                    const suffix = r.countryCode ? ` (${r.countryCode})` : '';
                    geoTargetMap.set(r.resourceName, (r.name || r.resourceName) + suffix);
                }
            }
            const userListMap = new Map();
            {
                const resourceNames = userListValues.filter((v) => v.includes('/'));
                const idValues = userListValues
                    .filter((v) => !v.includes('/'))
                    .map((v) => extractIdFromPossiblyPrefixed(v))
                    .filter((v) => !!v);
                if (resourceNames.length > 0) {
                    const resolved = await queryInChunks(customer, resourceNames, 200, (chunk) => `
								SELECT user_list.resource_name, user_list.name
								FROM user_list
								WHERE user_list.resource_name IN (${chunk.map((v) => `'${v}'`).join(',')})
							`, (row) => ({
                        resourceName: String(row.user_list?.resource_name || ''),
                        name: row.user_list?.name ? String(row.user_list.name) : '',
                    }));
                    for (const r of resolved) {
                        if (!r.resourceName)
                            continue;
                        userListMap.set(r.resourceName, r.name || r.resourceName);
                    }
                }
                if (idValues.length > 0) {
                    const uniqueIds = Array.from(new Set(idValues));
                    const resolved = await queryInChunks(customer, uniqueIds, 200, (chunk) => `
								SELECT user_list.id, user_list.name
								FROM user_list
								WHERE user_list.id IN (${chunk.join(',')})
							`, (row) => ({
                        id: row.user_list?.id ? String(row.user_list.id) : '',
                        name: row.user_list?.name ? String(row.user_list.name) : '',
                    }));
                    for (const r of resolved) {
                        if (!r.id)
                            continue;
                        userListMap.set(r.id, r.name || r.id);
                    }
                }
            }
            const userInterestMap = new Map();
            if (userInterestValues.length > 0) {
                const resourceNames = userInterestValues.filter((v) => v.includes('/'));
                const idValues = userInterestValues
                    .filter((v) => !v.includes('/'))
                    .map((v) => extractIdFromPossiblyPrefixed(v))
                    .filter((v) => !!v);
                if (resourceNames.length > 0) {
                    const resolved = await queryInChunks(customer, resourceNames, 200, (chunk) => `
								SELECT user_interest.resource_name, user_interest.name
								FROM user_interest
								WHERE user_interest.resource_name IN (${chunk.map((v) => `'${v}'`).join(',')})
							`, (row) => ({
                        resourceName: String(row.user_interest?.resource_name || ''),
                        name: row.user_interest?.name ? String(row.user_interest.name) : '',
                    }));
                    for (const r of resolved)
                        if (r.resourceName)
                            userInterestMap.set(r.resourceName, r.name || r.resourceName);
                }
                if (idValues.length > 0) {
                    const uniqueIds = Array.from(new Set(idValues));
                    const resolved = await queryInChunks(customer, uniqueIds, 200, (chunk) => `
								SELECT user_interest.user_interest_id, user_interest.name
								FROM user_interest
								WHERE user_interest.user_interest_id IN (${chunk.join(',')})
							`, (row) => ({
                        id: row.user_interest?.user_interest_id ? String(row.user_interest.user_interest_id) : '',
                        name: row.user_interest?.name ? String(row.user_interest.name) : '',
                    }));
                    for (const r of resolved)
                        if (r.id)
                            userInterestMap.set(r.id, r.name || r.id);
                }
            }
            const topicMap = new Map();
            if (topicConstants.length > 0) {
                const resolved = await queryInChunks(customer, topicConstants, 200, (chunk) => `
							SELECT topic_constant.resource_name, topic_constant.path
							FROM topic_constant
							WHERE topic_constant.resource_name IN (${chunk.map((v) => `'${v}'`).join(',')})
						`, (row) => ({
                    resourceName: String(row.topic_constant?.resource_name || ''),
                    path: Array.isArray(row.topic_constant?.path) ? row.topic_constant.path.map((p) => String(p)).filter(Boolean) : [],
                }));
                for (const r of resolved) {
                    if (!r.resourceName)
                        continue;
                    topicMap.set(r.resourceName, r.path.length ? r.path.join(' > ') : r.resourceName);
                }
            }
            const byType = new Map();
            const raw = results.map((r) => ({
                criterionId: r?.campaign_criterion?.criterion_id ? String(r.campaign_criterion.criterion_id) : null,
                type: r?.campaign_criterion?.type ? String(r.campaign_criterion.type) : null,
                negative: Boolean(r?.campaign_criterion?.negative),
                displayName: r?.campaign_criterion?.display_name ? String(r.campaign_criterion.display_name) : null,
                keywordText: r?.campaign_criterion?.keyword?.text ? String(r.campaign_criterion.keyword.text) : null,
                matchType: r?.campaign_criterion?.keyword?.match_type ? String(r.campaign_criterion.keyword.match_type) : null,
                location: r?.campaign_criterion?.location?.geo_target_constant ? String(r.campaign_criterion.location.geo_target_constant) : null,
                language: r?.campaign_criterion?.language?.language_constant ? String(r.campaign_criterion.language.language_constant) : null,
                ageRange: r?.campaign_criterion?.age_range?.type ? String(r.campaign_criterion.age_range.type) : null,
                gender: r?.campaign_criterion?.gender?.type ? String(r.campaign_criterion.gender.type) : null,
                userInterest: r?.campaign_criterion?.user_interest?.user_interest_category ? String(r.campaign_criterion.user_interest.user_interest_category) : null,
                userList: r?.campaign_criterion?.user_list?.user_list ? String(r.campaign_criterion.user_list.user_list) : null,
                topic: r?.campaign_criterion?.topic?.topic_constant ? String(r.campaign_criterion.topic.topic_constant) : null,
                placementUrl: r?.campaign_criterion?.placement?.url ? String(r.campaign_criterion.placement.url) : null,
            }));
            for (const row of results) {
                const typeRaw = row?.campaign_criterion?.type;
                const typeLabel = humanizeCriterionType(typeRaw);
                let name = pickCriterionDisplayName(row);
                // Override with resolved values for criteria that otherwise show opaque IDs/resource names.
                if (typeLabel === 'Language') {
                    const lc = row?.campaign_criterion?.language?.language_constant ? String(row.campaign_criterion.language.language_constant) : '';
                    name = languageMap.get(lc) || lc || name;
                }
                else if (typeLabel === 'Location') {
                    const gt = row?.campaign_criterion?.location?.geo_target_constant ? String(row.campaign_criterion.location.geo_target_constant) : '';
                    name = geoTargetMap.get(gt) || gt || name;
                }
                else if (typeLabel === 'User List') {
                    const ul = row?.campaign_criterion?.user_list?.user_list ? String(row.campaign_criterion.user_list.user_list) : '';
                    const ulId = ul && !ul.includes('/') ? (extractIdFromPossiblyPrefixed(ul) || ul) : null;
                    name = userListMap.get(ul) || (ulId ? userListMap.get(ulId) : null) || ul || name;
                }
                else if (typeLabel === 'User Interest') {
                    const ui = row?.campaign_criterion?.user_interest?.user_interest_category ? String(row.campaign_criterion.user_interest.user_interest_category) : '';
                    name = userInterestMap.get(ui) || ui || name;
                }
                else if (typeLabel === 'Topic') {
                    const tc = row?.campaign_criterion?.topic?.topic_constant ? String(row.campaign_criterion.topic.topic_constant) : '';
                    name = topicMap.get(tc) || tc || name;
                }
                // If we still can't present a meaningful value, hide numeric-only placeholders.
                if (typeLabel === 'Unknown' && name && /^\d+$/.test(String(name).trim())) {
                    continue;
                }
                if (!name)
                    continue;
                if (!byType.has(typeLabel))
                    byType.set(typeLabel, { include: new Set(), exclude: new Set() });
                const group = byType.get(typeLabel);
                if (row?.campaign_criterion?.negative)
                    group.exclude.add(name);
                else
                    group.include.add(name);
            }
            const data = Array.from(byType.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([label, sets]) => {
                const include = Array.from(sets.include).sort();
                const exclude = Array.from(sets.exclude).sort();
                const parts = [];
                if (include.length)
                    parts.push(include.join(', '));
                if (exclude.length)
                    parts.push(`Excluded: ${exclude.join(', ')}`);
                return { label, content: parts.join(' · ') };
            });
            return {
                success: true,
                data,
                debug: raw,
                meta: { total_criteria: results.length },
            };
        }
        catch (error) {
            console.error('Google Ads API get campaign targeting error:', error);
            if (error instanceof TRPCError)
                throw error;
            const errorInfo = GoogleAdsErrorHandler.handleError(error);
            throw new TRPCError({
                code: errorInfo.type === 'refresh-token' || errorInfo.type === 'permission'
                    ? 'UNAUTHORIZED'
                    : 'INTERNAL_SERVER_ERROR',
                message: errorInfo.message || (error instanceof Error ? error.message : 'Failed to fetch campaign targeting'),
            });
        }
    }),
    /**
     * Get ad group-level targeting criteria in bulk (ad_group_criterion).
     */
    getBulkAdGroupTargeting: protectedProcedure
        .input(z.object({
        customerId: z.string().min(1, 'Customer ID is required'),
        adGroupIds: z.array(z.string().min(1)).min(1, 'At least one ad group is required'),
    }))
        .query(async ({ input, ctx }) => {
        try {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User session not found' });
            }
            const integration = await getUserGoogleAdsIntegration(userId);
            const customerIdWithoutDashes = input.customerId.replace(/-/g, '');
            const client = createGoogleAdsClient({
                developerToken: getGoogleAdsDeveloperToken(),
                clientId: getGoogleAdsClientId(),
                clientSecret: getGoogleAdsClientSecret(),
                refreshToken: integration.refreshToken,
            });
            const customer = getCustomerInstance(client, customerIdWithoutDashes, integration.refreshToken);
            const idsClause = input.adGroupIds.map((id) => Number(id)).filter((n) => Number.isFinite(n));
            if (idsClause.length === 0) {
                return { success: true, data: {}, meta: { total_ad_groups: 0, total_criteria: 0 } };
            }
            const query = `
					SELECT
						ad_group.id,
						ad_group_criterion.criterion_id,
						ad_group_criterion.type,
						ad_group_criterion.negative,
						ad_group_criterion.status,
						ad_group_criterion.display_name,
						ad_group_criterion.keyword.text,
						ad_group_criterion.keyword.match_type,
						ad_group_criterion.location.geo_target_constant,
						ad_group_criterion.language.language_constant,
						ad_group_criterion.age_range.type,
						ad_group_criterion.gender.type,
						ad_group_criterion.user_interest.user_interest_category,
						ad_group_criterion.user_list.user_list,
						ad_group_criterion.topic.topic_constant,
						ad_group_criterion.placement.url
					FROM ad_group_criterion
					WHERE ad_group.id IN (${idsClause.join(',')})
					  AND ad_group_criterion.status != 'REMOVED'
					ORDER BY ad_group.id, ad_group_criterion.type
				`;
            const results = (await customer.query(query));
            // Resolve shared constants once for the whole bulk response.
            const languageConstants = uniqueStrings(results.map((r) => r?.ad_group_criterion?.language?.language_constant ? String(r.ad_group_criterion.language.language_constant) : null));
            const geoTargets = uniqueStrings(results.map((r) => r?.ad_group_criterion?.location?.geo_target_constant ? String(r.ad_group_criterion.location.geo_target_constant) : null));
            const userListValues = uniqueStrings(results.map((r) => r?.ad_group_criterion?.user_list?.user_list ? String(r.ad_group_criterion.user_list.user_list) : null));
            const userInterestValues = uniqueStrings(results.map((r) => r?.ad_group_criterion?.user_interest?.user_interest_category ? String(r.ad_group_criterion.user_interest.user_interest_category) : null));
            const topicConstants = uniqueStrings(results.map((r) => r?.ad_group_criterion?.topic?.topic_constant ? String(r.ad_group_criterion.topic.topic_constant) : null));
            const languageMap = new Map();
            if (languageConstants.length > 0) {
                const resolved = await queryInChunks(customer, languageConstants, 200, (chunk) => `
							SELECT language_constant.resource_name, language_constant.code, language_constant.name
							FROM language_constant
							WHERE language_constant.resource_name IN (${chunk.map((v) => `'${v}'`).join(',')})
						`, (row) => ({
                    resourceName: String(row.language_constant?.resource_name || ''),
                    code: row.language_constant?.code ? String(row.language_constant.code) : '',
                    name: row.language_constant?.name ? String(row.language_constant.name) : '',
                }));
                for (const r of resolved)
                    if (r.resourceName)
                        languageMap.set(r.resourceName, r.code || r.name || r.resourceName);
            }
            const geoTargetMap = new Map();
            if (geoTargets.length > 0) {
                const resolved = await queryInChunks(customer, geoTargets, 200, (chunk) => `
							SELECT geo_target_constant.resource_name, geo_target_constant.name, geo_target_constant.target_type, geo_target_constant.country_code
							FROM geo_target_constant
							WHERE geo_target_constant.resource_name IN (${chunk.map((v) => `'${v}'`).join(',')})
						`, (row) => ({
                    resourceName: String(row.geo_target_constant?.resource_name || ''),
                    name: row.geo_target_constant?.name ? String(row.geo_target_constant.name) : '',
                    countryCode: row.geo_target_constant?.country_code ? String(row.geo_target_constant.country_code) : '',
                }));
                for (const r of resolved) {
                    if (!r.resourceName)
                        continue;
                    const suffix = r.countryCode ? ` (${r.countryCode})` : '';
                    geoTargetMap.set(r.resourceName, (r.name || r.resourceName) + suffix);
                }
            }
            const userListMap = new Map();
            {
                const resourceNames = userListValues.filter((v) => v.includes('/'));
                const idValues = userListValues
                    .filter((v) => !v.includes('/'))
                    .map((v) => extractIdFromPossiblyPrefixed(v))
                    .filter((v) => !!v);
                if (resourceNames.length > 0) {
                    const resolved = await queryInChunks(customer, resourceNames, 200, (chunk) => `
								SELECT user_list.resource_name, user_list.name
								FROM user_list
								WHERE user_list.resource_name IN (${chunk.map((v) => `'${v}'`).join(',')})
							`, (row) => ({
                        resourceName: String(row.user_list?.resource_name || ''),
                        name: row.user_list?.name ? String(row.user_list.name) : '',
                    }));
                    for (const r of resolved)
                        if (r.resourceName)
                            userListMap.set(r.resourceName, r.name || r.resourceName);
                }
                if (idValues.length > 0) {
                    const uniqueIds = Array.from(new Set(idValues));
                    const resolved = await queryInChunks(customer, uniqueIds, 200, (chunk) => `
								SELECT user_list.id, user_list.name
								FROM user_list
								WHERE user_list.id IN (${chunk.join(',')})
							`, (row) => ({
                        id: row.user_list?.id ? String(row.user_list.id) : '',
                        name: row.user_list?.name ? String(row.user_list.name) : '',
                    }));
                    for (const r of resolved)
                        if (r.id)
                            userListMap.set(r.id, r.name || r.id);
                }
            }
            const userInterestMap = new Map();
            if (userInterestValues.length > 0) {
                const resourceNames = userInterestValues.filter((v) => v.includes('/'));
                const idValues = userInterestValues
                    .filter((v) => !v.includes('/'))
                    .map((v) => extractIdFromPossiblyPrefixed(v))
                    .filter((v) => !!v);
                if (resourceNames.length > 0) {
                    const resolved = await queryInChunks(customer, resourceNames, 200, (chunk) => `
								SELECT user_interest.resource_name, user_interest.name
								FROM user_interest
								WHERE user_interest.resource_name IN (${chunk.map((v) => `'${v}'`).join(',')})
							`, (row) => ({
                        resourceName: String(row.user_interest?.resource_name || ''),
                        name: row.user_interest?.name ? String(row.user_interest.name) : '',
                    }));
                    for (const r of resolved)
                        if (r.resourceName)
                            userInterestMap.set(r.resourceName, r.name || r.resourceName);
                }
                if (idValues.length > 0) {
                    const uniqueIds = Array.from(new Set(idValues));
                    const resolved = await queryInChunks(customer, uniqueIds, 200, (chunk) => `
								SELECT user_interest.user_interest_id, user_interest.name
								FROM user_interest
								WHERE user_interest.user_interest_id IN (${chunk.join(',')})
							`, (row) => ({
                        id: row.user_interest?.user_interest_id ? String(row.user_interest.user_interest_id) : '',
                        name: row.user_interest?.name ? String(row.user_interest.name) : '',
                    }));
                    for (const r of resolved)
                        if (r.id)
                            userInterestMap.set(r.id, r.name || r.id);
                }
            }
            const topicMap = new Map();
            if (topicConstants.length > 0) {
                const resolved = await queryInChunks(customer, topicConstants, 200, (chunk) => `
							SELECT topic_constant.resource_name, topic_constant.path
							FROM topic_constant
							WHERE topic_constant.resource_name IN (${chunk.map((v) => `'${v}'`).join(',')})
						`, (row) => ({
                    resourceName: String(row.topic_constant?.resource_name || ''),
                    path: Array.isArray(row.topic_constant?.path) ? row.topic_constant.path.map((p) => String(p)).filter(Boolean) : [],
                }));
                for (const r of resolved)
                    if (r.resourceName)
                        topicMap.set(r.resourceName, r.path.length ? r.path.join(' > ') : r.resourceName);
            }
            const byAdGroup = {};
            for (const row of results) {
                const adGroupId = row?.ad_group?.id ? String(row.ad_group.id) : null;
                if (!adGroupId)
                    continue;
                if (!byAdGroup[adGroupId])
                    byAdGroup[adGroupId] = { byType: new Map(), raw: [] };
                byAdGroup[adGroupId].raw.push({
                    criterionId: row?.ad_group_criterion?.criterion_id ? String(row.ad_group_criterion.criterion_id) : null,
                    type: row?.ad_group_criterion?.type ? String(row.ad_group_criterion.type) : null,
                    negative: Boolean(row?.ad_group_criterion?.negative),
                    displayName: row?.ad_group_criterion?.display_name ? String(row.ad_group_criterion.display_name) : null,
                    keywordText: row?.ad_group_criterion?.keyword?.text ? String(row.ad_group_criterion.keyword.text) : null,
                    matchType: row?.ad_group_criterion?.keyword?.match_type ? String(row.ad_group_criterion.keyword.match_type) : null,
                    location: row?.ad_group_criterion?.location?.geo_target_constant ? String(row.ad_group_criterion.location.geo_target_constant) : null,
                    language: row?.ad_group_criterion?.language?.language_constant ? String(row.ad_group_criterion.language.language_constant) : null,
                    ageRange: row?.ad_group_criterion?.age_range?.type ? String(row.ad_group_criterion.age_range.type) : null,
                    gender: row?.ad_group_criterion?.gender?.type ? String(row.ad_group_criterion.gender.type) : null,
                    userInterest: row?.ad_group_criterion?.user_interest?.user_interest_category ? String(row.ad_group_criterion.user_interest.user_interest_category) : null,
                    userList: row?.ad_group_criterion?.user_list?.user_list ? String(row.ad_group_criterion.user_list.user_list) : null,
                    topic: row?.ad_group_criterion?.topic?.topic_constant ? String(row.ad_group_criterion.topic.topic_constant) : null,
                    placementUrl: row?.ad_group_criterion?.placement?.url ? String(row.ad_group_criterion.placement.url) : null,
                });
                const typeLabel = humanizeCriterionType(row?.ad_group_criterion?.type);
                let name = pickCriterionDisplayName(row);
                if (typeLabel === 'Language') {
                    const lc = row?.ad_group_criterion?.language?.language_constant ? String(row.ad_group_criterion.language.language_constant) : '';
                    name = languageMap.get(lc) || lc || name;
                }
                else if (typeLabel === 'Location') {
                    const gt = row?.ad_group_criterion?.location?.geo_target_constant ? String(row.ad_group_criterion.location.geo_target_constant) : '';
                    name = geoTargetMap.get(gt) || gt || name;
                }
                else if (typeLabel === 'User List') {
                    const ul = row?.ad_group_criterion?.user_list?.user_list ? String(row.ad_group_criterion.user_list.user_list) : '';
                    const ulId = ul && !ul.includes('/') ? (extractIdFromPossiblyPrefixed(ul) || ul) : null;
                    name = userListMap.get(ul) || (ulId ? userListMap.get(ulId) : null) || ul || name;
                }
                else if (typeLabel === 'User Interest') {
                    const ui = row?.ad_group_criterion?.user_interest?.user_interest_category ? String(row.ad_group_criterion.user_interest.user_interest_category) : '';
                    name = userInterestMap.get(ui) || ui || name;
                }
                else if (typeLabel === 'Topic') {
                    const tc = row?.ad_group_criterion?.topic?.topic_constant ? String(row.ad_group_criterion.topic.topic_constant) : '';
                    name = topicMap.get(tc) || tc || name;
                }
                // If we still can't present a meaningful value, hide numeric-only placeholders.
                if (typeLabel === 'Unknown' && name && /^\d+$/.test(String(name).trim())) {
                    continue;
                }
                if (!name)
                    continue;
                const typeMap = byAdGroup[adGroupId].byType;
                if (!typeMap.has(typeLabel))
                    typeMap.set(typeLabel, { include: new Set(), exclude: new Set() });
                const sets = typeMap.get(typeLabel);
                if (row?.ad_group_criterion?.negative)
                    sets.exclude.add(name);
                else
                    sets.include.add(name);
            }
            const data = {};
            for (const [adGroupId, entry] of Object.entries(byAdGroup)) {
                const rows = Array.from(entry.byType.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([label, sets]) => {
                    const include = Array.from(sets.include).sort();
                    const exclude = Array.from(sets.exclude).sort();
                    const parts = [];
                    if (include.length)
                        parts.push(include.join(', '));
                    if (exclude.length)
                        parts.push(`Excluded: ${exclude.join(', ')}`);
                    return { label, content: parts.join(' · ') };
                });
                data[adGroupId] = { data: rows, debug: entry.raw };
            }
            return {
                success: true,
                data,
                meta: { total_ad_groups: Object.keys(data).length, total_criteria: results.length },
            };
        }
        catch (error) {
            console.error('Google Ads API bulk ad group targeting error:', error);
            if (error instanceof TRPCError)
                throw error;
            const errorInfo = GoogleAdsErrorHandler.handleError(error);
            throw new TRPCError({
                code: errorInfo.type === 'refresh-token' || errorInfo.type === 'permission'
                    ? 'UNAUTHORIZED'
                    : 'INTERNAL_SERVER_ERROR',
                message: errorInfo.message || (error instanceof Error ? error.message : 'Failed to fetch ad group targeting'),
            });
        }
    }),
});
