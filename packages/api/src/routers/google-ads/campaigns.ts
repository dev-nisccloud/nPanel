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

			// Update integration object for return
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
function formatDateForGoogleAds(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}${month}${day}`;
}

export const googleAdsCampaignsRouter = router({
	/**
	 * List campaigns for a specific Google Ads customer account
	 * Uses GAQL (Google Ads Query Language) to fetch campaigns with metrics
	 */
	listCampaigns: protectedProcedure
		.input(
			z.object({
				customerId: z.string().min(1, 'Customer ID is required'),
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

				const integration = await getUserIntegration(userId);

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
						campaign.start_date,
						campaign.end_date,
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
				const campaignsMap = new Map<
					string,
					{
						id: string;
						name: string;
						status: string;
						advertising_channel_type?: string;
						advertising_channel_sub_type?: string;
						start_date?: string;
						end_date?: string;
						bidding_strategy_type?: string;
						budget_amount_micros?: string;
						budget_period?: string;
						metrics: {
							impressions: number;
							clicks: number;
							cost_micros: number;
							ctr?: number;
							average_cpc_micros?: number;
							conversions?: number;
							cost_per_conversion_micros?: number;
							conversion_rate?: number;
							search_impression_share?: number;
							search_rank_lost_impression_share?: number;
						};
					}
				>();

				// Process results and aggregate metrics
				for (const row of results as any[]) {
					const campaignId = String(row.campaign?.id || '');
					if (!campaignId) continue;

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

					const campaign = campaignsMap.get(campaignId)!;

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
							campaign.metrics.cost_per_conversion_micros = Number(
								row.metrics.cost_per_conversion || 0
							);
						}
						if (row.metrics.search_impression_share !== undefined && Number(row.metrics.search_impression_share || 0) > 0) {
							campaign.metrics.search_impression_share = Number(
								row.metrics.search_impression_share || 0
							);
						}
						if (row.metrics.search_rank_lost_impression_share !== undefined && Number(row.metrics.search_rank_lost_impression_share || 0) > 0) {
							campaign.metrics.search_rank_lost_impression_share = Number(
								row.metrics.search_rank_lost_impression_share || 0
							);
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
							search_impression_share:
								campaign.metrics.search_impression_share && campaign.metrics.search_impression_share > 0
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
			} catch (error) {
				console.error('Google Ads API list campaigns error:', error);

				if (error instanceof TRPCError) {
					throw error;
				}

				const errorInfo = GoogleAdsErrorHandler.handleError(error);
				throw new TRPCError({
					code:
						errorInfo.type === 'refresh-token' || errorInfo.type === 'permission'
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
		.input(
			z.object({
				customerId: z.string().min(1, 'Customer ID is required'),
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

				const integration = await getUserIntegration(userId);

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
				const customer = getCustomerInstance(
					client,
					customerIdWithoutDashes,
					integration.refreshToken
				);

				// Query campaign details
				const query = `
					SELECT
						campaign.id,
						campaign.name,
						campaign.status,
						campaign.advertising_channel_type,
						campaign.advertising_channel_sub_type,
						campaign.start_date,
						campaign.end_date,
						campaign.bidding_strategy_type,
						campaign_budget.amount_micros,
						campaign_budget.period
					FROM campaign
					WHERE campaign.id = ${input.campaignId}
				`;

				const results = await customer.query(query);

				if (!results || (results as any[]).length === 0) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: `Campaign ${input.campaignId} not found`,
					});
				}

				const campaignData = (results as any[])[0];
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
			} catch (error) {
				console.error('Google Ads API get campaign details error:', error);

				if (error instanceof TRPCError) {
					throw error;
				}

				const errorInfo = GoogleAdsErrorHandler.handleError(error);
				throw new TRPCError({
					code:
						errorInfo.type === 'refresh-token' || errorInfo.type === 'permission'
							? 'UNAUTHORIZED'
							: 'INTERNAL_SERVER_ERROR',
					message:
						errorInfo.message || (error instanceof Error ? error.message : 'Failed to get campaign details'),
				});
			}
		}),
});

