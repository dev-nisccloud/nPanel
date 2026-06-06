import { request } from 'undici';
export class OpenProviderApiError extends Error {
    code;
    description;
    originalError;
    /** Full API response body when error is from OpenProvider API (status >= 400 or code !== 0). */
    rawResponse;
    constructor(code, description, originalError, rawResponse) {
        super(`OpenProvider API Error ${code}: ${description}`);
        this.code = code;
        this.description = description;
        this.originalError = originalError;
        this.name = 'OpenProviderApiError';
        this.rawResponse = rawResponse;
    }
}
/**
 * Extract a rich human-readable error description from an OpenProvider API response body.
 * Inspects registry, data, message, and warnings fields - the same extraction used for HTTP >= 400
 * responses - so callers that receive non-zero codes on HTTP 200 responses get the same detail.
 */
export function buildOpenProviderApiError(responseData, fallbackDesc = 'Unknown error', httpStatusCode) {
    if (!responseData || typeof responseData !== 'object') {
        return new OpenProviderApiError(0, fallbackDesc, undefined, responseData);
    }
    const errorData = responseData;
    const code = typeof errorData.code === 'number' ? errorData.code : 0;
    const baseDesc = (typeof errorData.desc === 'string' && errorData.desc.trim())
        ? errorData.desc.trim()
        : fallbackDesc;
    const extras = [];
    if (errorData.registry && typeof errorData.registry === 'object') {
        const reg = errorData.registry;
        const regStrings = [reg.message, reg.description, reg.msg, reg.error, reg.detail, reg.registry_message]
            .filter((v) => typeof v === 'string' && v.trim().length > 0)
            .map((s) => s.trim());
        if (regStrings.length)
            extras.push(`Registry: ${regStrings.join('   ')}`);
    }
    if (typeof errorData.data === 'string' && errorData.data.trim()) {
        extras.push(`Details: ${errorData.data.trim()}`);
    }
    else if (errorData.data && typeof errorData.data === 'object') {
        const d = errorData.data;
        const dataStrings = [d.message, d.description, d.error, d.detail, d.registry_message]
            .filter((v) => typeof v === 'string' && v.trim().length > 0)
            .map((s) => s.trim());
        if (dataStrings.length)
            extras.push(dataStrings.join('   '));
    }
    if (typeof errorData.message === 'string' && errorData.message.trim()) {
        extras.push(errorData.message.trim());
    }
    if (Array.isArray(errorData.warnings) && errorData.warnings.length > 0) {
        const msgs = errorData.warnings
            .map((w) => (typeof w === 'string' ? w : w?.message ?? w?.desc ?? String(w)))
            .filter(Boolean);
        if (msgs.length)
            extras.push(`Warnings: ${msgs.join('; ')}`);
    }
    const hasConcreteDetail = extras.length > 0;
    const useOnlyExtras = code === 399 && hasConcreteDetail;
    const description = useOnlyExtras
        ? extras.join(' ')
        : hasConcreteDetail
            ? `${extras.join(' ')}. ${baseDesc}`
            : baseDesc;
    return new OpenProviderApiError(code, description, httpStatusCode !== undefined ? new Error(`HTTP ${httpStatusCode}`) : undefined, responseData);
}
export class OpenProviderClient {
    token = null;
    baseUrl;
    constructor(config) {
        this.baseUrl = `${config.baseUrl}/${config.apiVersion}`;
    }
    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
    }
    /**
     * Check if client is authenticated
     */
    isAuthenticated() {
        return this.token !== null;
    }
    /**
     * Make HTTP request using undici
     */
    async makeRequest(method, endpoint, data, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }
        // FIX: Add timeout to prevent 504 Gateway Timeout errors
        // Use longer timeout for domain checks and TLD retrieval (60 seconds) as they can take longer
        const timeoutDuration = (endpoint.includes('/domains/check') || endpoint.includes('/tlds')) ? 60000 : 30000;
        const controller = new AbortController();
        let timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
        const requestOptions = {
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
                throw new OpenProviderApiError(response.statusCode || 0, `OpenProvider API returned HTML instead of JSON (likely authentication error or invalid endpoint). Status: ${response.statusCode || 'unknown'}. Error: ${extractedError}. Please check your OPENPROVIDER_USERNAME, OPENPROVIDER_PASSWORD, and OPENPROVIDER_BASE_URL environment variables.`, new Error(`Non-JSON response from OpenProvider API`));
            }
            // Try to parse as JSON
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            }
            catch (parseError) {
                // Failed to parse as JSON
                throw new OpenProviderApiError(response.statusCode || 0, `Failed to parse JSON response from OpenProvider API. Response preview: ${responseText.substring(0, 200)}`, parseError instanceof Error ? parseError : new Error('JSON parse error'));
            }
            if (response.statusCode >= 400) {
                const err = buildOpenProviderApiError(responseData, `HTTP ${response.statusCode}`, response.statusCode);
                // Clear token on auth errors so next request will re-authenticate
                if (err.code === 401 || err.code === 403) {
                    this.clearAuth();
                }
                throw err;
            }
            return responseData;
        }
        catch (error) {
            // Clear timeout if still set
            if (typeof timeoutId !== 'undefined') {
                clearTimeout(timeoutId);
            }
            // Handle timeout/abort errors
            if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
                const timeoutMsg = (endpoint.includes('/domains/check') || endpoint.includes('/tlds'))
                    ? 'Request timeout: OpenProvider API did not respond within 60 seconds. This may be due to high load or network issues.'
                    : 'Request timeout: OpenProvider API did not respond within 30 seconds. This may be due to high load or network issues.';
                throw new OpenProviderApiError(504, timeoutMsg, error);
            }
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    /**
     * Authenticate with OpenProvider API
     */
    async authenticate(credentials) {
        try {
            const response = await this.makeRequest('POST', '/auth/login', credentials);
            if (response.code === 0 && response.data?.token) {
                this.token = response.data.token;
            }
            else if (response.code !== 0) {
                // OpenProvider returned HTTP 200 but with a non-zero application code (e.g. wrong credentials, IP restriction)
                // We must throw here so callers' catch blocks fire and get the real error message.
                throw new OpenProviderApiError(response.code, response.desc || `Authentication failed with code ${response.code}`);
            }
            return response;
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to authenticate', error);
        }
    }
    /**
     * Get TLDs with pricing and configuration
     */
    async getTlds(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.offset)
                queryParams.append('offset', params.offset.toString());
            if (params.extensions)
                queryParams.append('extensions', params.extensions.join(','));
            if (params.status)
                queryParams.append('status', params.status);
            if (params.with_price !== undefined)
                queryParams.append('with_price', params.with_price.toString());
            if (params.with_description !== undefined)
                queryParams.append('with_description', params.with_description.toString());
            if (params.with_restrictions !== undefined)
                queryParams.append('with_restrictions', params.with_restrictions.toString());
            const endpoint = `/tlds${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            return await this.makeRequest('GET', endpoint);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to get TLDs', error);
        }
    }
    /**
     * Check domain availability and pricing
     */
    async checkDomains(params) {
        try {
            return await this.makeRequest('POST', '/domains/check', params);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to check domains', error);
        }
    }
    /**
     * Create a new customer handle
     */
    async createCustomer(params) {
        try {
            return await this.makeRequest('POST', '/customers', params);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to create customer', error);
        }
    }
    /**
     * Search existing customer handles
     */
    async searchCustomers(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.handle_pattern)
                queryParams.append('handle_pattern', params.handle_pattern);
            if (params.email_pattern)
                queryParams.append('email_pattern', params.email_pattern);
            if (params.first_name_pattern)
                queryParams.append('first_name_pattern', params.first_name_pattern);
            if (params.last_name_pattern)
                queryParams.append('last_name_pattern', params.last_name_pattern);
            if (params.company_name_pattern)
                queryParams.append('company_name_pattern', params.company_name_pattern);
            if (params.comment_pattern)
                queryParams.append('comment_pattern', params.comment_pattern);
            if (params.with_additional_data !== undefined)
                queryParams.append('with_additional_data', params.with_additional_data.toString());
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.offset)
                queryParams.append('offset', params.offset.toString());
            const endpoint = `/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            return await this.makeRequest('GET', endpoint);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to search customers', error);
        }
    }
    /**
     * Update an existing customer handle
     */
    async updateCustomer(handle, params) {
        try {
            return await this.makeRequest('PUT', `/customers/${handle}`, params);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to update customer', error);
        }
    }
    async getCustomer(handle) {
        try {
            return await this.makeRequest('GET', `/customers/${handle}`);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError)
                throw error;
            throw new OpenProviderApiError(0, 'Failed to get customer', error);
        }
    }
    /**
     * Start email verification for gTLD
     */
    async startEmailVerification(params) {
        try {
            return await this.makeRequest('POST', '/customers/verifications/emails/start', params);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to start email verification', error);
        }
    }
    /**
     * Check email verification status
     */
    async checkEmailVerificationStatus(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params.domain)
                queryParams.append('domain', params.domain);
            if (params.handle)
                queryParams.append('handle', params.handle);
            if (params.email)
                queryParams.append('email', params.email);
            if (params.status)
                queryParams.append('status', params.status);
            if (params.is_suspended !== undefined)
                queryParams.append('is_suspended', params.is_suspended.toString());
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.offset)
                queryParams.append('offset', params.offset.toString());
            const endpoint = `/customers/verifications/emails/domains${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            return await this.makeRequest('GET', endpoint);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to check email verification status', error);
        }
    }
    /**
     * Register a domain
     */
    async registerDomain(params) {
        try {
            return await this.makeRequest('POST', '/domains', params);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to register domain', error);
        }
    }
    /**
     * Transfer a domain
     */
    async transferDomain(params) {
        try {
            return await this.makeRequest('POST', '/domains/transfer', params);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to transfer domain', error);
        }
    }
    /**
     * Search domains
     */
    async searchDomains(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.domain_name_pattern)
                queryParams.append('domain_name_pattern', params.domain_name_pattern);
            if (params.status)
                queryParams.append('status', params.status);
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.offset)
                queryParams.append('offset', params.offset.toString());
            if (params.with_registry_statuses) {
                queryParams.append('with_registry_statuses', 'true');
            }
            const endpoint = `/domains${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            return await this.makeRequest('GET', endpoint);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to search domains', error);
        }
    }
    /**
     * Update domain attributes
     */
    async updateDomain(id, params) {
        try {
            return await this.makeRequest('PUT', `/domains/${id}`, params);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to update domain', error);
        }
    }
    /**
     * Renew a domain
     */
    async renewDomain(id, params) {
        try {
            return await this.makeRequest('POST', `/domains/${id}/renew`, params);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to renew domain', error);
        }
    }
    /**
     * Get domain auth code
     */
    async getDomainAuthCode(id, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.auth_code_type)
                queryParams.append('auth_code_type', params.auth_code_type);
            const endpoint = `/domains/${id}/authcode${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            return await this.makeRequest('GET', endpoint);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to get domain auth code', error);
        }
    }
    /**
     * Reset domain auth code
     */
    async resetDomainAuthCode(id, params) {
        try {
            return await this.makeRequest('POST', `/domains/${id}/authcode/reset`, params);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to reset domain auth code', error);
        }
    }
    /**
     * Delete a domain
     */
    async deleteDomain(id, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.domain?.name)
                queryParams.append('domain.name', params.domain.name);
            if (params.domain?.extension)
                queryParams.append('domain.extension', params.domain.extension);
            const endpoint = `/domains/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            return await this.makeRequest('DELETE', endpoint);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to delete domain', error);
        }
    }
    /**
     * Restore a domain
     */
    async restoreDomain(id, params = {}) {
        try {
            return await this.makeRequest('POST', `/domains/${id}/restore`, params);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to restore domain', error);
        }
    }
    /**
     * Get domain pricing
     */
    async getDomainPricing(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params.domain?.name)
                queryParams.append('domain.name', params.domain.name);
            if (params.domain?.extension)
                queryParams.append('domain.extension', params.domain.extension);
            if (params.operation)
                queryParams.append('operation', params.operation);
            if (params.period)
                queryParams.append('period', params.period.toString());
            if (params.additional_data?.idn_script)
                queryParams.append('additional_data.idn_script', params.additional_data.idn_script);
            const endpoint = `/domains/prices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            return await this.makeRequest('GET', endpoint);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to get domain pricing', error);
        }
    }
    /**
     * Get additional data requirements for domain
     */
    async getAdditionalData(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params.domain?.extension)
                queryParams.append('domain.extension', params.domain.extension);
            const endpoint = `/domains/additional-data${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            return await this.makeRequest('GET', endpoint);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to get additional data', error);
        }
    }
    /**
     * Get additional data requirements for customer
     */
    async getCustomerAdditionalData(params) {
        try {
            const queryParams = new URLSearchParams();
            if (params.domain?.extension)
                queryParams.append('domain.extension', params.domain.extension);
            const endpoint = `/domains/additional-data/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            return await this.makeRequest('GET', endpoint);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to get customer additional data', error);
        }
    }
    /**
     * Create DNS zone
     */
    async createDnsZone(params) {
        try {
            return await this.makeRequest('POST', '/dns/zones', params);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to create DNS zone', error);
        }
    }
    /**
     * List DNS zones
     */
    async listDnsZones(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.offset)
                queryParams.append('offset', params.offset.toString());
            if (params.name_pattern)
                queryParams.append('name_pattern', params.name_pattern);
            if (params.type)
                queryParams.append('type', params.type);
            if (params.with_records !== undefined)
                queryParams.append('with_records', params.with_records.toString());
            if (params.with_history !== undefined)
                queryParams.append('with_history', params.with_history.toString());
            const endpoint = `/dns/zones${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            return await this.makeRequest('GET', endpoint);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to list DNS zones', error);
        }
    }
    /**
     * Get specific DNS zone.
     * Per OpenProvider docs (8xx = DNS module), code 872 = "Zone specified is not found."
     * When the API returns HTTP 5xx/4xx with code 872, we return a normal response shape
     * so callers can treat "zone not found" as a valid state instead of an exception.
     */
    async getDnsZone(name, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.with_records !== undefined)
                queryParams.append('with_records', params.with_records.toString());
            if (params.with_history !== undefined)
                queryParams.append('with_history', params.with_history.toString());
            if (params.with_dnskey !== undefined)
                queryParams.append('with_dnskey', params.with_dnskey.toString());
            const endpoint = `/dns/zones/${encodeURIComponent(name)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            return await this.makeRequest('GET', endpoint);
        }
        catch (error) {
            const code = error instanceof OpenProviderApiError ? error.code : error?.code;
            if (code === 872) {
                return { code: 872, desc: 'Zone specified is not found.', data: { success: false } };
            }
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to get DNS zone', error);
        }
    }
    /**
     * Update DNS zone
     */
    async updateDnsZone(name, params) {
        try {
            return await this.makeRequest('PUT', `/dns/zones/${encodeURIComponent(name)}`, params);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to update DNS zone', error);
        }
    }
    /**
     * Delete DNS zone
     */
    async deleteDnsZone(name) {
        try {
            return await this.makeRequest('DELETE', `/dns/zones/${encodeURIComponent(name)}`);
        }
        catch (error) {
            if (error instanceof OpenProviderApiError) {
                throw error;
            }
            throw new OpenProviderApiError(0, 'Failed to delete DNS zone', error);
        }
    }
    /**
     * Clear authentication token
     */
    clearAuth() {
        this.token = null;
    }
}
/**
 * Create OpenProvider client instance
 */
// Singleton instance with token caching
let clientInstance = null;
let tokenExpiry = null;
export function createOpenProviderClient() {
    // Return existing instance only if it is actually authenticated AND the token hasn't expired.
    // Previously, tokenExpiry was set at instance creation   before auth   so a failed auth would
    // return an unauthenticated singleton for 47 hours on every subsequent request.
    if (clientInstance && clientInstance.isAuthenticated() && tokenExpiry && Date.now() < tokenExpiry) {
        return clientInstance;
    }
    // Use env vars   fall back to sensible defaults so misconfigured envs still work
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
export function clearOpenProviderClient() {
    clientInstance = null;
    tokenExpiry = null;
}
