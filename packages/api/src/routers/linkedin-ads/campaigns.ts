import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { request } from 'undici';
import { router, protectedProcedure } from '../../trpc';
import { LinkedInAdsClient } from '../../lib/linkedin-ads-client';
import { getStoredLinkedInAccessTokenForSession } from '../../lib/linkedin-credentials';

// ---------------------------------------------------------------------------
// Targeting resolution helpers
// ---------------------------------------------------------------------------

const LI_V2_BASE = 'https://api.linkedin.com';
const LI_VERSION = process.env.LINKEDIN_MARKETING_API_VERSION || process.env.LINKEDIN_API_VERSION || '202603';

function liHeaders(accessToken: string) {
	return {
		Authorization: `Bearer ${accessToken}`,
		'LinkedIn-Version': LI_VERSION,
		'X-Restli-Protocol-Version': '2.0.0',
	};
}

interface ApiCallDebug {
	url: string;
	statusCode: number;
	rawResponse: string;
	resolvedCount: number;
}

/** BATCH_GET  /v2/{endpoint}?ids=List(id1,id2,…)  → { names, debug } (REST.li 2.0.0 format)
 *  IMPORTANT: List() syntax must NOT be URL-encoded   append as raw string, not via URLSearchParams */
async function batchGetNames(
	accessToken: string,
	endpoint: string,
	ids: string[],
	nameExtractor: (entity: any) => string,
	extraParams: Record<string, string> = {},
): Promise<{ names: Record<string, string>; debug: ApiCallDebug }> {
	const emptyDebug = (url: string, statusCode: number, rawResponse: string): ApiCallDebug =>
		({ url, statusCode, rawResponse, resolvedCount: 0 });

	if (ids.length === 0) return { names: {}, debug: emptyDebug(endpoint, 0, 'no ids') };

	// Build base URL with any extra params via URLSearchParams (safe to encode),
	// then append ids=List(...) as a raw string so parentheses/commas stay literal.
	const base = new URL(`${LI_V2_BASE}${endpoint}`);
	for (const [k, v] of Object.entries(extraParams)) base.searchParams.set(k, v);
	const rawIds = `ids=List(${ids.slice(0, 100).join(',')})`;
	const urlStr = base.toString() + (base.search ? '&' : '?') + rawIds;

	try {
		const { statusCode, body } = await request(urlStr, { method: 'GET', headers: liHeaders(accessToken) });
		const text = await body.text();
		if (statusCode >= 400) return { names: {}, debug: emptyDebug(urlStr, statusCode, text) };
		const data = JSON.parse(text);
		const names: Record<string, string> = {};
		for (const [id, entity] of Object.entries(data?.results || {})) {
			const name = nameExtractor(entity as any);
			if (name) names[String(id)] = name;
		}
		return { names, debug: { url: urlStr, statusCode, rawResponse: text, resolvedCount: Object.keys(names).length } };
	} catch (e: any) {
		return { names: {}, debug: emptyDebug(urlStr, 0, String(e?.message || e)) };
	}
}

/** GET_ALL  /v2/{endpoint}?count=100  → { names, debug } (for small finite sets) */
async function getAllNames(
	accessToken: string,
	endpoint: string,
	nameExtractor: (entity: any) => string,
	extraParams: Record<string, string> = {},
): Promise<{ names: Record<string, string>; debug: ApiCallDebug }> {
	const url = new URL(`${LI_V2_BASE}${endpoint}`);
	url.searchParams.set('count', '100');
	for (const [k, v] of Object.entries(extraParams)) url.searchParams.set(k, v);
	const urlStr = url.toString();

	try {
		const { statusCode, body } = await request(urlStr, { method: 'GET', headers: liHeaders(accessToken) });
		const text = await body.text();
		if (statusCode >= 400) return { names: {}, debug: { url: urlStr, statusCode, rawResponse: text, resolvedCount: 0 } };
		const data = JSON.parse(text);
		const names: Record<string, string> = {};
		for (const entity of (data?.elements || [])) {
			const name = nameExtractor(entity);
			if (name && entity.id !== undefined) names[String(entity.id)] = name;
		}
		return { names, debug: { url: urlStr, statusCode, rawResponse: text, resolvedCount: Object.keys(names).length } };
	} catch (e: any) {
		return { names: {}, debug: { url: urlStr, statusCode: 0, rawResponse: String(e?.message || e), resolvedCount: 0 } };
	}
}

/** Extract the name from a standard MultiLocaleString entity */
function multiLocaleName(entity: any): string {
	const loc = entity?.name?.localized;
	if (!loc) return '';
	return loc.en_US ?? loc[Object.keys(loc)[0]] ?? '';
}

function adTargetingEntityName(entity: any): string {
	// LinkedIn REST resources vary by version; sometimes `name` is a string, sometimes multi-locale.
	if (!entity) return '';
	if (typeof entity.name === 'string') return entity.name;
	const ml = multiLocaleName(entity);
	if (ml) return ml;
	// Some responses nest `name` differently.
	if (typeof entity?.localizedName === 'string') return entity.localizedName;
	return '';
}

async function fetchAdTargetingEntitiesByUrns(accessToken: string, urnsListRawParam: string) {
	// Docs (li-lms-2026-03): URN-to-name resolver uses REST endpoint:
	// GET /rest/adTargetingEntities?q=urns&queryVersion=QUERY_USES_URNS&urns=List(<encoded URNs>)&locale=(language:en,country:US)
	const baseUrl = new URL(`${LI_V2_BASE}/rest/adTargetingEntities`);
	baseUrl.searchParams.set('q', 'urns');
	baseUrl.searchParams.set('queryVersion', 'QUERY_USES_URNS');
	// Important: keep List() syntax, but URL-encode EACH URN inside the list.
	// LinkedIn docs show e.g. urn%3Ali%3Ageo%3A102095887 inside List(...).
	const urlStr = baseUrl.toString() + `&${urnsListRawParam}` + `&locale=(language:en,country:US)`;

	try {
		const { statusCode, body } = await request(urlStr, { method: 'GET', headers: liHeaders(accessToken) });
		const text = await body.text();
		return { url: urlStr, statusCode, text };
	} catch (e: any) {
		return { url: urlStr, statusCode: 0, text: String(e?.message || e) };
	}
}

async function batchGetGeoNames(accessToken: string, geoIds: string[]) {
	// Docs (standardized-data/locations/geo): BATCH GET
	// GET https://api.linkedin.com/v2/geo?ids=List(12345,23456)&locale=(language:en,country:US)
	const emptyDebug = (url: string, statusCode: number, rawResponse: string): ApiCallDebug =>
		({ url, statusCode, rawResponse, resolvedCount: 0 });

	if (geoIds.length === 0) return { names: {}, debug: emptyDebug('/v2/geo', 0, 'no ids') };

	const base = new URL(`${LI_V2_BASE}/v2/geo`);
	// Append ids=List(...) raw (do NOT encode parentheses/commas)
	const rawIds = `ids=List(${geoIds.slice(0, 100).join(',')})`;
	const urlStr = base.toString() + `?${rawIds}&locale=(language:en,country:US)`;

	try {
		const { statusCode, body } = await request(urlStr, { method: 'GET', headers: liHeaders(accessToken) });
		const text = await body.text();
		if (statusCode >= 400) return { names: {}, debug: emptyDebug(urlStr, statusCode, text) };
		const data = JSON.parse(text);
		const names: Record<string, string> = {};
		for (const [id, entity] of Object.entries(data?.results || {})) {
			const val = (entity as any)?.defaultLocalizedName?.value;
			if (val) names[String(id)] = String(val);
		}
		return { names, debug: { url: urlStr, statusCode, rawResponse: text, resolvedCount: Object.keys(names).length } };
	} catch (e: any) {
		return { names: {}, debug: emptyDebug(urlStr, 0, String(e?.message || e)) };
	}
}

/** Facets whose values can be decoded purely from the URN   no API needed */
function parseInlineFacet(facetKey: string, urns: string[]): string[] {
	return urns.map(urn => {
		const colonIdx = urn.indexOf(':(');
		const id = colonIdx !== -1 ? urn.slice(colonIdx + 1) : String(urn).split(':').pop() || urn;
		switch (facetKey) {
			case 'interfaceLocales': {
				const parts = id.split('_');
				if (parts.length !== 2) return id;
				const langMap: Record<string, string> = {
					en: 'English', es: 'Spanish', fr: 'French', de: 'German',
					pt: 'Portuguese', it: 'Italian', zh: 'Chinese', ja: 'Japanese',
					ko: 'Korean', ar: 'Arabic', ru: 'Russian', nl: 'Dutch',
					sv: 'Swedish', da: 'Danish', fi: 'Finnish', nb: 'Norwegian',
					pl: 'Polish', tr: 'Turkish', id: 'Indonesian', ms: 'Malay',
				};
				return `${langMap[parts[0].toLowerCase()] || parts[0].toUpperCase()} (${parts[1]})`;
			}
			case 'genders': {
				const map: Record<string, string> = { MALE: 'Male', FEMALE: 'Female' };
				return map[id.toUpperCase()] ?? id;
			}
			case 'ageRanges': {
				const m = id.match(/^\((\d+),(\d+)\)$/);
				if (!m) return id;
				return parseInt(m[2], 10) >= 2_000_000_000 ? `${m[1]}+ yrs` : `${m[1]}–${m[2]} yrs`;
			}
			case 'staffCountRanges': {
				const m = id.match(/^\((\d+),(\d+)\)$/);
				if (!m) return id;
				const lo = parseInt(m[1], 10), hi = parseInt(m[2], 10);
				if (lo === hi) return `${lo.toLocaleString()} employee${lo === 1 ? '' : 's'}`;
				return hi >= 2_000_000_000 ? `${lo.toLocaleString()}+ employees` : `${lo.toLocaleString()}–${hi.toLocaleString()} employees`;
			}
			case 'growthRate': {
				const m = id.match(/^\((-?\d+),(-?\d+)\)$/);
				if (!m) return id;
				const lo = parseInt(m[1], 10), hi = parseInt(m[2], 10);
				if (lo <= -2_000_000_000) return `Declining (<${hi}%)`;
				if (hi >= 2_000_000_000) return `High growth (>${lo}%)`;
				return `${lo}–${hi}% growth`;
			}
			case 'yearsOfExperienceRanges': {
				const n = parseInt(id, 10);
				return isNaN(n) ? id : n >= 12 ? '12+ yrs experience' : `${n}+ yrs experience`;
			}
			default: return id;
		}
	});
}

const TARGETING_FACET_LABELS: Record<string, string> = {
	industries: 'Industries', companyIndustry: 'Company Industries',
	seniorities: 'Seniorities', titles: 'Job Titles',
	locations: 'Locations', profileLocations: 'Profile Locations',
	interfaceLocales: 'Languages', jobFunctions: 'Job Functions', functions: 'Job Functions',
	employers: 'Employers', employersAll: 'Employers (All)', employersPast: 'Past Employers',
	skills: 'Skills', groups: 'LinkedIn Groups', degrees: 'Degrees',
	fieldsOfStudy: 'Fields of Study', schools: 'Schools',
	ageRanges: 'Age Ranges', genders: 'Genders',
	yearsOfExperienceRanges: 'Years of Experience', staffCountRanges: 'Company Size',
	memberInterests: 'Interests', memberTraits: 'Member Traits',
	memberBehaviors: 'Member Behaviors', growthRate: 'Company Growth Rate',
	followedCompanies: 'Followed Companies',
	firstDegreeConnectionCompanies: '1st-Degree Connection Companies',
	buyerGroups: 'Buyer Groups',
};

const PARSEABLE_FACETS = new Set([
	'interfaceLocales', 'genders', 'ageRanges', 'staffCountRanges', 'growthRate', 'yearsOfExperienceRanges',
]);

const BATCH_GET_CONFIG: Record<string, { endpoint: string; nameExtractor: (e: any) => string; extraParams: Record<string, string> }> = {
	// No locale params   the /v2 standardized endpoints reject them (403 ACCESS_DENIED for locale.*)
	industries:     { endpoint: '/v2/industries',    nameExtractor: multiLocaleName, extraParams: {} },
	companyIndustry:{ endpoint: '/v2/industries',    nameExtractor: multiLocaleName, extraParams: {} },
	titles:         { endpoint: '/v2/titles',         nameExtractor: multiLocaleName, extraParams: {} },
	skills:         { endpoint: '/v2/skills',         nameExtractor: (e) => e?.standardizedName ?? multiLocaleName(e), extraParams: {} },
	degrees:        { endpoint: '/v2/degrees',        nameExtractor: multiLocaleName, extraParams: {} },
	fieldsOfStudy:  { endpoint: '/v2/fieldsOfStudy', nameExtractor: multiLocaleName, extraParams: {} },
};

const GET_ALL_CONFIG: Record<string, { endpoint: string; extraParams: Record<string, string> }> = {
	// No locale params   seniorities explicitly rejects locale.language / locale.country
	seniorities: { endpoint: '/v2/seniorities', extraParams: {} },
	functions:   { endpoint: '/v2/functions',   extraParams: {} },
	jobFunctions:{ endpoint: '/v2/functions',   extraParams: {} },
};

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

export const linkedInAdsCampaignsRouter = router({
	/**
	 * List campaigns (ad sets) for a campaign group
	 * Returns campaigns directly from LinkedIn API with optional insights
	 */
	listCampaigns: protectedProcedure
		.input(
			z.object({
				accountId: z.string().min(1, 'Account ID is required'),
				campaignGroupId: z.string().min(1, 'Campaign Group ID is required'),
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

				// Ensure campaign group ID is in URN format
				let campaignGroupUrn = input.campaignGroupId;
				if (!campaignGroupUrn.startsWith('urn:li:sponsoredCampaignGroup:')) {
					// Extract numeric ID if it's just a number
					const numericId = campaignGroupUrn.replace(/[^0-9]/g, '');
					if (numericId) {
						campaignGroupUrn = `urn:li:sponsoredCampaignGroup:${numericId}`;
					}
				}

				// Add delay to avoid rate limits
				await new Promise((resolve) => setTimeout(resolve, 300));

				// Get campaigns directly from LinkedIn API
				const response = await client.getCampaigns(campaignGroupUrn, input.accountId);

				// Bulk-fetch insights for all campaigns in this campaign group.
				// This avoids one-request-per-campaign and gives better consistency.
				const insightsByCampaignId: Record<string, any> = {};
				let insightsDiagnostics: {
					requested: boolean;
					responseElements: number;
					mappedCampaigns: number;
					error: string | null;
				} = {
					requested: false,
					responseElements: 0,
					mappedCampaigns: 0,
					error: null,
				};

				if (input.timeRange?.since && input.timeRange?.until) {
					insightsDiagnostics.requested = true;
					try {
						const startDate = new Date(input.timeRange.since);
						const endDate = new Date(input.timeRange.until);
						const insightsResponse = await client.getAnalytics({
							dateRange: {
								start: formatDateForLinkedIn(startDate),
								end: formatDateForLinkedIn(endDate),
							},
							campaignGroups: [input.campaignGroupId],
							pivots: [{ pivot: 'CAMPAIGN' }],
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

						insightsDiagnostics.responseElements = (insightsResponse.elements || []).length;

						for (const elem of insightsResponse.elements || []) {
							const pivot = Array.isArray((elem as any).pivotValues) ? (elem as any).pivotValues[0] : undefined;
							if (!pivot) continue;
							const campaignId = String(pivot).split(':').pop();
							if (!campaignId) continue;
							const acc = insightsByCampaignId[campaignId] || {
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
							insightsByCampaignId[campaignId] = acc;
						}

						insightsDiagnostics.mappedCampaigns = Object.keys(insightsByCampaignId).length;
					} catch (error: any) {
						insightsDiagnostics.error = error?.message || 'Unknown analytics error';
					}
				}

				const campaignsWithInsights = [];
				for (let i = 0; i < (response.elements || []).length; i++) {
					const campaign = response.elements[i];
					let insights = null;
					const aggregated = insightsByCampaignId[String(campaign.id)];
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

					// Format budget values - LinkedIn returns in micro-currency (divide by 1000000)
					const formatBudget = (budget: number | string | null | undefined): string | null => {
						if (budget === null || budget === undefined) return null;
						const num = typeof budget === 'string' ? parseFloat(budget) : budget;
						if (isNaN(num)) return null;
						// LinkedIn returns budget in micro-currency (e.g., 100000000 = $100.00)
						return String(num / 1000000);
					};

					campaignsWithInsights.push({
						...campaign,
						id: campaign.id,
						name: campaign.name || null,
						status: normalizeStatusLabel(campaign.status || null),
						campaignGroup: campaign.campaignGroup || null,
						account: campaign.account || null,
						runSchedule: campaign.runSchedule || null,
						costType: campaign.costType || null,
						unitCost: campaign.unitCost ? formatBudget(campaign.unitCost) : null,
						dailyBudget: campaign.dailyBudget ? formatBudget(campaign.dailyBudget) : null,
						totalBudget: campaign.totalBudget ? formatBudget(campaign.totalBudget) : null,
						targetingCriteria: campaign.targetingCriteria || null,
						created: campaign.created || null,
						lastModified: campaign.lastModified || null,
						insights,
					});
				}

				return {
					success: true,
					data: campaignsWithInsights,
					meta: {
						retrieved_at: new Date().toISOString(),
						total_campaigns: campaignsWithInsights.length,
						paging: response.paging,
						insightsDiagnostics,
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
					message: error.message || 'Failed to list campaigns. Please try again.',
					cause: error,
				});
			}
		}),

	/**
	 * Resolve targeting criteria URNs to human-readable names.
	 * All API calls (industries, seniorities, titles, skills, degrees, fields of study,
	 * functions, geos) are made in parallel for speed.
	 * Parseable facets (genders, locales, age/staff/growth/experience ranges) are
	 * resolved inline with no extra network hop.
	 */
	resolveTargetingCriteria: protectedProcedure
		.input(z.object({ targetingCriteria: z.any() }))
		.query(async ({ input, ctx }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User session not found' });
			const { accessToken } = await getUserIntegration(userId, ctx.session?.user?.role);

			// 1. Extract URNs grouped by facet key
			const facetMap = new Map<string, string[]>();
			const andBlocks = input.targetingCriteria?.include?.and;
			if (!Array.isArray(andBlocks)) return { data: [], debug: [] };

			for (const block of andBlocks) {
				const orData = block?.or;
				if (!orData || typeof orData !== 'object') continue;
				for (const [facetUrn, values] of Object.entries(orData)) {
					if (!Array.isArray(values) || values.length === 0) continue;
					const facetKey = String(facetUrn).split(':').pop() || facetUrn;
					if (!facetMap.has(facetKey)) facetMap.set(facetKey, []);
					facetMap.get(facetKey)!.push(...(values as string[]));
				}
			}

			if (facetMap.size === 0) return { data: [], debug: [] };

			// 2. Build the list of tasks   one per facet that needs an API call
			type Task = {
				facetKey: string;
				ids: string[];
				resolve: () => Promise<{ names: Record<string, string>; debug: ApiCallDebug }>;
			};

			const apiFacets: Task[] = [];
			const parseableFacets: { facetKey: string; urns: string[] }[] = [];
			const noApiFacets: { facetKey: string; urns: string[] }[] = [];

			const extractId = (urn: string) => {
				const colonIdx = urn.indexOf(':(');
				return colonIdx !== -1 ? urn.slice(colonIdx + 1) : String(urn).split(':').pop() || urn;
			};

			for (const [facetKey, urns] of facetMap.entries()) {
				const ids = urns.map(extractId);

				if (PARSEABLE_FACETS.has(facetKey)) {
					parseableFacets.push({ facetKey, urns });
				} else if (BATCH_GET_CONFIG[facetKey]) {
					const cfg = BATCH_GET_CONFIG[facetKey];
					apiFacets.push({
						facetKey, ids,
						resolve: () => batchGetNames(accessToken, cfg.endpoint, ids, cfg.nameExtractor, cfg.extraParams),
					});
				} else if (GET_ALL_CONFIG[facetKey]) {
					const cfg = GET_ALL_CONFIG[facetKey];
					apiFacets.push({
						facetKey, ids,
						resolve: () => getAllNames(accessToken, cfg.endpoint, multiLocaleName, cfg.extraParams),
					});
				} else if (facetKey === 'locations' || facetKey === 'profileLocations') {
					const geoUrns = urns; // capture full URNs for closure
					apiFacets.push({
						facetKey, ids,
						resolve: async (): Promise<{ names: Record<string, string>; debug: ApiCallDebug }> => {
							// Docs: URN-to-name resolver (REST) expects URNs inside List() to be URL-encoded.
							const encodedUrns = geoUrns.map(u => encodeURIComponent(u));
							const rawUrns = `urns=List(${encodedUrns.join(',')})`;
							try {
								const { url: urlStr, statusCode, text } = await fetchAdTargetingEntitiesByUrns(accessToken, rawUrns);
								if (statusCode < 400) {
									const data = JSON.parse(text);
									const names: Record<string, string> = {};
									for (const el of (data?.elements || data?.results || [])) {
										const urn: string = (el as any)?.urn ?? (el as any)?.$URN ?? '';
										const numId = urn.split(':').pop() || '';
										const name: string = adTargetingEntityName(el);
										if (numId && name) names[numId] = name;
									}
									return { names, debug: { url: urlStr, statusCode, rawResponse: text, resolvedCount: Object.keys(names).length } };
								}

								// Fallback: resolve directly via standardized Geo API (/v2/geo batch-get)
								const geo = await batchGetGeoNames(accessToken, ids);
								return {
									names: geo.names,
									debug: {
										url: geo.debug.url,
										statusCode: geo.debug.statusCode,
										resolvedCount: geo.debug.resolvedCount,
										rawResponse: JSON.stringify({
											primary: { url: urlStr, statusCode, rawResponse: text },
											fallback: geo.debug,
										}),
									},
								};
							} catch (e: any) {
								return { names: {}, debug: { url: '(exception)', statusCode: 0, rawResponse: String(e?.message || e), resolvedCount: 0 } };
							}
						},
					});
				} else {
					noApiFacets.push({ facetKey, urns });
				}
			}

			// 3. Fire all API tasks in parallel
			const resolvedResults = await Promise.all(apiFacets.map(t => t.resolve()));

			// 4. Assemble results + collect debug info
			const results: Array<{ label: string; content: string }> = [];
			const debugInfo: Array<{ facetKey: string; url: string; statusCode: number; resolvedCount: number; rawResponse: string }> = [];
			const facetLabel = (k: string) =>
				TARGETING_FACET_LABELS[k] || k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, m => m.toUpperCase());

			for (const { facetKey, urns } of parseableFacets) {
				const names = parseInlineFacet(facetKey, urns);
				if (names.length) results.push({ label: facetLabel(facetKey), content: names.join(', ') });
			}

			for (let i = 0; i < apiFacets.length; i++) {
				const { facetKey, ids } = apiFacets[i];
				const { names: map, debug } = resolvedResults[i];
				debugInfo.push({ facetKey, ...debug });
				const names = ids.map(id => map[id] || id);
				if (names.length) results.push({ label: facetLabel(facetKey), content: names.join(', ') });
			}

			for (const { facetKey, urns } of noApiFacets) {
				const ids = urns.map(u => {
					const colonIdx = u.indexOf(':(');
					return colonIdx !== -1 ? u.slice(colonIdx + 1) : String(u).split(':').pop() || u;
				});
				if (ids.length) results.push({ label: facetLabel(facetKey), content: ids.join(', ') });
			}

			return { data: results, debug: debugInfo };
		}),

	/**
	 * Bulk version of resolveTargetingCriteria for PDFs/exports.
	 * Accepts multiple campaign targetingCriteria blobs and resolves all names with
	 * de-duped LinkedIn API calls.
	 */
	resolveTargetingCriteriaBulk: protectedProcedure
		.input(z.object({
			items: z.array(z.object({
				campaignId: z.string().min(1),
				targetingCriteria: z.any(),
			})).min(1).max(60),
		}))
		.query(async ({ input, ctx }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User session not found' });
			const { accessToken } = await getUserIntegration(userId, ctx.session?.user?.role);

			const extractId = (urn: string) => {
				const colonIdx = urn.indexOf(':(');
				return colonIdx !== -1 ? urn.slice(colonIdx + 1) : String(urn).split(':').pop() || urn;
			};

			const facetLabel = (k: string) =>
				TARGETING_FACET_LABELS[k] || k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, m => m.toUpperCase());

			// Build per-campaign facet maps and a global facet->ids/urns union.
			const perCampaign: Record<string, Map<string, string[]>> = {};
			const globalIdsByFacet = new Map<string, Set<string>>();
			const globalUrnsByFacet = new Map<string, Set<string>>();

			for (const item of input.items) {
				const facetMap = new Map<string, string[]>();
				const andBlocks = item.targetingCriteria?.include?.and;
				if (Array.isArray(andBlocks)) {
					for (const block of andBlocks) {
						const orData = block?.or;
						if (!orData || typeof orData !== 'object') continue;
						for (const [facetUrn, values] of Object.entries(orData)) {
							if (!Array.isArray(values) || values.length === 0) continue;
							const facetKey = String(facetUrn).split(':').pop() || facetUrn;
							if (!facetMap.has(facetKey)) facetMap.set(facetKey, []);
							facetMap.get(facetKey)!.push(...(values as string[]));
						}
					}
				}
				perCampaign[item.campaignId] = facetMap;

				for (const [facetKey, urns] of facetMap.entries()) {
					if (!globalUrnsByFacet.has(facetKey)) globalUrnsByFacet.set(facetKey, new Set());
					const urnSet = globalUrnsByFacet.get(facetKey)!;
					for (const u of urns) urnSet.add(u);

					if (!globalIdsByFacet.has(facetKey)) globalIdsByFacet.set(facetKey, new Set());
					const idSet = globalIdsByFacet.get(facetKey)!;
					for (const u of urns) idSet.add(extractId(u));
				}
			}

			// Resolve names per facet (one call per facet type).
			const resolvedByFacet: Record<string, Record<string, string>> = {};

			const tasks: Array<Promise<{ facetKey: string; names: Record<string, string> }>> = [];

			for (const facetKey of globalIdsByFacet.keys()) {
				const ids = Array.from(globalIdsByFacet.get(facetKey) || []);
				const urns = Array.from(globalUrnsByFacet.get(facetKey) || []);

				if (PARSEABLE_FACETS.has(facetKey)) {
					// No API resolution needed; handled per-campaign via parseInlineFacet.
					continue;
				}

				if (BATCH_GET_CONFIG[facetKey]) {
					const cfg = BATCH_GET_CONFIG[facetKey];
					tasks.push(
						batchGetNames(accessToken, cfg.endpoint, ids, cfg.nameExtractor, cfg.extraParams)
							.then(r => ({ facetKey, names: r.names }))
					);
					continue;
				}

				if (GET_ALL_CONFIG[facetKey]) {
					const cfg = GET_ALL_CONFIG[facetKey];
					tasks.push(
						getAllNames(accessToken, cfg.endpoint, multiLocaleName, cfg.extraParams)
							.then(r => ({ facetKey, names: r.names }))
					);
					continue;
				}

				if (facetKey === 'locations' || facetKey === 'profileLocations') {
					const geoUrns = urns;
					const geoIds = ids;
					tasks.push((async () => {
						const encodedUrns = geoUrns.map(u => encodeURIComponent(u));
						const rawUrns = `urns=List(${encodedUrns.join(',')})`;
						const { url: urlStr, statusCode, text } = await fetchAdTargetingEntitiesByUrns(accessToken, rawUrns);
						if (statusCode < 400) {
							const data = JSON.parse(text);
							const names: Record<string, string> = {};
							for (const el of (data?.elements || data?.results || [])) {
								const urn: string = (el as any)?.urn ?? (el as any)?.$URN ?? '';
								const numId = urn.split(':').pop() || '';
								const name: string = adTargetingEntityName(el);
								if (numId && name) names[numId] = name;
							}
							return { facetKey, names };
						}
						const geo = await batchGetGeoNames(accessToken, geoIds);
						return { facetKey, names: geo.names };
					})());
					continue;
				}

				// Unknown facet, no resolution.
			}

			const resolved = await Promise.all(tasks);
			for (const r of resolved) resolvedByFacet[r.facetKey] = r.names;

			// Build per-campaign outputs.
			const out: Record<string, Array<{ label: string; content: string }>> = {};
			for (const [campaignId, facetMap] of Object.entries(perCampaign)) {
				const results: Array<{ label: string; content: string }> = [];
				for (const [facetKey, urns] of facetMap.entries()) {
					if (PARSEABLE_FACETS.has(facetKey)) {
						const names = parseInlineFacet(facetKey, urns);
						if (names.length) results.push({ label: facetLabel(facetKey), content: names.join(', ') });
						continue;
					}
					const ids = urns.map(extractId);
					const map = resolvedByFacet[facetKey] || {};
					const names = ids.map(id => map[id] || id);
					if (names.length) results.push({ label: facetLabel(facetKey), content: names.join(', ') });
				}
				out[campaignId] = results;
			}

			return { data: out };
		}),

	/**
	 * Get campaign details
	 */
	getCampaignDetails: protectedProcedure
		.input(
			z.object({
				campaignGroupId: z.string().min(1, 'Campaign Group ID is required'),
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

				const { accessToken } = await getUserIntegration(userId, ctx.session?.user?.role);

				// Create LinkedIn Ads client
				const client = new LinkedInAdsClient({ accessToken });

				// Get campaign details directly from LinkedIn API
				const campaignDetails = await client.getCampaignDetails(input.campaignId);

				// Format budget values
				const formatBudget = (budget: number | string | null | undefined): string | null => {
					if (budget === null || budget === undefined) return null;
					const num = typeof budget === 'string' ? parseFloat(budget) : budget;
					if (isNaN(num)) return null;
					return String(num / 1000000);
				};

				// Return campaign details
				return {
					success: true,
					data: {
						...campaignDetails,
						unitCost: campaignDetails.unitCost ? formatBudget(campaignDetails.unitCost) : null,
						dailyBudget: campaignDetails.dailyBudget ? formatBudget(campaignDetails.dailyBudget) : null,
						totalBudget: campaignDetails.totalBudget ? formatBudget(campaignDetails.totalBudget) : null,
					},
				};
			} catch (error) {

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error instanceof Error ? error.message : 'Failed to get campaign details',
				});
			}
		}),
});

