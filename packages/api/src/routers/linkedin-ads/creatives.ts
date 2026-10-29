import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../trpc';
import { LinkedInAdsClient } from '../../lib/linkedin-ads-client';
import { getStoredLinkedInAccessTokenForSession } from '../../lib/linkedin-credentials';

/**
 * Get user's LinkedIn integration with valid tokens
 */
async function getUserIntegration(userId: string, role?: string | null) {
	const tokenData = await getStoredLinkedInAccessTokenForSession({ userId, role });

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

export const linkedInAdsCreativesRouter = router({
	listAccountCreatives: protectedProcedure
		.input(
			z.object({
				accountId: z.string().min(1, 'Account ID is required'),
				pageSize: z.number().int().positive().max(100).optional(),
				pageToken: z.string().optional(),
				campaignIds: z.array(z.string().min(1)).optional(),
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
				const client = new LinkedInAdsClient({ accessToken });
				const response = await client.getAccountCreatives(input.accountId, {
					pageSize: input.pageSize,
					pageToken: input.pageToken,
				});

				let elements = response.elements || [];
				if (input.campaignIds && input.campaignIds.length > 0) {
					const campaignUrns = new Set(
						input.campaignIds.map((id) =>
							id.startsWith('urn:li:sponsoredCampaign:') ? id : `urn:li:sponsoredCampaign:${id}`
						)
					);
					elements = elements.filter((creative: any) => campaignUrns.has(String(creative.campaign || '')));
				}

				const data = elements.map((creative: any) => ({
					id: creative.id || null,
					name: creative.name || null,
					campaign: creative.campaign || null,
					account: creative.account || null,
					intendedStatus: normalizeStatusLabel(creative.intendedStatus || null),
					reviewStatus: normalizeStatusLabel(creative.review?.status || null),
					isServing: Boolean(creative.isServing),
					servingHoldReasons: normalizeStatusArray(creative.servingHoldReasons),
					contentReference: creative.content?.reference || null,
					inlineContent: creative.inlineContent || null,
					leadgenCallToAction: creative.leadgenCallToAction
						? {
								label: normalizeStatusLabel(creative.leadgenCallToAction.label || null),
								destination: creative.leadgenCallToAction.destination || null,
						  }
						: null,
					createdAt: creative.createdAt || null,
					lastModifiedAt: creative.lastModifiedAt || null,
				}));

				return {
					success: true,
					data,
					meta: {
						retrieved_at: new Date().toISOString(),
						total_creatives: data.length,
						nextPageToken: response.metadata?.nextPageToken ?? null,
					},
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error instanceof Error ? error.message : 'Failed to list account creatives',
				});
			}
		}),

	getCreativeInsights: protectedProcedure
		.input(
			z.object({
				accountId: z.string().min(1, 'Account ID is required'),
				creativeIds: z.array(z.string().min(1)).min(1).max(100),
				timeRange: z.object({
					since: z.string().min(1),
					until: z.string().min(1),
				}),
			})
		)
		.query(async ({ input, ctx }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User session not found' });

			const { accessToken } = await getUserIntegration(userId, ctx.session?.user?.role);
			const client = new LinkedInAdsClient({ accessToken });

			const startDate = new Date(input.timeRange.since);
			const endDate = new Date(input.timeRange.until);

			// One bulk adAnalytics request pivoted by CREATIVE (per LinkedIn docs).
			const analytics = await client.getAnalytics({
				dateRange: { start: formatDateForLinkedIn(startDate), end: formatDateForLinkedIn(endDate) },
				accounts: [input.accountId],
				creatives: input.creativeIds,
				fields: [
					// Critical: pivotValues must be requested to map results back to each creative.
					'pivotValues',
					'impressions',
					'clicks',
					'costInLocalCurrency',
					'externalWebsiteConversions',
					'oneClickLeads',
					'videoViews',
					'videoCompletions',
				],
			});

			const insightsByCreativeId: Record<string, any> = {};

			for (const elem of analytics.elements || []) {
				const pivotUrn = Array.isArray((elem as any).pivotValues) ? (elem as any).pivotValues[0] : undefined;
				const pivotUrnStr = pivotUrn ? String(pivotUrn) : '';
				const creativeId = pivotUrnStr ? pivotUrnStr.split(':').pop() : null;
				if (!creativeId) continue;

				const acc = insightsByCreativeId[creativeId] || {
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

				// Store under BOTH keys so the UI can lookup by URN or numeric id.
				insightsByCreativeId[creativeId] = acc;
				if (pivotUrnStr) insightsByCreativeId[pivotUrnStr] = acc;
			}

			// Derived metrics
			for (const [id, acc] of Object.entries(insightsByCreativeId)) {
				const clicks = Number((acc as any).clicks || 0);
				const impressions = Number((acc as any).impressions || 0);
				const spend = Number((acc as any).costInLocalCurrency || 0);
				(insightsByCreativeId as any)[id] = {
					...acc,
					spend,
					cpc: clicks > 0 ? String(spend / clicks) : null,
					ctr: impressions > 0 ? String((clicks / impressions) * 100) : null,
				};
			}

			return {
				success: true,
				data: insightsByCreativeId,
				meta: {
					retrieved_at: new Date().toISOString(),
					requested_creatives: input.creativeIds.length,
					resolved_creatives: Object.keys(insightsByCreativeId).length,
				},
			};
		}),

	getCreativePreview: protectedProcedure
		.input(
			z.object({
				accountId: z.string().min(1, 'Account ID is required'),
				creativeId: z.string().min(1, 'Creative ID is required'),
				livePreviewCreative: z
					.object({
						campaign: z.string().min(1),
						intendedStatus: z.string().optional(),
						contentReference: z.string().optional(),
						inlineContent: z.record(z.any()).optional(),
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
				const client = new LinkedInAdsClient({ accessToken });
				let response = await client.getCreativePreviews(input.accountId, input.creativeId);
				const accuratePreviewUnsupported = Boolean(response.unsupportedCreativeType);
				let previewSource: 'accurate' | 'live_action' | 'none' = response.elements?.length ? 'accurate' : 'none';

				if (
					(response.elements || []).length === 0 &&
					input.livePreviewCreative?.campaign &&
					(input.livePreviewCreative.contentReference || input.livePreviewCreative.inlineContent)
				) {
					try {
						const liveResponse = await client.getLiveCreativePreviews({
							campaign: input.livePreviewCreative.campaign,
							intendedStatus: input.livePreviewCreative.intendedStatus,
							content: input.livePreviewCreative.contentReference
								? { reference: input.livePreviewCreative.contentReference }
								: undefined,
							inlineContent: input.livePreviewCreative.inlineContent,
						});
						if ((liveResponse.elements || []).length > 0) {
							response = liveResponse as any;
							previewSource = 'live_action';
						}
						if ((liveResponse as any).notImplemented) {
							previewSource = 'none';
						}
					} catch {
						// Keep accurate-preview response if live fallback fails.
					}
				}

				const data = (response.elements || []).map((element: any) => ({
					preview: element.preview || null,
					creative: element.creative || null,
					placement: element.placement || null,
				}));

				return {
					success: true,
					data,
					meta: {
						retrieved_at: new Date().toISOString(),
						total_previews: data.length,
						previewSource,
						unsupportedCreativeType: accuratePreviewUnsupported,
						message:
							accuratePreviewUnsupported && (data.length === 0)
								? 'Preview is not supported for this creative type (accurate preview unsupported; live preview may be unavailable for this content).'
								: undefined,
					},
				};
			} catch (error: any) {
				const status =
					error?.status ?? error?.statusCode ?? error?.cause?.status ?? error?.cause?.statusCode;
				const message = String(error?.message || error?.userMessage || error?.cause?.message || '');
				const code = String(error?.code || error?.errorCode || error?.cause?.code || '');
				if (
					status === 422 ||
					code === 'UNSUPPORTED_CREATIVE_TYPE' ||
					message.includes('Unsupported Creative Type')
				) {
					return {
						success: true,
						data: [],
						meta: {
							retrieved_at: new Date().toISOString(),
							total_previews: 0,
							unsupportedCreativeType: true,
							message: 'Preview is not supported for this creative type.',
						},
					};
				}

				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error instanceof Error ? error.message : 'Failed to fetch creative preview',
				});
			}
		}),

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

				const { accessToken } = await getUserIntegration(userId, ctx.session?.user?.role);

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
				accountId: z.string().min(1, 'Account ID is required'),
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

				const { accessToken } = await getUserIntegration(userId, ctx.session?.user?.role);

				// Create LinkedIn Ads client
				const client = new LinkedInAdsClient({ accessToken });

				// Get creative details directly from LinkedIn API
				const creativeDetails = await client.getCreativeDetails(input.creativeId, input.accountId);

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

