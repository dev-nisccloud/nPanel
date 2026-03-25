import { request } from 'undici';
import type {
  OpenProviderConfig,
  OpenProviderAuthRequest,
  OpenProviderAuthResponse,
  OpenProviderTldRequest,
  OpenProviderTldResponse,
  OpenProviderDomainCheckRequest,
  OpenProviderDomainCheckResponse,
  OpenProviderCustomerRequest,
  OpenProviderCustomerResponse,
  OpenProviderCustomerSearchRequest,
  OpenProviderCustomerSearchResponse,
  OpenProviderDomainRegistrationRequest,
  OpenProviderDomainRegistrationResponse,
  OpenProviderDomainTransferRequest,
  OpenProviderDomainTransferResponse,
  OpenProviderDomainSearchRequest,
  OpenProviderDomainSearchResponse,
  OpenProviderDomainUpdateRequest,
  OpenProviderDomainUpdateResponse,
  OpenProviderDomainRenewalRequest,
  OpenProviderDomainRenewalResponse,
  OpenProviderAuthCodeResponse,
  OpenProviderAuthCodeResetRequest,
  OpenProviderAuthCodeResetResponse,
  OpenProviderDnsZoneRequest,
  OpenProviderDnsZoneResponse,
  OpenProviderDnsZoneSearchRequest,
  OpenProviderDnsZoneSearchResponse,
  OpenProviderDnsZoneUpdateRequest,
  OpenProviderDnsZoneUpdateResponse,
  OpenProviderDomainPricingRequest,
  OpenProviderDomainPricingResponse,
  OpenProviderAdditionalDataRequest,
  OpenProviderAdditionalDataResponse,
  OpenProviderCustomerAdditionalDataRequest,
  OpenProviderCustomerAdditionalDataResponse,
  OpenProviderError,
} from '../types/openprovider';

export class OpenProviderApiError extends Error {
  /** Full API response body when error is from OpenProvider API (status >= 400 or code !== 0). */
  public readonly rawResponse?: unknown;

  constructor(
    public code: number,
    public description: string,
    public originalError?: Error,
    rawResponse?: unknown
  ) {
    super(`OpenProvider API Error ${code}: ${description}`);
    this.name = 'OpenProviderApiError';
    this.rawResponse = rawResponse;
  }
}

export class OpenProviderClient {
  private token: string | null = null;
  private baseUrl: string;

  constructor(config: OpenProviderConfig) {
    this.baseUrl = `${config.baseUrl}/${config.apiVersion}`;
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  /**
   * Make HTTP request using undici
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    options: any = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    // FIX: Add timeout to prevent 504 Gateway Timeout errors
    // Use longer timeout for domain checks (60 seconds) as they can take longer with many domains
    const timeoutDuration = endpoint.includes('/domains/check') ? 60000 : 30000; // 60s for domain checks, 30s for others
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | undefined = setTimeout(() => controller.abort(), timeoutDuration);

    const requestOptions: any = {
      method,
      headers,
      signal: controller.signal,
      ...options,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      const response = await request(url, requestOptions);
      if (timeoutId) {
        clearTimeout(timeoutId); // Clear timeout on success
        timeoutId = undefined;
      }
      
      // Read response as text first to handle HTML error pages
      const responseText = await response.body.text();
      
      // Check if response is HTML (starts with <html, <HTML, or <!DOCTYPE)
      const trimmedText = responseText.trim();
      const isHtml = trimmedText.toLowerCase().startsWith('<html') || 
                     trimmedText.toLowerCase().startsWith('<!doctype') ||
                     trimmedText.startsWith('<');
      
      if (isHtml) {
        // Response is HTML (likely error page from authentication failure or wrong endpoint)
        const titleMatch = responseText.match(/<title[^>]*>([^<]+)<\/title>/i);
        const h1Match = responseText.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        const extractedError = titleMatch?.[1] || h1Match?.[1] || (responseText.length > 500 ? responseText.substring(0, 500) + '...' : responseText);
        
        throw new OpenProviderApiError(
          response.statusCode || 0,
          `OpenProvider API returned HTML instead of JSON (likely authentication error or invalid endpoint). Status: ${response.statusCode || 'unknown'}. Error: ${extractedError}. Please check your OPENPROVIDER_USERNAME, OPENPROVIDER_PASSWORD, and OPENPROVIDER_BASE_URL environment variables.`,
          new Error(`Non-JSON response from OpenProvider API`)
        );
      }
      
      // Try to parse as JSON
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        // Failed to parse as JSON
        throw new OpenProviderApiError(
          response.statusCode || 0,
          `Failed to parse JSON response from OpenProvider API. Response preview: ${responseText.substring(0, 200)}`,
          parseError instanceof Error ? parseError : new Error('JSON parse error')
        );
      }

      if (response.statusCode >= 400) {
        const errorData = responseData as OpenProviderError & Record<string, unknown>;
        const baseDesc = errorData.desc || `HTTP ${response.statusCode}`;
        const extras: string[] = [];
        // OpenProvider often returns registry/nameserver errors with extra details (e.g. error 399)
        if (errorData.registry && typeof errorData.registry === 'object') {
          const reg = errorData.registry as Record<string, unknown>;
          const regStrings = [
            reg.message,
            reg.description,
            reg.msg,
            reg.error,
            reg.detail,
            (reg as any).registry_message,
          ]
            .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
            .map((s) => s.trim());
          if (regStrings.length) extras.push(`Registry: ${regStrings.join(' — ')}`);
        }
        // data can be "Additional error description" (string) or an object with message/description/etc.
        if (typeof errorData.data === 'string' && errorData.data.trim()) {
          extras.push(`Details: ${errorData.data.trim()}`);
        } else if (errorData.data && typeof errorData.data === 'object') {
          const d = errorData.data as Record<string, unknown>;
          const dataStrings = [
            d.message,
            d.description,
            d.error,
            d.detail,
            (d as any).registry_message,
          ]
            .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
            .map((s) => s.trim());
          if (dataStrings.length) extras.push(dataStrings.join(' — '));
        }
        // Top-level message (e.g. some endpoints put the registry message here)
        if (typeof errorData.message === 'string' && errorData.message.trim()) {
          extras.push(errorData.message.trim());
        }
        if (Array.isArray(errorData.warnings) && errorData.warnings.length > 0) {
          const msgs = errorData.warnings
            .map((w: unknown) => (typeof w === 'string' ? w : (w as Record<string, unknown>)?.message ?? (w as Record<string, unknown>)?.desc ?? String(w)))
            .filter(Boolean);
          if (msgs.length) extras.push(`Warnings: ${msgs.join('; ')}`);
        }
        const code = errorData.code ?? response.statusCode;
        // Clear token on auth errors so next request will re-authenticate
        if (code === 401 || code === 403) {
          this.clearAuth();
        }
        // For 399, if we have concrete Details/Registry text, use only that and omit the generic "refer to registry message below"
        const hasConcreteDetail = extras.length > 0;
        const useOnlyExtras = code === 399 && hasConcreteDetail;
        const description = useOnlyExtras
          ? extras.join(' ')
          : hasConcreteDetail
            ? `${extras.join(' ')}. ${baseDesc}`
            : baseDesc;
        throw new OpenProviderApiError(
          code,
          description,
          new Error(`HTTP ${response.statusCode}`),
          responseData
        );
      }

      return responseData;
    } catch (error) {
      // Clear timeout if still set
      if (typeof timeoutId !== 'undefined') {
        clearTimeout(timeoutId);
      }

      // Handle timeout/abort errors
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
        const timeoutMsg = endpoint.includes('/domains/check') 
          ? 'Request timeout: OpenProvider API did not respond within 60 seconds. This may be due to high load or network issues.'
          : 'Request timeout: OpenProvider API did not respond within 30 seconds. This may be due to high load or network issues.';
        throw new OpenProviderApiError(
          504,
          timeoutMsg,
          error
        );
      }

      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(
        0,
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  /**
   * Authenticate with OpenProvider API
   */
  async authenticate(credentials: OpenProviderAuthRequest): Promise<OpenProviderAuthResponse> {
    try {
      const response = await this.makeRequest<OpenProviderAuthResponse>('POST', '/auth/login', credentials);
      
      if (response.code === 0 && response.data?.token) {
        this.token = response.data.token;
      } else if (response.code !== 0) {
        // OpenProvider returned HTTP 200 but with a non-zero application code (e.g. wrong credentials, IP restriction)
        // We must throw here so callers' catch blocks fire and get the real error message.
        throw new OpenProviderApiError(
          response.code,
          response.desc || `Authentication failed with code ${response.code}`,
        );
      }
      
      return response;
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to authenticate', error as Error);
    }
  }

  /**
   * Get TLDs with pricing and configuration
   */
  async getTlds(params: OpenProviderTldRequest = {}): Promise<OpenProviderTldResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.extensions) queryParams.append('extensions', params.extensions.join(','));
      if (params.status) queryParams.append('status', params.status);
      if (params.with_price !== undefined) queryParams.append('with_price', params.with_price.toString());
      if (params.with_description !== undefined) queryParams.append('with_description', params.with_description.toString());
      if (params.with_restrictions !== undefined) queryParams.append('with_restrictions', params.with_restrictions.toString());

      const endpoint = `/tlds${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await this.makeRequest<OpenProviderTldResponse>('GET', endpoint);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to get TLDs', error as Error);
    }
  }

  /**
   * Check domain availability and pricing
   */
  async checkDomains(params: OpenProviderDomainCheckRequest): Promise<OpenProviderDomainCheckResponse> {
    try {
      return await this.makeRequest<OpenProviderDomainCheckResponse>('POST', '/domains/check', params);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to check domains', error as Error);
    }
  }

  /**
   * Create a new customer handle
   */
  async createCustomer(params: OpenProviderCustomerRequest): Promise<OpenProviderCustomerResponse> {
    try {
      return await this.makeRequest<OpenProviderCustomerResponse>('POST', '/customers', params);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to create customer', error as Error);
    }
  }

  /**
   * Search existing customer handles
   */
  async searchCustomers(params: OpenProviderCustomerSearchRequest = {}): Promise<OpenProviderCustomerSearchResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.handle_pattern) queryParams.append('handle_pattern', params.handle_pattern);
      if (params.email_pattern) queryParams.append('email_pattern', params.email_pattern);
      if (params.first_name_pattern) queryParams.append('first_name_pattern', params.first_name_pattern);
      if (params.last_name_pattern) queryParams.append('last_name_pattern', params.last_name_pattern);
      if (params.company_name_pattern) queryParams.append('company_name_pattern', params.company_name_pattern);
      if (params.comment_pattern) queryParams.append('comment_pattern', params.comment_pattern);
      if (params.with_additional_data !== undefined) queryParams.append('with_additional_data', params.with_additional_data.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());

      const endpoint = `/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await this.makeRequest<OpenProviderCustomerSearchResponse>('GET', endpoint);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to search customers', error as Error);
    }
  }

  /**
   * Update an existing customer handle
   */
  async updateCustomer(handle: string, params: Partial<OpenProviderCustomerRequest>): Promise<OpenProviderCustomerResponse> {
    try {
      return await this.makeRequest<OpenProviderCustomerResponse>('PUT', `/customers/${handle}`, params);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to update customer', error as Error);
    }
  }

  /**
   * Start email verification for gTLD
   */
  async startEmailVerification(params: { email: string; handle: string; language?: string }): Promise<{ code: number; desc: string; data: { id: string } }> {
    try {
      return await this.makeRequest('POST', '/customers/verifications/emails/start', params);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to start email verification', error as Error);
    }
  }

  /**
   * Check email verification status
   */
  async checkEmailVerificationStatus(params: { domain?: string; handle?: string; email?: string; status?: string; is_suspended?: boolean; limit?: number; offset?: number }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.domain) queryParams.append('domain', params.domain);
      if (params.handle) queryParams.append('handle', params.handle);
      if (params.email) queryParams.append('email', params.email);
      if (params.status) queryParams.append('status', params.status);
      if (params.is_suspended !== undefined) queryParams.append('is_suspended', params.is_suspended.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());

      const endpoint = `/customers/verifications/emails/domains${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await this.makeRequest('GET', endpoint);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to check email verification status', error as Error);
    }
  }

  /**
   * Register a domain
   */
  async registerDomain(params: OpenProviderDomainRegistrationRequest): Promise<OpenProviderDomainRegistrationResponse> {
    try {
      return await this.makeRequest<OpenProviderDomainRegistrationResponse>('POST', '/domains', params);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to register domain', error as Error);
    }
  }

  /**
   * Transfer a domain
   */
  async transferDomain(params: OpenProviderDomainTransferRequest): Promise<OpenProviderDomainTransferResponse> {
    try {
      return await this.makeRequest<OpenProviderDomainTransferResponse>('POST', '/domains/transfer', params);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to transfer domain', error as Error);
    }
  }

  /**
   * Search domains
   */
  async searchDomains(params: OpenProviderDomainSearchRequest = {}): Promise<OpenProviderDomainSearchResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.domain_name_pattern) queryParams.append('domain_name_pattern', params.domain_name_pattern);
      if (params.status) queryParams.append('status', params.status);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());

      const endpoint = `/domains${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await this.makeRequest<OpenProviderDomainSearchResponse>('GET', endpoint);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to search domains', error as Error);
    }
  }

  /**
   * Update domain attributes
   */
  async updateDomain(id: number, params: OpenProviderDomainUpdateRequest): Promise<OpenProviderDomainUpdateResponse> {
    try {
      return await this.makeRequest<OpenProviderDomainUpdateResponse>('PUT', `/domains/${id}`, params);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to update domain', error as Error);
    }
  }

  /**
   * Renew a domain
   */
  async renewDomain(id: number, params: OpenProviderDomainRenewalRequest): Promise<OpenProviderDomainRenewalResponse> {
    try {
      return await this.makeRequest<OpenProviderDomainRenewalResponse>('POST', `/domains/${id}/renew`, params);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to renew domain', error as Error);
    }
  }

  /**
   * Get domain auth code
   */
  async getDomainAuthCode(id: number, params: { auth_code_type?: string } = {}): Promise<OpenProviderAuthCodeResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.auth_code_type) queryParams.append('auth_code_type', params.auth_code_type);

      const endpoint = `/domains/${id}/authcode${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await this.makeRequest<OpenProviderAuthCodeResponse>('GET', endpoint);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to get domain auth code', error as Error);
    }
  }

  /**
   * Reset domain auth code
   */
  async resetDomainAuthCode(id: number, params: OpenProviderAuthCodeResetRequest): Promise<OpenProviderAuthCodeResetResponse> {
    try {
      return await this.makeRequest<OpenProviderAuthCodeResetResponse>('POST', `/domains/${id}/authcode/reset`, params);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to reset domain auth code', error as Error);
    }
  }

  /**
   * Delete a domain
   */
  async deleteDomain(id: number, params: { domain?: { name: string; extension: string } } = {}): Promise<{ code: number; desc: string }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.domain?.name) queryParams.append('domain.name', params.domain.name);
      if (params.domain?.extension) queryParams.append('domain.extension', params.domain.extension);

      const endpoint = `/domains/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await this.makeRequest<{ code: number; desc: string }>('DELETE', endpoint);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to delete domain', error as Error);
    }
  }

  /**
   * Restore a domain
   */
  async restoreDomain(id: number, params: any = {}): Promise<{ code: number; desc: string }> {
    try {
      return await this.makeRequest<{ code: number; desc: string }>('POST', `/domains/${id}/restore`, params);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to restore domain', error as Error);
    }
  }

  /**
   * Get domain pricing
   */
  async getDomainPricing(params: OpenProviderDomainPricingRequest): Promise<OpenProviderDomainPricingResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.domain?.name) queryParams.append('domain.name', params.domain.name);
      if (params.domain?.extension) queryParams.append('domain.extension', params.domain.extension);
      if (params.operation) queryParams.append('operation', params.operation);
      if (params.period) queryParams.append('period', params.period.toString());
      if (params.additional_data?.idn_script) queryParams.append('additional_data.idn_script', params.additional_data.idn_script);

      const endpoint = `/domains/prices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await this.makeRequest<OpenProviderDomainPricingResponse>('GET', endpoint);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to get domain pricing', error as Error);
    }
  }

  /**
   * Get additional data requirements for domain
   */
  async getAdditionalData(params: OpenProviderAdditionalDataRequest): Promise<OpenProviderAdditionalDataResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.domain?.extension) queryParams.append('domain.extension', params.domain.extension);

      const endpoint = `/domains/additional-data${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await this.makeRequest<OpenProviderAdditionalDataResponse>('GET', endpoint);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to get additional data', error as Error);
    }
  }

  /**
   * Get additional data requirements for customer
   */
  async getCustomerAdditionalData(params: OpenProviderCustomerAdditionalDataRequest): Promise<OpenProviderCustomerAdditionalDataResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.domain?.extension) queryParams.append('domain.extension', params.domain.extension);

      const endpoint = `/domains/additional-data/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await this.makeRequest<OpenProviderCustomerAdditionalDataResponse>('GET', endpoint);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to get customer additional data', error as Error);
    }
  }

  /**
   * Create DNS zone
   */
  async createDnsZone(params: OpenProviderDnsZoneRequest): Promise<OpenProviderDnsZoneResponse> {
    try {
      return await this.makeRequest<OpenProviderDnsZoneResponse>('POST', '/dns/zones', params);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to create DNS zone', error as Error);
    }
  }

  /**
   * List DNS zones
   */
  async listDnsZones(params: OpenProviderDnsZoneSearchRequest = {}): Promise<OpenProviderDnsZoneSearchResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.name_pattern) queryParams.append('name_pattern', params.name_pattern);
      if (params.type) queryParams.append('type', params.type);
      if (params.with_records !== undefined) queryParams.append('with_records', params.with_records.toString());
      if (params.with_history !== undefined) queryParams.append('with_history', params.with_history.toString());

      const endpoint = `/dns/zones${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await this.makeRequest<OpenProviderDnsZoneSearchResponse>('GET', endpoint);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to list DNS zones', error as Error);
    }
  }

  /**
   * Get specific DNS zone.
   * Per OpenProvider docs (8xx = DNS module), code 872 = "Zone specified is not found."
   * When the API returns HTTP 5xx/4xx with code 872, we return a normal response shape
   * so callers can treat "zone not found" as a valid state instead of an exception.
   */
  async getDnsZone(name: string, params: { with_records?: boolean; with_history?: boolean; with_dnskey?: boolean } = {}): Promise<OpenProviderDnsZoneResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.with_records !== undefined) queryParams.append('with_records', params.with_records.toString());
      if (params.with_history !== undefined) queryParams.append('with_history', params.with_history.toString());
      if (params.with_dnskey !== undefined) queryParams.append('with_dnskey', params.with_dnskey.toString());

      const endpoint = `/dns/zones/${encodeURIComponent(name)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      return await this.makeRequest<OpenProviderDnsZoneResponse>('GET', endpoint);
    } catch (error) {
      const code = error instanceof OpenProviderApiError ? error.code : (error as { code?: number })?.code;
      if (code === 872) {
        return { code: 872, desc: 'Zone specified is not found.', data: { success: false } };
      }
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to get DNS zone', error as Error);
    }
  }

  /**
   * Update DNS zone
   */
  async updateDnsZone(name: string, params: OpenProviderDnsZoneUpdateRequest): Promise<OpenProviderDnsZoneUpdateResponse> {
    try {
      return await this.makeRequest<OpenProviderDnsZoneUpdateResponse>('PUT', `/dns/zones/${encodeURIComponent(name)}`, params);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to update DNS zone', error as Error);
    }
  }

  /**
   * Delete DNS zone
   */
  async deleteDnsZone(name: string): Promise<{ code: number; desc: string }> {
    try {
      return await this.makeRequest('DELETE', `/dns/zones/${encodeURIComponent(name)}`);
    } catch (error) {
      if (error instanceof OpenProviderApiError) {
        throw error;
      }
      throw new OpenProviderApiError(0, 'Failed to delete DNS zone', error as Error);
    }
  }

  /**
   * Clear authentication token
   */
  clearAuth(): void {
    this.token = null;
  }
}

/**
 * Create OpenProvider client instance
 */
// Singleton instance with token caching
let clientInstance: OpenProviderClient | null = null;
let tokenExpiry: number | null = null;

export function createOpenProviderClient(): OpenProviderClient {
  // Return existing instance only if it is actually authenticated AND the token hasn't expired.
  // Previously, tokenExpiry was set at instance creation — before auth — so a failed auth would
  // return an unauthenticated singleton for 47 hours on every subsequent request.
  if (clientInstance && clientInstance.isAuthenticated() && tokenExpiry && Date.now() < tokenExpiry) {
    return clientInstance;
  }

  // Use env vars — fall back to sensible defaults so misconfigured envs still work
  const baseUrl = process.env.OPENPROVIDER_BASE_URL || 'https://api.openprovider.eu';
  const apiVersion = process.env.OPENPROVIDER_API_VERSION || 'v1beta';
  const timeout = parseInt(process.env.OPENPROVIDER_TIMEOUT || '60000', 10);

  // Create new instance
  clientInstance = new OpenProviderClient({
    baseUrl,
    apiVersion,
    timeout,
  });

  // Note: tokenExpiry is intentionally set here so that after a successful authenticate() call
  // the singleton will be reused for 47 hours. If authenticate() throws, isAuthenticated()
  // returns false and a fresh instance will be created on the next request.
  tokenExpiry = Date.now() + (47 * 60 * 60 * 1000);

  return clientInstance;
}

// Function to clear cached client (useful for testing or forced re-auth)
export function clearOpenProviderClient(): void {
  clientInstance = null;
  tokenExpiry = null;
}