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

	constructor(config: LinkedInApiConfig) {
		this.config = {
			accessToken: config.accessToken,
			apiVersion: config.apiVersion || '202501',
			baseUrl: config.baseUrl || 'https://api.linkedin.com',
		};
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
		const url = new URL(`${this.config.baseUrl}${endpoint}`);

		// Add query parameters
		if (params) {
			for (const [key, value] of Object.entries(params)) {
				if (value !== undefined && value !== null) {
					if (Array.isArray(value)) {
						url.searchParams.set(key, value.join(','));
					} else if (typeof value === 'object') {
						url.searchParams.set(key, JSON.stringify(value));
					} else {
						url.searchParams.set(key, String(value));
					}
				}
			}
		}

		const requestOptions: any = {
			method,
			headers: {
				'Authorization': `Bearer ${this.config.accessToken}`,
				'Content-Type': 'application/json',
				'LinkedIn-Version': this.config.apiVersion,
				'X-Restli-Protocol-Version': '2.0.0',
			},
		};

		if (body && (method === 'POST' || method === 'PUT')) {
			requestOptions.body = JSON.stringify(body);
		}

		try {
			const response = await request(url.toString(), requestOptions);

			// Check response status code
			if (response.statusCode && response.statusCode >= 400) {
				let errorData: any = null;
				let responseText = '';

				try {
					responseText = await response.body.text();
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

		const params: Record<string, any> = {
			fields: (options?.fields || defaultFields).join(','),
		};

		if (options?.start !== undefined) {
			params.start = options.start;
		}

		if (options?.count !== undefined) {
			params.count = options.count;
		}

		return this.makeRequest('GET', '/rest/adAccountsV2', params);
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

		const fieldsToFetch = fields || defaultFields;

		return this.makeRequest('GET', `/rest/adAccountsV2/${accountId}`, {
			fields: fieldsToFetch.join(','),
		});
	}

	/**
	 * List campaign groups for an ad account
	 * GET /rest/adCampaignGroupsV2
	 */
	async getCampaignGroups(
		accountUrn: string,
		options?: {
			fields?: string[];
			start?: number;
			count?: number;
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

		const params: Record<string, any> = {
			account: accountUrn,
			fields: (options?.fields || defaultFields).join(','),
		};

		if (options?.start !== undefined) {
			params.start = options.start;
		}

		if (options?.count !== undefined) {
			params.count = options.count;
		}

		return this.makeRequest('GET', '/rest/adCampaignGroupsV2', params);
	}

	/**
	 * Get campaign group details
	 * GET /rest/adCampaignGroupsV2/{id}
	 */
	async getCampaignGroupDetails(
		campaignGroupId: string,
		fields?: string[]
	): Promise<any> {
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

		const fieldsToFetch = fields || defaultFields;

		return this.makeRequest('GET', `/rest/adCampaignGroupsV2/${campaignGroupId}`, {
			fields: fieldsToFetch.join(','),
		});
	}

	/**
	 * List campaigns (ad sets) for a campaign group
	 * GET /rest/adCampaignsV2
	 */
	async getCampaigns(
		campaignGroupUrn: string,
		options?: {
			fields?: string[];
			start?: number;
			count?: number;
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
			'campaignGroup',
			'account',
			'runSchedule',
			'costType',
			'unitCost',
			'dailyBudget',
			'totalBudget',
			'targetingCriteria',
			'created',
			'lastModified',
		];

		const params: Record<string, any> = {
			campaignGroup: campaignGroupUrn,
			fields: (options?.fields || defaultFields).join(','),
		};

		if (options?.start !== undefined) {
			params.start = options.start;
		}

		if (options?.count !== undefined) {
			params.count = options.count;
		}

		return this.makeRequest('GET', '/rest/adCampaignsV2', params);
	}

	/**
	 * Get campaign details
	 * GET /rest/adCampaignsV2/{id}
	 */
	async getCampaignDetails(campaignId: string, fields?: string[]): Promise<any> {
		const defaultFields = [
			'id',
			'name',
			'status',
			'campaignGroup',
			'account',
			'runSchedule',
			'costType',
			'unitCost',
			'dailyBudget',
			'totalBudget',
			'targetingCriteria',
			'created',
			'lastModified',
		];

		const fieldsToFetch = fields || defaultFields;

		return this.makeRequest('GET', `/rest/adCampaignsV2/${campaignId}`, {
			fields: fieldsToFetch.join(','),
		});
	}

	/**
	 * List creatives (ads) for a campaign
	 * GET /rest/adCreativesV2
	 */
	async getCreatives(
		campaignUrn: string,
		options?: {
			fields?: string[];
			start?: number;
			count?: number;
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

		const params: Record<string, any> = {
			campaign: campaignUrn,
			fields: (options?.fields || defaultFields).join(','),
		};

		if (options?.start !== undefined) {
			params.start = options.start;
		}

		if (options?.count !== undefined) {
			params.count = options.count;
		}

		return this.makeRequest('GET', '/rest/adCreativesV2', params);
	}

	/**
	 * Get creative details
	 * GET /rest/adCreativesV2/{id}
	 */
	async getCreativeDetails(creativeId: string, fields?: string[]): Promise<any> {
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

		const fieldsToFetch = fields || defaultFields;

		return this.makeRequest('GET', `/rest/adCreativesV2/${creativeId}`, {
			fields: fieldsToFetch.join(','),
		});
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
		const defaultFields = [
			'impressions',
			'clicks',
			'costInLocalCurrency',
			'externalWebsiteConversions',
			'oneClickLeads',
			'videoViews',
			'videoCompletions',
		];

		const params: Record<string, any> = {
			dateRange: JSON.stringify(options.dateRange),
			fields: (options.fields || defaultFields).join(','),
		};

		if (options.timeGranularity) {
			params.timeGranularity = options.timeGranularity;
		}

		if (options.accounts && options.accounts.length > 0) {
			params.accounts = options.accounts.join(',');
		}

		if (options.campaignGroups && options.campaignGroups.length > 0) {
			params.campaignGroups = options.campaignGroups.join(',');
		}

		if (options.campaigns && options.campaigns.length > 0) {
			params.campaigns = options.campaigns.join(',');
		}

		if (options.creatives && options.creatives.length > 0) {
			params.creatives = options.creatives.join(',');
		}

		if (options.pivots && options.pivots.length > 0) {
			params.pivots = JSON.stringify(options.pivots);
		}

		return this.makeRequest('GET', '/rest/adAnalyticsV2', params);
	}
}

