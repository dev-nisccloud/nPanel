import { request } from 'undici';
import { LinkedInApiError, type LinkedInApiConfig } from "./linkedin-client";
import { LinkedInErrorHandler } from './linkedin-error-handler';

/**
 * LinkedIn Ads API Client
 * Specialized client for LinkedIn Marketing API (Ads API)
 * Uses REST API endpoints for ad accounts, campaign groups, campaigns, and creatives
 */
export class LinkedInAdsClient {
	private config: Required<LinkedInApiConfig>;
	private debugEnabled: boolean;
	private static unsupportedStrategyCache = new Set<string>();

	constructor(config: LinkedInApiConfig) {
		const envApiVersion =
			process.env.LINKEDIN_MARKETING_API_VERSION ||
			process.env.LINKEDIN_API_VERSION;
		this.debugEnabled = process.env.LINKEDIN_ADS_DEBUG === 'true';
		this.config = {
			accessToken: config.accessToken,
			apiVersion: config.apiVersion || envApiVersion || '202603',
			baseUrl: config.baseUrl || 'https://api.linkedin.com',
		};
	}

	private extractAccountId(accountIdOrUrn: string): string {
		if (accountIdOrUrn.startsWith('urn:li:sponsoredAccount:')) {
			return accountIdOrUrn.split(':').pop() || accountIdOrUrn;
		}
		return accountIdOrUrn.replace(/[^0-9]/g, '') || accountIdOrUrn;
	}

	private normalizeElements<T = any>(response: any): T[] {
		if (Array.isArray(response?.elements)) return response.elements as T[];
		if (Array.isArray(response?.value)) return response.value as T[];
		if (Array.isArray(response?.data)) return response.data as T[];
		if (Array.isArray(response)) return response as T[];
		return [];
	}

	private isUnsupportedCreativePreviewError(error: any): boolean {
		const status = error?.status ?? error?.statusCode ?? error?.cause?.status ?? error?.cause?.statusCode;
		const message = String(error?.message || error?.userMessage || error?.cause?.message || '');
		const code = String(error?.code || error?.errorCode || error?.cause?.code || '');
		return (
			status === 422 ||
			code === 'UNSUPPORTED_CREATIVE_TYPE' ||
			message.includes('Unsupported Creative Type')
		);
	}

	private toLinkedInList(values: string[]): string {
		return `List(${values.join(',')})`;
	}

	private toLinkedInListEncoded(values: string[]): string {
		// Keep List(...) syntax, but encode each item (URNs contain ":" which often must be encoded in query params).
		// Example: List(urn%3Ali%3AsponsoredCreative%3A123,urn%3Ali%3AsponsoredCreative%3A456)
		return `List(${values.map((v) => encodeURIComponent(v)).join(',')})`;
	}

	private toQueryValue(value: unknown): string {
		if (Array.isArray(value)) return value.join(',');
		if (typeof value === 'object' && value !== null) return JSON.stringify(value);
		return String(value);
	}

	private buildAdAnalyticsQuery(params: Record<string, any>): string {
		const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null);
		const parts = entries.map(([key, value]) => {
			if (key === 'dateRange' && typeof value === 'string') {
				// LinkedIn adAnalytics finder expects dateRange expression syntax, not percent-encoded.
				return `${encodeURIComponent(key)}=${value}`;
			}
			if (key === 'fields' && typeof value === 'string') {
				// LinkedIn projections require raw comma-separated field names.
				// Encoding commas makes the entire list look like a single invalid field.
				return `${encodeURIComponent(key)}=${value}`;
			}
			if (typeof value === 'string' && value.startsWith('List(')) {
				// Rest.li array parameters must keep List(...) syntax unencoded.
				// Encoding commas/parens causes LinkedIn to fail deserializing the list.
				return `${encodeURIComponent(key)}=${value}`;
			}
			return `${encodeURIComponent(key)}=${encodeURIComponent(this.toQueryValue(value))}`;
		});
		return parts.join('&');
	}

	private formatAnalyticsDateRange(dateRange: {
		start: { year: number; month: number; day: number };
		end: { year: number; month: number; day: number };
	}): string {
		const s = dateRange.start;
		const e = dateRange.end;
		return `(start:(year:${s.year},month:${s.month},day:${s.day}),end:(year:${e.year},month:${e.month},day:${e.day}))`;
	}

	private flattenAnalyticsDateRange(dateRange: {
		start: { year: number; month: number; day: number };
		end: { year: number; month: number; day: number };
	}): Record<string, number> {
		return {
			'dateRange.start.year': dateRange.start.year,
			'dateRange.start.month': dateRange.start.month,
			'dateRange.start.day': dateRange.start.day,
			'dateRange.end.year': dateRange.end.year,
			'dateRange.end.month': dateRange.end.month,
			'dateRange.end.day': dateRange.end.day,
		};
	}

	private ensureUrn(value: string, type: 'ACCOUNT' | 'CAMPAIGN_GROUP' | 'CAMPAIGN' | 'CREATIVE'): string {
		if (value.startsWith('urn:li:')) return value;
		const numeric = value.replace(/[^0-9]/g, '');
		if (!numeric) return value;
		if (type === 'ACCOUNT') return `urn:li:sponsoredAccount:${numeric}`;
		if (type === 'CAMPAIGN_GROUP') return `urn:li:sponsoredCampaignGroup:${numeric}`;
		if (type === 'CAMPAIGN') return `urn:li:sponsoredCampaign:${numeric}`;
		return `urn:li:sponsoredCreative:${numeric}`;
	}

	private maskAccessToken(token: string): string {
		if (!token) return 'missing';
		if (token.length <= 12) return '***';
		return `${token.slice(0, 6)}...${token.slice(-4)}`;
	}

	private safeSerialize(value: unknown): string {
		try {
			const text = JSON.stringify(value);
			if (!text) return '';
			return text.length > 700 ? `${text.slice(0, 700)}...<truncated>` : text;
		} catch {
			return String(value);
		}
	}

	private debugLog(event: string, payload: Record<string, unknown>): void {
		if (!this.debugEnabled) return;
		console.log(`[LinkedInAds Debug] ${event}`, payload);
	}

	private makeStrategyCacheKey(endpoint: string, strategy: string, accountIdOrUrn?: string): string {
		const normalizedAccount = accountIdOrUrn ? this.extractAccountId(accountIdOrUrn) : 'global';
		return `${this.config.apiVersion}::${endpoint}::${normalizedAccount}::${strategy}`;
	}

	private isStrategyUnsupported(endpoint: string, strategy: string, accountIdOrUrn?: string): boolean {
		return LinkedInAdsClient.unsupportedStrategyCache.has(
			this.makeStrategyCacheKey(endpoint, strategy, accountIdOrUrn)
		);
	}

	private markStrategyUnsupported(endpoint: string, strategy: string, accountIdOrUrn?: string): void {
		const key = this.makeStrategyCacheKey(endpoint, strategy, accountIdOrUrn);
		LinkedInAdsClient.unsupportedStrategyCache.add(key);
		this.debugLog('strategy-marked-unsupported', { endpoint, strategy, accountIdOrUrn });
	}

	/**
	 * Make HTTP request to LinkedIn Marketing API
	 */
	private async makeRequest<T>(
		method: 'GET' | 'POST' | 'PUT' | 'DELETE',
		endpoint: string,
		params?: Record<string, any>,
		body?: any
	): Promise<T> {
		const isAdAnalyticsRequest = endpoint === '/rest/adAnalytics';
		const baseUrl = `${this.config.baseUrl}${endpoint}`;
		const url = new URL(baseUrl);
		const requestId = `liads_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
		const rawPairs: string[] = [];

		// Rest.li search expressions such as (status:(values:List(ACTIVE))) must stay unencoded.
		// URLSearchParams encodes the parentheses and commas, and LinkedIn then rejects the finder.
		if (params && !isAdAnalyticsRequest) {
			for (const [key, value] of Object.entries(params)) {
				if (value === undefined || value === null) continue;
				const text = this.toQueryValue(value);
				if (text.includes('(')) {
					rawPairs.push(`${encodeURIComponent(key)}=${text}`);
				} else {
					url.searchParams.set(key, text);
				}
			}
		}

		const requestUrl = isAdAnalyticsRequest && params
			? `${baseUrl}?${this.buildAdAnalyticsQuery(params)}`
			: rawPairs.length > 0
				? `${url.toString()}${url.search ? '&' : '?'}${rawPairs.join('&')}`
				: url.toString();

		const requestOptions: any = {
			method,
			headers: {
				'Authorization': `Bearer ${this.config.accessToken}`,
				'Content-Type': 'application/json',
				'LinkedIn-Version': this.config.apiVersion,
				'X-Restli-Protocol-Version': '2.0.0',
			},
		};

		// Rest.li "actions" require an explicit header.
		// Without this, LinkedIn can respond with 501 Not Implemented for action-based endpoints.
		if (method === 'POST' && params?.action) {
			requestOptions.headers['X-RestLi-Method'] = 'action';
		}
		// Creative search is a finder and requires this header.
		if (method === 'GET' && endpoint.includes('/creatives') && params?.q) {
			requestOptions.headers['X-RestLi-Method'] = 'FINDER';
		}

		this.debugLog('request', {
			requestId,
			method,
			endpoint,
			url: requestUrl,
			params,
			apiVersion: this.config.apiVersion,
			accessToken: this.maskAccessToken(this.config.accessToken),
		});

		if (body && (method === 'POST' || method === 'PUT')) {
			requestOptions.body = JSON.stringify(body);
		}

		try {
			const response = await request(requestUrl, requestOptions);
			this.debugLog('response-status', {
				requestId,
				statusCode: response.statusCode,
				endpoint,
			});

			// Check response status code
			if (response.statusCode && response.statusCode >= 400) {
				let errorData: any = null;
				let responseText = '';

				try {
					responseText = await response.body.text();
					this.debugLog('response-error-body', {
						requestId,
						endpoint,
						statusCode: response.statusCode,
						body: responseText.length > 1200 ? `${responseText.slice(0, 1200)}...<truncated>` : responseText,
					});
					if (responseText && responseText.trim()) {
						try {
							errorData = JSON.parse(responseText);
						} catch (jsonError) {
							errorData = {
								message: responseText,
								status: response.statusCode,
							};
						}
					}
				} catch (readError) {
					errorData = {
						message: `LinkedIn Ads API error: ${response.statusCode}`,
						status: response.statusCode,
					};
				}

				// Handle 404 "No virtual resource found" - user might not have ad accounts
				// This is a common case and should be handled gracefully
				const errorMessage = errorData?.message || responseText || '';
				const isNoResourceError = response.statusCode === 404 && (
					errorMessage.includes('No virtual resource found') ||
					errorMessage.includes('not found') ||
					errorMessage.toLowerCase().includes('no virtual resource')
				);
				
				if (isNoResourceError) {
					// Return empty result structure for list endpoints
					if (endpoint.includes('V2') && !endpoint.includes('{')) {
						// This is a list endpoint, return empty result
						return {
							elements: [],
							paging: undefined,
						} as any;
					}
					// For detail endpoints, throw error
				}

				const linkedInError = new LinkedInApiError(
					errorData?.status || response.statusCode || 500,
					errorData?.message || `LinkedIn Ads API error: ${response.statusCode}`,
					errorData?.serviceErrorCode
				);

				// Use error handler for user-friendly messages
				const errorInfo = LinkedInErrorHandler.handleError(linkedInError);
				if (errorInfo) {
					(linkedInError as any).errorType = errorInfo.type;
					(linkedInError as any).userMessage = errorInfo.message;
				}
				throw linkedInError;
			}

			// Parse successful response
			let responseData: unknown;
			try {
				const responseText = await response.body.text();
				this.debugLog('response-success-body', {
					requestId,
					endpoint,
					statusCode: response.statusCode,
					body: responseText.length > 1200 ? `${responseText.slice(0, 1200)}...<truncated>` : responseText,
				});
				if (responseText && responseText.trim()) {
					responseData = JSON.parse(responseText);
				} else {
					responseData = {};
				}
			} catch (parseError) {
				if (response.statusCode && response.statusCode >= 400) {
					throw new LinkedInApiError(
						response.statusCode,
						'Failed to parse LinkedIn Ads API response',
						undefined
					);
				}
				responseData = {};
			}

			return responseData as T;
		} catch (error) {
			this.debugLog('request-failure', {
				requestId,
				endpoint,
				error: this.safeSerialize(error),
			});
			if (error instanceof LinkedInApiError) {
				if (!(error as any).errorType) {
					const errorInfo = LinkedInErrorHandler.handleError(error);
					if (errorInfo) {
						(error as any).errorType = errorInfo.type;
						(error as any).userMessage = errorInfo.message;
					}
				}
				throw error;
			}

			if (error instanceof Error) {
				throw new LinkedInApiError(500, `Request failed: ${error.message}`);
			}

			throw new LinkedInApiError(500, 'Unknown error occurred');
		}
	}

	/**
	 * List accessible ad accounts
	 * GET /rest/adAccountsV2
	 */
	async getAdAccounts(options?: {
		fields?: string[];
		start?: number;
		count?: number;
	}): Promise<{
		elements: Array<{
			id: string;
			name?: string;
			currency?: string;
			timezone?: string;
			status?: string;
			accountStatus?: string;
			servingStatuses?: string[];
			reference?: string;
			type?: string;
		}>;
		paging?: {
			count?: number;
			start?: number;
			links?: Array<{ rel: string; href: string }>;
		};
	}> {
		const defaultFields = [
			'id',
			'name',
			'currency',
			'timezone',
			'status',
			'accountStatus',
			'servingStatuses',
			'reference',
			'type',
		];

		const tryStrategy = async (
			name: string,
			params: Record<string, any>
		): Promise<{ response: any; elements: any[] } | null> => {
			try {
				const response = await this.makeRequest<any>('GET', '/rest/adAccounts', params);
				const elements = this.normalizeElements(response);
				this.debugLog('accounts-strategy-result', {
					strategy: name,
					params,
					elementsCount: elements.length,
				});
				return { response, elements };
			} catch (error: any) {
				this.debugLog('accounts-strategy-error', {
					strategy: name,
					status: error?.status,
					message: error?.message,
					errorType: error?.errorType,
				});
				if (error?.status === 404) return null;
				throw error;
			}
		};

		// NOTE:
		// LinkedIn adAccounts finder in this tenant/version rejects comma-projected `fields`
		// as a literal field token (e.g. "id%2Cname..."). To ensure stable retrieval,
		// fetch without projection and map needed fields in router layer.
		const baseFields = (options?.fields || defaultFields).join(',');

		// Strategy 1 (primary): finder search without explicit criteria (LinkedIn docs: returns all accessible)
		const s1 = await tryStrategy('finder-search-all', {
			q: 'search',
			pageSize: 1000,
		});
		if (s1 && s1.elements.length > 0) {
			return { ...s1.response, elements: s1.elements };
		}

		// Strategy 2: finder search with explicit production filter
		const s2 = await tryStrategy('finder-search-non-test', {
			q: 'search',
			search:
				'(status:(values:List(ACTIVE,DRAFT,CANCELED,PENDING_DELETION,REMOVED)),type:(values:List(BUSINESS,ENTERPRISE)),test:false)',
			sortOrder: 'DESCENDING',
			pageSize: 1000,
		});
		if (s2 && s2.elements.length > 0) {
			return { ...s2.response, elements: s2.elements };
		}

		// Strategy 3: plain list for tenants where collection GET is supported
		const s3 = await tryStrategy('plain-list', {
			start: options?.start,
			count: options?.count,
		});
		if (s3 && s3.elements.length > 0) {
			return { ...s3.response, elements: s3.elements };
		}

		// Strategy 4: finder search including test accounts
		const s4 = await tryStrategy('finder-search-include-test', {
			q: 'search',
			search:
				'(status:(values:List(ACTIVE,DRAFT,CANCELED,PENDING_DELETION,REMOVED)),type:(values:List(BUSINESS,ENTERPRISE)))',
			sortOrder: 'DESCENDING',
			pageSize: 1000,
		});
		if (s4) {
			return { ...s4.response, elements: s4.elements };
		}

		return {
			elements: [],
			paging: undefined,
		};
	}

	/**
	 * Get ad account details
	 * GET /rest/adAccountsV2/{id}
	 */
	async getAdAccountDetails(
		accountId: string,
		fields?: string[]
	): Promise<{
		id: string;
		name?: string;
		currency?: string;
		timezone?: string;
		status?: string;
		accountStatus?: string;
		servingStatuses?: string[];
		reference?: string;
		type?: string;
	}> {
		const normalizedAccountId = this.extractAccountId(accountId);
		return this.makeRequest('GET', `/rest/adAccounts/${normalizedAccountId}`);
	}

	/**
	 * List campaign groups for an ad account
	 * GET /rest/adCampaignGroupsV2
	 */
	async getCampaignGroups(
		accountUrn: string,
		options?: {
			fields?: string[];
			pageSize?: number;
			pageToken?: string;
		}
	): Promise<{
		elements: Array<any>;
		paging?: {
			count?: number;
			start?: number;
			links?: Array<{ rel: string; href: string }>;
		};
	}> {
		const defaultFields = [
			'id',
			'name',
			'status',
			'account',
			'runSchedule',
			'campaignGroupStatus',
			'created',
			'lastModified',
		];

		const accountId = this.extractAccountId(accountUrn);
		const endpoint = `/rest/adAccounts/${accountId}/adCampaignGroups`;
		// https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/account-structure/create-and-manage-campaign-groups
		// Search criteria is required. Cursor pages use metadata.nextPageToken. Default page size is 100.
		const statuses = ['ACTIVE', 'PAUSED', 'DRAFT', 'ARCHIVED', 'CANCELED', 'PENDING_DELETION', 'REMOVED'];
		const pageSize = Math.min(options?.pageSize ?? 1000, 1000);
		const elements: any[] = [];
		let pageToken = options?.pageToken;
		let lastResponse: any = {};

		for (let page = 0; page < 50; page += 1) {
			const response = await this.makeRequest<any>('GET', endpoint, {
				q: 'search',
				search: `(status:(values:List(${statuses.join(',')})))`,
				sortOrder: 'DESCENDING',
				pageSize,
				...(pageToken ? { pageToken } : {}),
			});
			lastResponse = response;
			const pageElements = this.normalizeElements(response);
			elements.push(...pageElements);
			const nextPageToken = response?.metadata?.nextPageToken;
			this.debugLog('campaignGroups-page', {
				endpoint,
				page,
				elementsCount: pageElements.length,
				hasNextPage: Boolean(nextPageToken),
			});
			if (!nextPageToken || nextPageToken === pageToken || pageElements.length === 0) break;
			pageToken = nextPageToken;
		}

		return {
			...lastResponse,
			elements,
		};
	}

	/**
	 * Get a campaign group.
	 * GET /rest/adAccounts/{adAccountId}/adCampaignGroups/{adCampaignGroupsId}
	 */
	async getCampaignGroupDetails(
		campaignGroupId: string,
		accountIdOrUrn: string,
	): Promise<any> {
		const accountId = this.extractAccountId(accountIdOrUrn);
		const groupId = this.extractAccountId(campaignGroupId);
		return this.makeRequest(
			'GET',
			`/rest/adAccounts/${accountId}/adCampaignGroups/${groupId}`,
		);
	}

	/**
	 * List campaigns for a campaign group.
	 * GET /rest/adAccounts/{adAccountId}/adCampaigns?q=search
	 */
	async getCampaigns(
		campaignGroupUrn: string,
		accountIdOrUrn: string,
		options?: {
			fields?: string[];
			pageSize?: number;
			pageToken?: string;
		}
	): Promise<{
		elements: Array<any>;
		paging?: {
			count?: number;
			start?: number;
			links?: Array<{ rel: string; href: string }>;
		};
	}> {
		const targetCampaignGroupUrn = campaignGroupUrn.startsWith('urn:li:')
			? campaignGroupUrn
			: this.ensureUrn(campaignGroupUrn, 'CAMPAIGN_GROUP');
		const accountId = this.extractAccountId(accountIdOrUrn);
		const endpoint = `/rest/adAccounts/${accountId}/adCampaigns`;
		const statuses = ['ACTIVE', 'PAUSED', 'ARCHIVED', 'COMPLETED', 'CANCELED', 'DRAFT', 'PENDING_DELETION', 'REMOVED'];
		// URN values inside List() must be percent-encoded. A raw urn:li:... makes LinkedIn
		// reject the finder with "Invalid query parameters passed to request".
		// https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/account-structure/create-and-manage-campaigns?view=li-lms-2026-10
		const encodedGroup = encodeURIComponent(targetCampaignGroupUrn);
		const pageSize = Math.min(options?.pageSize ?? 1000, 1000);
		const elements: any[] = [];
		let pageToken = options?.pageToken;
		let lastResponse: any = {};

		for (let page = 0; page < 50; page += 1) {
			const response = await this.makeRequest<any>('GET', endpoint, {
				q: 'search',
				search: `(campaignGroup:(values:List(${encodedGroup})),status:(values:List(${statuses.join(',')})))`,
				sortOrder: 'DESCENDING',
				pageSize,
				...(pageToken ? { pageToken } : {}),
			});
			lastResponse = response;
			const pageElements = this.normalizeElements(response);
			elements.push(...pageElements);
			const nextPageToken = response?.metadata?.nextPageToken;
			this.debugLog('campaigns-page', {
				endpoint,
				page,
				elementsCount: pageElements.length,
				hasNextPage: Boolean(nextPageToken),
			});
			if (!nextPageToken || nextPageToken === pageToken || pageElements.length === 0) break;
			pageToken = nextPageToken;
		}

		return {
			...lastResponse,
			elements,
		};
	}

	/**
	 * Get a campaign.
	 * GET /rest/adAccounts/{adAccountId}/adCampaigns/{campaignId}
	 */
	async getCampaignDetails(campaignId: string, accountIdOrUrn: string): Promise<any> {
		const accountId = this.extractAccountId(accountIdOrUrn);
		const id = this.extractAccountId(campaignId);
		return this.makeRequest('GET', `/rest/adAccounts/${accountId}/adCampaigns/${id}`);
	}

	/**
	 * List creatives (ads) for a campaign
	 * GET /rest/adCreativesV2
	 */
	async getCreatives(
		campaignUrn: string,
		accountIdOrUrn: string,
		options?: {
			fields?: string[];
			pageSize?: number;
			pageToken?: string;
		}
	): Promise<{
		elements: Array<any>;
		paging?: {
			count?: number;
			start?: number;
			links?: Array<{ rel: string; href: string }>;
		};
	}> {
		const defaultFields = [
			'id',
			'name',
			'status',
			'campaign',
			'type',
			'changeAuditStamps',
			'variables',
			'created',
			'lastModified',
		];

		const accountId = this.extractAccountId(accountIdOrUrn);
		const endpoint = `/rest/adAccounts/${accountId}/creatives`;
		const normalizedCampaignUrn = this.ensureUrn(campaignUrn, 'CAMPAIGN');
		const encodedCampaign = encodeURIComponent(normalizedCampaignUrn);

		// Creatives finder: campaigns=List(urn%3Ali%3AsponsoredCampaign%3A...), q=criteria.
		// https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/account-structure/create-and-manage-creatives?view=li-lms-2026-09
		try {
			const fallback = await this.makeRequest<any>('GET', endpoint, {
				q: 'criteria',
				campaigns: `List(${encodedCampaign})`,
				sortOrder: 'ASCENDING',
				...(options?.pageSize !== undefined ? { pageSize: options.pageSize } : {}),
				...(options?.pageToken ? { pageToken: options.pageToken } : {}),
			});
			const fallbackElements = this.normalizeElements(fallback);
			this.debugLog('creatives-strategy-result', {
				endpoint,
				strategy: 'criteria-all-local-filter',
				params: {
					q: 'criteria',
					sortOrder: 'ASCENDING',
					...(options?.pageSize !== undefined ? { pageSize: options.pageSize } : {}),
					...(options?.pageToken ? { pageToken: options.pageToken } : {}),
				},
				elementsCount: fallbackElements.length,
			});
			return {
				...fallback,
				elements: fallbackElements.filter((creative: any) => String(creative?.campaign || '') === normalizedCampaignUrn),
			};
		} catch (error: any) {
			if (error?.status === 404 || String(error?.message || '').includes('No virtual resource found')) {
				return { elements: [], paging: undefined };
			}
			throw error;
		}
	}

	async getAccountCreatives(
		accountIdOrUrn: string,
		options?: {
			pageSize?: number;
			pageToken?: string;
			sortOrder?: 'ASCENDING' | 'DESCENDING';
		}
	): Promise<{
		elements: Array<any>;
		paging?: any;
		metadata?: {
			nextPageToken?: string | null;
		};
	}> {
		const accountId = this.extractAccountId(accountIdOrUrn);
		const endpoint = `/rest/adAccounts/${accountId}/creatives`;
		const pageSize = Math.min(options?.pageSize ?? 100, 100);
		const sortOrder = options?.sortOrder ?? 'ASCENDING';

		const response = await this.makeRequest<any>('GET', endpoint, {
			q: 'criteria',
			pageSize,
			...(options?.pageToken ? { pageToken: options.pageToken } : {}),
			sortOrder,
		});

		return {
			...response,
			elements: this.normalizeElements(response),
		};
	}

	async getCreativePreviews(
		accountIdOrUrn: string,
		creativeUrnOrId: string
	): Promise<{
		elements: Array<{
			preview?: string;
			creative?: string;
			placement?: any;
		}>;
		paging?: any;
		unsupportedCreativeType?: boolean;
	}> {
		const accountUrn = this.ensureUrn(accountIdOrUrn, 'ACCOUNT');
		const creativeUrn = this.ensureUrn(creativeUrnOrId, 'CREATIVE');
		try {
			const response = await this.makeRequest<any>('GET', '/rest/adPreviews', {
				q: 'creative',
				account: accountUrn,
				creative: creativeUrn,
			});
			return {
				...response,
				elements: this.normalizeElements(response),
			};
		} catch (error: any) {
			if (this.isUnsupportedCreativePreviewError(error)) {
				this.debugLog('adPreview-unsupported-creative-type', {
					accountUrn,
					creativeUrn,
					error: this.safeSerialize(error),
				});
				return { elements: [], paging: undefined, unsupportedCreativeType: true };
			}
			throw error;
		}
	}

	async getLiveCreativePreviews(
		creative: {
			campaign: string;
			intendedStatus?: string;
			content?: { reference?: string; [key: string]: any } | null;
			inlineContent?: Record<string, any> | null;
		}
	): Promise<{ elements: Array<{ preview?: string; placement?: any }>; paging?: any; notImplemented?: boolean }> {
		const payloadCreative: any = {
			campaign: this.ensureUrn(creative.campaign, 'CAMPAIGN'),
			intendedStatus: creative.intendedStatus || 'ACTIVE',
		};
		if (creative.content) payloadCreative.content = creative.content;
		if (creative.inlineContent) payloadCreative.inlineContent = creative.inlineContent;

		if (!payloadCreative.content && !payloadCreative.inlineContent) {
			return { elements: [], paging: undefined };
		}

		if (payloadCreative.content) {
			try {
				const response = await this.makeRequest<any>(
					'POST',
					'/rest/adPreviews',
					{ action: 'livePreviewForCreative' },
					{ creative: payloadCreative }
				);
				const elements = this.normalizeElements(response);
				if (elements.length > 0) {
					return { ...response, elements };
				}
			} catch (e: any) {
				const status = e?.status ?? e?.statusCode ?? e?.cause?.status ?? e?.cause?.statusCode;
				if (status === 501) {
					this.debugLog('adPreview-live-not-implemented', {
						action: 'livePreviewForCreative',
						status,
						error: this.safeSerialize(e),
					});
					return { elements: [], paging: undefined, notImplemented: true };
				}
				throw e;
			}
		}

		if (payloadCreative.inlineContent) {
			try {
				const response = await this.makeRequest<any>(
					'POST',
					'/rest/adPreviews',
					{ action: 'livePreviewForCreativeInline' },
					{ creative: payloadCreative }
				);
				return { ...response, elements: this.normalizeElements(response) };
			} catch (e: any) {
				const status = e?.status ?? e?.statusCode ?? e?.cause?.status ?? e?.cause?.statusCode;
				if (status === 501) {
					this.debugLog('adPreview-live-not-implemented', {
						action: 'livePreviewForCreativeInline',
						status,
						error: this.safeSerialize(e),
					});
					return { elements: [], paging: undefined, notImplemented: true };
				}
				throw e;
			}
		}

		return { elements: [], paging: undefined };
	}

	/**
	 * Get a creative. The creative id in the path is the URL-encoded URN.
	 * GET /rest/adAccounts/{adAccountId}/creatives/urn%3Ali%3AsponsoredCreative%3A{id}
	 */
	async getCreativeDetails(creativeId: string, accountIdOrUrn: string): Promise<any> {
		const accountId = this.extractAccountId(accountIdOrUrn);
		const creativeUrn = this.ensureUrn(creativeId, 'CREATIVE');
		return this.makeRequest(
			'GET',
			`/rest/adAccounts/${accountId}/creatives/${encodeURIComponent(creativeUrn)}`,
		);
	}

	/**
	 * Get analytics (performance metrics)
	 * GET /rest/adAnalyticsV2
	 * Supports analytics for accounts, campaign groups, campaigns, and creatives
	 */
	async getAnalytics(
		options: {
			dateRange: {
				start: {
					year: number;
					month: number;
					day: number;
				};
				end: {
					year: number;
					month: number;
					day: number;
				};
			};
			pivots?: Array<{
				pivot: string;
				pivotValues?: string[];
			}>;
			timeGranularity?: 'ALL' | 'DAILY' | 'MONTHLY';
			accounts?: string[];
			campaignGroups?: string[];
			campaigns?: string[];
			creatives?: string[];
			fields?: string[];
		}
	): Promise<{
		elements: Array<{
			dateRange: {
				start: { year: number; month: number; day: number };
				end: { year: number; month: number; day: number };
			};
			pivot?: string;
			pivotValue?: string;
			impressions?: number;
			clicks?: number;
			costInLocalCurrency?: number;
			externalWebsiteConversions?: number;
			oneClickLeads?: number;
			oneClickLeadFormOpens?: number;
			opens?: number;
			sends?: number;
			revenue?: number;
			videoViews?: number;
			videoCompletions?: number;
			sponsoredInMailOpens?: number;
			sponsoredInMailClicks?: number;
			sponsoredInMailSends?: number;
			sponsoredInMailCompletions?: number;
			[key: string]: any;
		}>;
	}> {
		const baseParams: Record<string, any> = {
			q: 'analytics',
			timeGranularity: options.timeGranularity || 'ALL',
		};

		// LinkedIn adAnalytics defaults to a minimal metric set when fields is omitted.
		// Always pass explicit fields when provided so downstream insights are populated.
		if (options.fields && options.fields.length > 0) {
			baseParams.fields = options.fields.join(',');
		}

		if (options.accounts && options.accounts.length > 0) {
			const urns = options.accounts.map((v) => this.ensureUrn(v, 'ACCOUNT'));
			baseParams.accounts = this.toLinkedInListEncoded(urns);
		}

		if (options.campaignGroups && options.campaignGroups.length > 0) {
			const urns = options.campaignGroups.map((v) => this.ensureUrn(v, 'CAMPAIGN_GROUP'));
			baseParams.campaignGroups = this.toLinkedInListEncoded(urns);
		}

		if (options.campaigns && options.campaigns.length > 0) {
			const urns = options.campaigns.map((v) => this.ensureUrn(v, 'CAMPAIGN'));
			baseParams.campaigns = this.toLinkedInListEncoded(urns);
		}

		if (options.creatives && options.creatives.length > 0) {
			const urns = options.creatives.map((v) => this.ensureUrn(v, 'CREATIVE'));
			baseParams.creatives = this.toLinkedInListEncoded(urns);
		}

		if (options.pivots && options.pivots.length > 0) {
			baseParams.pivot = options.pivots[0]?.pivot;
		}
		if (!baseParams.pivot) {
			if (baseParams.creatives) baseParams.pivot = 'CREATIVE';
			else if (baseParams.campaigns) baseParams.pivot = 'CAMPAIGN';
			else if (baseParams.campaignGroups) baseParams.pivot = 'CAMPAIGN_GROUP';
			else if (baseParams.accounts) baseParams.pivot = 'ACCOUNT';
		}

		return this.makeRequest('GET', '/rest/adAnalytics', {
			...baseParams,
			dateRange: this.formatAnalyticsDateRange(options.dateRange),
		});
	}

	/**
	 * Resolve targeting URNs to display names.
	 * GET /rest/adTargetingEntities?q=urns&queryVersion=QUERY_USES_URNS&urns=List(encoded URNs)
	 */
	async resolveTargetingNames(urns: string[]): Promise<Map<string, string>> {
		const unique = [...new Set(urns.filter((urn) => urn.startsWith('urn:li:')))];
		const names = new Map<string, string>();
		const chunkSize = 50;

		for (let index = 0; index < unique.length; index += chunkSize) {
			const chunk = unique.slice(index, index + chunkSize);
			const encoded = chunk.map((urn) => encodeURIComponent(urn)).join(',');
			try {
				const response = await this.makeRequest<any>('GET', '/rest/adTargetingEntities', {
					q: 'urns',
					queryVersion: 'QUERY_USES_URNS',
					urns: `List(${encoded})`,
					locale: '(language:en,country:US)',
				});
				for (const element of this.normalizeElements(response)) {
					const urn = typeof element?.urn === 'string' ? element.urn : '';
					const name = typeof element?.name === 'string' ? element.name.trim() : '';
					if (urn && name) names.set(urn, name);
				}
			} catch (error: any) {
				this.debugLog('targeting-names-failed', {
					count: chunk.length,
					message: error?.message,
				});
			}
		}

		return names;
	}
}

