import { request } from 'undici';
import { getRedisClient } from './redis';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface EtimsClientConfig {
    baseUrl: string;
    tokenUrl: string;
    consumerKey: string;
    consumerSecret: string;
}

export interface EtimsOscuHeaders {
    tin: string;
    bhfId: string;
    cmcKey: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    expires_in: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/**
 * All valid KRA OSCU API endpoints per the official specification.
 * Keys are human-friendly names; values are the exact URL paths.
 */
const ENDPOINTS = {
    // Initialization
    selectInitOsdcInfo: '/selectInitOsdcInfo',
    // Code Lists
    selectCodeList: '/selectCodeList',
    // Notices
    selectNoticeList: '/selectNoticeList',
    // Customer
    selectCustomer: '/selectCustomer',
    // Branches
    selectBhfList: '/selectBhfList',
    saveBhfCustomer: '/saveBhfCustomer',
    saveBhfUser: '/saveBhfUser',
    saveBhfInsurance: '/saveBhfInsurance',
    // Items
    selectItemClsList: '/selectItemClsList',
    selectItemList: '/selectItemList',
    saveItem: '/saveItem',
    saveItemComposition: '/saveItemComposition',
    // Imported Items
    selectImportItemList: '/selectImportItemList',
    updateImportItem: '/updateImportItem',
    // Sales
    saveTrnsSalesOsdc: '/saveTrnsSalesOsdc',
    // Purchases
    selectTrnsPurchaseSalesList: '/selectTrnsPurchaseSalesList',
    insertTrnsPurchase: '/insertTrnsPurchase',
    // Stock
    selectStockMoveList: '/selectStockMoveList',
    insertStockIO: '/insertStockIO',
    saveStockMaster: '/saveStockMaster',
} as const;

type EndpointKey = keyof typeof ENDPOINTS;

const REDIS_TOKEN_KEY = 'etims:oauth_token';
const TOKEN_BUFFER_SECS = 60; // Refresh 60s before actual expiry

// ─────────────────────────────────────────────
// EtimsOscuClient
// ─────────────────────────────────────────────

export class EtimsOscuClient {
    private config: EtimsClientConfig;

    // In-process cache (fallback when Redis is unavailable)
    private memToken: string | null = null;
    private memTokenExpiresAt: number | null = null;

    constructor(config: EtimsClientConfig) {
        this.config = config;
    }

    // ───────────────────────
    // Token Management
    // ───────────────────────

    /**
     * Get a valid OAuth access token, using Redis as the primary cache
     * and an in-memory fallback. Never fetches more than once per TTL.
     */
    async getToken(forceRefresh = false): Promise<string> {
        if (!forceRefresh) {
            // 1. Try Redis first
            const redis = getRedisClient();
            if (redis) {
                try {
                    const cached = await redis.get<{ token: string; expiresAt: number }>(REDIS_TOKEN_KEY);
                    if (cached && Date.now() < cached.expiresAt * 1000) {
                        return cached.token;
                    }
                } catch {
                    // Redis failure → fall through to in-memory
                }
            }

            // 2. Try in-memory cache
            if (this.memToken && this.memTokenExpiresAt && Date.now() < this.memTokenExpiresAt * 1000) {
                return this.memToken;
            }
        }

        // 3. Fetch fresh token
        const tokenData = await this.fetchToken();
        const expiresIn = parseInt(tokenData.expires_in ?? '3600', 10);
        const expiresAt = Math.floor(Date.now() / 1000) + expiresIn - TOKEN_BUFFER_SECS;

        // Persist in-memory
        this.memToken = tokenData.access_token;
        this.memTokenExpiresAt = expiresAt;

        // Persist to Redis (best-effort)
        const redis = getRedisClient();
        if (redis) {
            try {
                await redis.set(
                    REDIS_TOKEN_KEY,
                    { token: tokenData.access_token, expiresAt },
                    { ex: expiresIn - TOKEN_BUFFER_SECS }
                );
            } catch {
                // Redis write failure is non-fatal; we still have the in-memory cache
            }
        }

        return tokenData.access_token;
    }

    async clearToken(): Promise<void> {
        this.memToken = null;
        this.memTokenExpiresAt = null;
        const redis = getRedisClient();
        if (redis) {
            try { await redis.del(REDIS_TOKEN_KEY); } catch { /* non-fatal */ }
        }
    }

    private async fetchToken(): Promise<AuthResponse> {
        const { consumerKey, consumerSecret, tokenUrl } = this.config;
        if (!consumerKey || !consumerSecret) {
            throw new Error('eTIMS Consumer Key and Secret are not configured.');
        }

        const authHeader = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        const url = `${tokenUrl.trim().replace(/\/+$/, '')}?grant_type=client_credentials`;

        const res = await request(url, {
            method: 'GET',
            headers: { Authorization: `Basic ${authHeader}` },
        });

        const text = await res.body.text();

        if (res.statusCode !== 200) {
            throw new Error(`eTIMS token request failed (${res.statusCode}): ${text}`);
        }

        let data: AuthResponse;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(`eTIMS token response is not valid JSON: ${text}`);
        }

        if (!data.access_token) {
            throw new Error(`eTIMS token response missing access_token: ${text}`);
        }

        return data;
    }

    // ───────────────────────
    // HTTP Core
    // ───────────────────────

    private buildUrl(endpointKey: EndpointKey): string {
        const path = ENDPOINTS[endpointKey];
        return `${this.config.baseUrl.trim().replace(/\/+$/, '')}${path}`;
    }

    /**
     * Build request headers.
     * Initialization only needs Authorization.
     * All other endpoints also need tin + bhfId + cmcKey.
     */
    private async buildHeaders(
        endpointKey: EndpointKey,
        oscu?: EtimsOscuHeaders
    ): Promise<Record<string, string>> {
        const token = await this.getToken();
        const base: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        if (endpointKey === 'selectInitOsdcInfo') {
            // Only auth header for initialization
            return base;
        }

        if (!oscu) throw new Error(`OSCU headers (tin/bhfId/cmcKey) required for endpoint: ${endpointKey}`);

        return {
            ...base,
            'tin': oscu.tin,
            'bhfId': oscu.bhfId,
            'cmcKey': oscu.cmcKey,
        };
    }

    /**
     * Omit null/undefined values from the payload recursively.
     * KRA sandbox rejects requests with null fields in many cases.
     */
    private omitNullish<T>(value: T): T {
        if (value === null || value === undefined) return value;
        if (Array.isArray(value)) return value.map((v) => this.omitNullish(v)) as unknown as T;
        if (typeof value === 'object') {
            const out: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
                if (v === null || v === undefined) continue;
                out[k] = this.omitNullish(v);
            }
            return out as T;
        }
        return value;
    }

    private async post<T>(
        endpointKey: EndpointKey,
        body: Record<string, unknown>,
        oscu?: EtimsOscuHeaders
    ): Promise<T> {
        const url = this.buildUrl(endpointKey);
        const headers = await this.buildHeaders(endpointKey, oscu);
        const payload = this.omitNullish(body);

        const doRequest = async (): Promise<{ statusCode: number; text: string }> => {
            const res = await request(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            return { statusCode: res.statusCode, text: await res.body.text() };
        };

        let { statusCode, text } = await doRequest();

        // Auto-retry once on 401 (expired token)
        if (statusCode === 401) {
            await this.clearToken();
            await this.getToken(true);
            // Rebuild headers with new token
            const freshHeaders = await this.buildHeaders(endpointKey, oscu);
            const retryRes = await request(url, {
                method: 'POST',
                headers: freshHeaders,
                body: JSON.stringify(payload),
            });
            statusCode = retryRes.statusCode;
            text = await retryRes.body.text();
        }

        let data: Record<string, unknown>;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(`eTIMS API (${endpointKey}): invalid JSON response (${statusCode}): ${text}`);
        }

        if (statusCode !== 200) {
            const msg = (data as { resultMsg?: string }).resultMsg
                ?? (data as { errorMessage?: string }).errorMessage
                ?? text;
            throw new Error(`eTIMS API (${endpointKey}) HTTP ${statusCode}: ${msg}`);
        }

        // Validate KRA business result code
        const resultCd = (data as { resultCd?: string }).resultCd;
        const resultMsg = (data as { resultMsg?: string }).resultMsg ?? 'Unknown eTIMS error';

        if (resultCd && resultCd !== '000' && resultCd !== '001') {
            throw new Error(`eTIMS API (${endpointKey}) resultCd=${resultCd}: ${resultMsg}`);
        }

        return data as T;
    }

    // ───────────────────────
    // Initialization
    // ───────────────────────

    async selectInitOsdcInfo(payload: {
        tin: string;
        bhfId: string;
        dvcSrlNo: string;
    }) {
        // No OSCU headers for init - only Authorization
        return this.post('selectInitOsdcInfo', payload as Record<string, unknown>);
    }

    // ───────────────────────
    // Code Lists
    // ───────────────────────

    async selectCodeList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectCodeList', { lastReqDt }, oscu);
    }

    async selectNoticeList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectNoticeList', { lastReqDt }, oscu);
    }

    // ───────────────────────
    // Customer
    // ───────────────────────

    /** Look up a single customer by their KRA TIN */
    async selectCustomer(oscu: EtimsOscuHeaders, custmTin: string) {
        return this.post('selectCustomer', { custmTin }, oscu);
    }

    // ───────────────────────
    // Branches
    // ───────────────────────

    async selectBhfList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectBhfList', { lastReqDt }, oscu);
    }

    async saveBhfCustomer(oscu: EtimsOscuHeaders, customerData: Record<string, unknown>) {
        return this.post('saveBhfCustomer', customerData, oscu);
    }

    async saveBhfUser(oscu: EtimsOscuHeaders, userData: Record<string, unknown>) {
        return this.post('saveBhfUser', userData, oscu);
    }

    // ───────────────────────
    // Items
    // ───────────────────────

    async selectItemClsList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectItemClsList', { lastReqDt }, oscu);
    }

    async selectItemList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectItemList', { lastReqDt }, oscu);
    }

    async saveItem(oscu: EtimsOscuHeaders, item: Record<string, unknown>) {
        // tin + bhfId must also be in the request body for KRA session tracking
        return this.post('saveItem', { tin: oscu.tin, bhfId: oscu.bhfId, ...item }, oscu);
    }

    async saveItemComposition(oscu: EtimsOscuHeaders, composition: Record<string, unknown>) {
        return this.post('saveItemComposition', { tin: oscu.tin, bhfId: oscu.bhfId, ...composition }, oscu);
    }

    // ───────────────────────
    // Imported Items
    // ───────────────────────

    async selectImportItemList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectImportItemList', { lastReqDt }, oscu);
    }

    async updateImportItem(oscu: EtimsOscuHeaders, item: Record<string, unknown>) {
        return this.post('updateImportItem', item, oscu);
    }

    // ───────────────────────
    // Sales
    // ───────────────────────

    async saveTrnsSalesOsdc(oscu: EtimsOscuHeaders, transaction: Record<string, unknown>) {
        return this.post('saveTrnsSalesOsdc', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            ...transaction,
        }, oscu);
    }

    // ───────────────────────
    // Purchases
    // ───────────────────────

    async selectTrnsPurchaseSalesList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectTrnsPurchaseSalesList', { lastReqDt }, oscu);
    }

    async insertTrnsPurchase(oscu: EtimsOscuHeaders, purchase: Record<string, unknown>) {
        return this.post('insertTrnsPurchase', purchase, oscu);
    }

    // ───────────────────────
    // Stock
    // ───────────────────────

    async selectStockMoveList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectStockMoveList', { lastReqDt }, oscu);
    }

    async insertStockIO(oscu: EtimsOscuHeaders, stockData: Record<string, unknown>) {
        return this.post('insertStockIO', stockData, oscu);
    }

    async saveStockMaster(oscu: EtimsOscuHeaders, stockMaster: Record<string, unknown>) {
        return this.post('saveStockMaster', stockMaster, oscu);
    }
}

// ─────────────────────────────────────────────
// Module-level Singleton
// ─────────────────────────────────────────────

let _singleton: EtimsOscuClient | null = null;

/**
 * Get (or create) the module-level eTIMS client singleton.
 * All routers must use this instead of `new EtimsOscuClient(...)` to share the token cache.
 */
export function getEtimsClient(config: EtimsClientConfig): EtimsOscuClient {
    if (!_singleton) {
        _singleton = new EtimsOscuClient(config);
    } else {
        // Update the config in case env vars changed (e.g. sandbox → prod switch)
        // We do this by assigning the new config; the token cache is only invalidated
        // if the tokenUrl changed (different env), since the old token won't be valid.
        const prevUrl = (_singleton as unknown as { config: EtimsClientConfig }).config.tokenUrl;
        if (prevUrl !== config.tokenUrl) {
            // Environment changed - kill the old singleton and the cached token
            _singleton.clearToken().catch(() => undefined);
            _singleton = new EtimsOscuClient(config);
        }
    }
    return _singleton;
}
