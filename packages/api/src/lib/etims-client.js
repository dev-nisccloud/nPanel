import { request } from 'undici';
import { getRedisClient } from './redis';
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
};
const REDIS_TOKEN_KEY = 'etims:oauth_token';
const TOKEN_BUFFER_SECS = 60; // Refresh 60s before actual expiry
// ─────────────────────────────────────────────
// EtimsOscuClient
// ─────────────────────────────────────────────
export class EtimsOscuClient {
    config;
    // In-process cache (fallback when Redis is unavailable)
    memToken = null;
    memTokenExpiresAt = null;
    constructor(config) {
        this.config = config;
    }
    // ───────────────────────
    // Token Management
    // ───────────────────────
    /**
     * Get a valid OAuth access token, using Redis as the primary cache
     * and an in-memory fallback. Never fetches more than once per TTL.
     */
    async getToken(forceRefresh = false) {
        if (!forceRefresh) {
            // 1. Try Redis first
            const redis = getRedisClient();
            if (redis) {
                try {
                    const cached = await redis.get(REDIS_TOKEN_KEY);
                    if (cached && Date.now() < cached.expiresAt * 1000) {
                        return cached.token;
                    }
                }
                catch {
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
                await redis.set(REDIS_TOKEN_KEY, { token: tokenData.access_token, expiresAt }, { ex: expiresIn - TOKEN_BUFFER_SECS });
            }
            catch {
                // Redis write failure is non-fatal; we still have the in-memory cache
            }
        }
        return tokenData.access_token;
    }
    async clearToken() {
        this.memToken = null;
        this.memTokenExpiresAt = null;
        const redis = getRedisClient();
        if (redis) {
            try {
                await redis.del(REDIS_TOKEN_KEY);
            }
            catch { /* non-fatal */ }
        }
    }
    async fetchToken() {
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
        let data;
        try {
            data = JSON.parse(text);
        }
        catch {
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
    buildUrl(endpointKey) {
        const path = ENDPOINTS[endpointKey];
        return `${this.config.baseUrl.trim().replace(/\/+$/, '')}${path}`;
    }
    /**
     * Build request headers.
     * Initialization only needs Authorization.
     * All other endpoints also need tin + bhfId + cmcKey.
     */
    async buildHeaders(endpointKey, oscu) {
        const token = await this.getToken();
        const base = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
        if (endpointKey === 'selectInitOsdcInfo') {
            // Only auth header for initialization
            return base;
        }
        if (!oscu)
            throw new Error(`OSCU headers (tin/bhfId/cmcKey) required for endpoint: ${endpointKey}`);
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
    omitNullish(value) {
        if (value === null || value === undefined)
            return value;
        if (Array.isArray(value))
            return value.map((v) => this.omitNullish(v));
        if (typeof value === 'object') {
            const out = {};
            for (const [k, v] of Object.entries(value)) {
                if (v === null || v === undefined)
                    continue;
                out[k] = this.omitNullish(v);
            }
            return out;
        }
        return value;
    }
    async post(endpointKey, body, oscu) {
        const url = this.buildUrl(endpointKey);
        const headers = await this.buildHeaders(endpointKey, oscu);
        const payload = this.omitNullish(body);
        const doRequest = async () => {
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
        let data;
        try {
            data = JSON.parse(text);
        }
        catch {
            throw new Error(`eTIMS API (${endpointKey}): invalid JSON response (${statusCode}): ${text}`);
        }
        if (statusCode !== 200) {
            const msg = data.resultMsg
                ?? data.errorMessage
                ?? text;
            throw new Error(`eTIMS API (${endpointKey}) HTTP ${statusCode}: ${msg}`);
        }
        // Validate KRA business result code
        const resultCd = data.resultCd;
        const resultMsg = data.resultMsg ?? 'Unknown eTIMS error';
        if (resultCd && resultCd !== '000' && resultCd !== '001') {
            throw new Error(`eTIMS API (${endpointKey}) resultCd=${resultCd}: ${resultMsg}`);
        }
        return data;
    }
    // ───────────────────────
    // Initialization
    // ───────────────────────
    async selectInitOsdcInfo(payload) {
        // No OSCU headers for init - only Authorization
        return this.post('selectInitOsdcInfo', payload);
    }
    // ───────────────────────
    // Code Lists
    // ───────────────────────
    async selectCodeList(oscu, lastReqDt) {
        return this.post('selectCodeList', { lastReqDt }, oscu);
    }
    async selectNoticeList(oscu, lastReqDt) {
        return this.post('selectNoticeList', { lastReqDt }, oscu);
    }
    // ───────────────────────
    // Customer
    // ───────────────────────
    /** Look up a single customer by their KRA TIN */
    async selectCustomer(oscu, custmTin) {
        return this.post('selectCustomer', { custmTin }, oscu);
    }
    // ───────────────────────
    // Branches
    // ───────────────────────
    async selectBhfList(oscu, lastReqDt) {
        return this.post('selectBhfList', { lastReqDt }, oscu);
    }
    async saveBhfCustomer(oscu, customerData) {
        return this.post('saveBhfCustomer', customerData, oscu);
    }
    async saveBhfUser(oscu, userData) {
        return this.post('saveBhfUser', userData, oscu);
    }
    // ───────────────────────
    // Items
    // ───────────────────────
    async selectItemClsList(oscu, lastReqDt) {
        return this.post('selectItemClsList', { lastReqDt }, oscu);
    }
    async selectItemList(oscu, lastReqDt) {
        return this.post('selectItemList', { lastReqDt }, oscu);
    }
    async saveItem(oscu, item) {
        // tin + bhfId must also be in the request body for KRA session tracking
        return this.post('saveItem', { tin: oscu.tin, bhfId: oscu.bhfId, ...item }, oscu);
    }
    async saveItemComposition(oscu, composition) {
        return this.post('saveItemComposition', { tin: oscu.tin, bhfId: oscu.bhfId, ...composition }, oscu);
    }
    // ───────────────────────
    // Imported Items
    // ───────────────────────
    async selectImportItemList(oscu, lastReqDt) {
        return this.post('selectImportItemList', { lastReqDt }, oscu);
    }
    async updateImportItem(oscu, item) {
        return this.post('updateImportItem', item, oscu);
    }
    // ───────────────────────
    // Sales
    // ───────────────────────
    async saveTrnsSalesOsdc(oscu, transaction) {
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
    async selectTrnsPurchaseSalesList(oscu, lastReqDt) {
        return this.post('selectTrnsPurchaseSalesList', { lastReqDt }, oscu);
    }
    async insertTrnsPurchase(oscu, purchase) {
        return this.post('insertTrnsPurchase', purchase, oscu);
    }
    // ───────────────────────
    // Stock
    // ───────────────────────
    async selectStockMoveList(oscu, lastReqDt) {
        return this.post('selectStockMoveList', { lastReqDt }, oscu);
    }
    async insertStockIO(oscu, stockData) {
        return this.post('insertStockIO', stockData, oscu);
    }
    async saveStockMaster(oscu, stockMaster) {
        return this.post('saveStockMaster', stockMaster, oscu);
    }
}
// ─────────────────────────────────────────────
// Module-level Singleton
// ─────────────────────────────────────────────
let _singleton = null;
/**
 * Get (or create) the module-level eTIMS client singleton.
 * All routers must use this instead of `new EtimsOscuClient(...)` to share the token cache.
 */
export function getEtimsClient(config) {
    if (!_singleton) {
        _singleton = new EtimsOscuClient(config);
    }
    else {
        // Update the config in case env vars changed (e.g. sandbox → prod switch)
        // We do this by assigning the new config; the token cache is only invalidated
        // if the tokenUrl changed (different env), since the old token won't be valid.
        const prevUrl = _singleton.config.tokenUrl;
        if (prevUrl !== config.tokenUrl) {
            // Environment changed - kill the old singleton and the cached token
            _singleton.clearToken().catch(() => undefined);
            _singleton = new EtimsOscuClient(config);
        }
    }
    return _singleton;
}
