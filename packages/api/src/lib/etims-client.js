import { request } from 'undici';
import { getRedisClient } from './redis';
/** Thrown when KRA returns a non-success business resultCd. Carries the full response body. */
export class EtimsApiError extends Error {
    resultCd;
    resultMsg;
    response;
    constructor(endpointKey, resultCd, resultMsg, response) {
        super(`eTIMS API (${endpointKey}) resultCd=${resultCd}: ${resultMsg}`);
        this.name = 'EtimsApiError';
        this.resultCd = resultCd;
        this.resultMsg = resultMsg;
        this.response = response;
    }
}
// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
/**
 * Classic OSCU sandbox/prod host paths (etims-api*.kra.go.ke/etims-api).
 * This is the shape that worked before commit 2ffc841e.
 */
const LEGACY_ENDPOINTS = {
    selectInitOsdcInfo: '/selectInitOsdcInfo',
    selectCodeList: '/selectCodeList',
    selectNoticeList: '/selectNoticeList',
    selectNotices: '/selectNoticeList',
    selectCustomer: '/selectCustomer',
    selectCustomerList: '/selectCustomerList',
    selectTaxPayerInfo: '/selectCustomer',
    selectBhfList: '/selectBhfList',
    saveBhfCustomer: '/saveBhfCustomer',
    saveBhfUser: '/saveBhfUser',
    saveBhfInsurance: '/saveBhfInsurance',
    selectItemClsList: '/selectItemClsList',
    selectItemList: '/selectItemList',
    saveItem: '/saveItem',
    saveItemComposition: '/saveItemComposition',
    selectImportItemList: '/selectImportItemList',
    updateImportItem: '/updateImportItem',
    saveTrnsSalesOsdc: '/saveTrnsSalesOsdc',
    selectTrnsSalesList: '/selectTrnsSalesList',
    selectInvoiceDetails: '/selectInvoiceDetails',
    selectTrnsPurchaseSalesList: '/selectTrnsPurchaseSalesList',
    insertTrnsPurchase: '/insertTrnsPurchase',
    selectStockMoveList: '/selectStockMoveList',
    insertStockIO: '/insertStockIO',
    saveStockMaster: '/saveStockMaster',
};
/**
 * KRA Developer Platform (Apigee / etims-oscu) endpoint paths.
 * Matches Postman collection + docs/kra-etims-api.md.
 */
const DEV_PLATFORM_ENDPOINTS = {
    selectInitOsdcInfo: '/initialize',
    selectCodeList: '/selectCodeList',
    selectNoticeList: '/selectNoticeList',
    selectNotices: '/selectNotices',
    selectCustomer: '/customerPinInfo',
    selectCustomerList: '/selectCustomerList',
    selectTaxPayerInfo: '/selectTaxpayerInfo',
    selectBhfList: '/branchList',
    saveBhfCustomer: '/branchSendCustomerInfo',
    saveBhfUser: '/branchUserAccount',
    saveBhfInsurance: '/branchInsuranceInfo',
    selectItemClsList: '/selectItemClass',
    selectItemList: '/itemInfo',
    saveItem: '/saveItem',
    saveItemComposition: '/saveItemComposition',
    selectImportItemList: '/importedItemInfo',
    updateImportItem: '/importedItemConvertedInfo',
    saveTrnsSalesOsdc: '/sendSalesTransaction',
    selectTrnsSalesList: '/selectSalesTransactions',
    selectInvoiceDetails: '/selectInvoiceDetail',
    selectTrnsPurchaseSalesList: '/getPurchaseTransactionInfo',
    insertTrnsPurchase: '/sendPurchaseTransactionInfo',
    selectStockMoveList: '/selectStockMoveLists',
    insertStockIO: '/insert/stockIO',
    saveStockMaster: '/save/stockMaster',
};
function isDeveloperPlatformHost(baseUrl) {
    return /etims-oscu/i.test(baseUrl);
}
function resolveEndpoints(baseUrl) {
    return isDeveloperPlatformHost(baseUrl)
        ? DEV_PLATFORM_ENDPOINTS
        : LEGACY_ENDPOINTS;
}
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
    endpointPath(endpointKey) {
        return resolveEndpoints(this.config.baseUrl)[endpointKey];
    }
    buildUrl(endpointKey) {
        return `${this.config.baseUrl.trim().replace(/\/+$/, '')}${this.endpointPath(endpointKey)}`;
    }
    /**
     * Build request headers.
     * Legacy host: Authorization + tin/bhfId(/cmcKey)  apigee optional.
     * Developer Platform: also sends apigee_app_id (required for saveItem / session scoring).
     */
    async buildHeaders(endpointKey, oscu) {
        const token = await this.getToken();
        const onDevPlatform = isDeveloperPlatformHost(this.config.baseUrl);
        const explicitApigee = this.config.apigeeAppId?.trim();
        const base = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
        // Only force apigee on Developer Platform. Legacy worked without it (pre-2ffc841e).
        if (onDevPlatform) {
            base.apigee_app_id = (explicitApigee || this.config.consumerKey).trim();
        }
        else if (explicitApigee) {
            base.apigee_app_id = explicitApigee;
        }
        if (endpointKey === 'selectInitOsdcInfo') {
            if (!oscu?.tin || !oscu?.bhfId) {
                throw new Error('tin and bhfId are required for device initialization');
            }
            return {
                ...base,
                tin: oscu.tin,
                bhfId: oscu.bhfId,
            };
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
    /**
     * Call a KRA endpoint and return the exact response as received.
     * Does not unwrap responseBody, does not throw on business resultCd.
     * Used for certification testing and response typing.
     */
    async requestRaw(endpointKey, body, oscu) {
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
        if (statusCode === 401) {
            await this.clearToken();
            await this.getToken(true);
            const freshHeaders = await this.buildHeaders(endpointKey, oscu);
            const retryRes = await request(url, {
                method: 'POST',
                headers: freshHeaders,
                body: JSON.stringify(payload),
            });
            statusCode = retryRes.statusCode;
            text = await retryRes.body.text();
        }
        let bodyJson = null;
        try {
            bodyJson = JSON.parse(text);
        }
        catch {
            bodyJson = null;
        }
        return {
            endpointKey,
            kraPath: this.endpointPath(endpointKey),
            url,
            statusCode,
            bodyText: text,
            bodyJson,
        };
    }
    async post(endpointKey, body, oscu) {
        const raw = await this.requestRaw(endpointKey, body, oscu);
        const { statusCode, bodyText, bodyJson } = raw;
        if (bodyJson == null || typeof bodyJson !== 'object') {
            throw new Error(`eTIMS API (${endpointKey}): invalid JSON response (${statusCode}): ${bodyText}`);
        }
        let data = bodyJson;
        // Developer Platform often wraps the OSCU body in responseBody
        const wrapped = data.responseBody;
        if (wrapped && typeof wrapped === 'object' && !Array.isArray(wrapped)) {
            data = wrapped;
        }
        if (statusCode !== 200) {
            const msg = data.resultMsg
                ?? data.errorMessage
                ?? data.responseHeader?.customerMessage
                ?? bodyText;
            throw new Error(`eTIMS API (${endpointKey}) HTTP ${statusCode}: ${msg}`);
        }
        // Validate KRA business result code
        const resultCd = data.resultCd;
        const resultMsg = data.resultMsg ?? 'Unknown eTIMS error';
        if (resultCd && resultCd !== '000' && resultCd !== '001') {
            throw new EtimsApiError(endpointKey, resultCd, resultMsg, data);
        }
        return data;
    }
    // ───────────────────────
    // Initialization
    // ───────────────────────
    async selectInitOsdcInfo(payload) {
        // Init: Authorization + apigee_app_id + tin + bhfId (cmcKey not yet available)
        return this.post('selectInitOsdcInfo', payload, { tin: payload.tin, bhfId: payload.bhfId, cmcKey: '' });
    }
    /**
     * Standard sync/search body for Developer Platform list endpoints.
     * tin + bhfId (+ cmcKey) are required in the JSON body, not only headers.
     */
    lastReqBody(oscu, lastReqDt) {
        return {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            lastReqDt,
        };
    }
    // ───────────────────────
    // Code Lists
    // ───────────────────────
    async selectCodeList(oscu, lastReqDt) {
        return this.post('selectCodeList', this.lastReqBody(oscu, lastReqDt), oscu);
    }
    async selectNoticeList(oscu, lastReqDt) {
        return this.post('selectNoticeList', this.lastReqBody(oscu, lastReqDt), oscu);
    }
    /** Dashboard test case path: /selectNotices */
    async selectNotices(oscu, lastReqDt) {
        return this.post('selectNotices', this.lastReqBody(oscu, lastReqDt), oscu);
    }
    // ───────────────────────
    // Customer
    // ───────────────────────
    /** Look up a single customer by their KRA TIN (central registry). */
    async selectCustomer(oscu, custmTin) {
        return this.post('selectCustomer', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            custmTin,
        }, oscu);
    }
    /** List customers registered on this branch via saveBhfCustomer. */
    async selectCustomerList(oscu, lastReqDt) {
        return this.post('selectCustomerList', this.lastReqBody(oscu, lastReqDt), oscu);
    }
    async selectTaxPayerInfo(oscu, lastReqDt) {
        // Classic OSCU has no /selectTaxPayerInfo  look up own PIN via /selectCustomer.
        // Developer Platform keeps /selectTaxpayerInfo + lastReqDt.
        if (isDeveloperPlatformHost(this.config.baseUrl)) {
            return this.post('selectTaxPayerInfo', this.lastReqBody(oscu, lastReqDt), oscu);
        }
        return this.post('selectTaxPayerInfo', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            custmTin: oscu.tin,
        }, oscu);
    }
    // ───────────────────────
    // Branches
    // ───────────────────────
    async selectBhfList(oscu, lastReqDt) {
        return this.post('selectBhfList', this.lastReqBody(oscu, lastReqDt), oscu);
    }
    async saveBhfCustomer(oscu, customerData) {
        return this.post('saveBhfCustomer', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            ...customerData,
        }, oscu);
    }
    async saveBhfUser(oscu, userData) {
        return this.post('saveBhfUser', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            ...userData,
        }, oscu);
    }
    async saveBhfInsurance(oscu, insurance) {
        return this.post('saveBhfInsurance', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            ...insurance,
        }, oscu);
    }
    // ───────────────────────
    // Items
    // ───────────────────────
    async selectItemClsList(oscu, lastReqDt) {
        return this.post('selectItemClsList', this.lastReqBody(oscu, lastReqDt), oscu);
    }
    async selectItemList(oscu, lastReqDt) {
        return this.post('selectItemList', this.lastReqBody(oscu, lastReqDt), oscu);
    }
    async saveItem(oscu, item) {
        // tin + bhfId must also be in the request body for KRA session tracking
        return this.post('saveItem', { tin: oscu.tin, bhfId: oscu.bhfId, cmcKey: oscu.cmcKey, ...item }, oscu);
    }
    async saveItemComposition(oscu, composition) {
        return this.post('saveItemComposition', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            ...composition,
        }, oscu);
    }
    // ───────────────────────
    // Imported Items
    // ───────────────────────
    async selectImportItemList(oscu, lastReqDt) {
        return this.post('selectImportItemList', this.lastReqBody(oscu, lastReqDt), oscu);
    }
    async updateImportItem(oscu, item) {
        return this.post('updateImportItem', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            ...item,
        }, oscu);
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
    /** List sales transactions submitted by this taxpayer/branch. */
    async selectTrnsSalesList(oscu, lastReqDt) {
        return this.post('selectTrnsSalesList', this.lastReqBody(oscu, lastReqDt), oscu);
    }
    async selectInvoiceDetails(oscu, invcNo) {
        return this.post('selectInvoiceDetails', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            invcNo,
        }, oscu);
    }
    // ───────────────────────
    // Purchases
    // ───────────────────────
    async selectTrnsPurchaseSalesList(oscu, lastReqDt) {
        return this.post('selectTrnsPurchaseSalesList', this.lastReqBody(oscu, lastReqDt), oscu);
    }
    async insertTrnsPurchase(oscu, purchase) {
        return this.post('insertTrnsPurchase', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            ...purchase,
        }, oscu);
    }
    // ───────────────────────
    // Stock
    // ───────────────────────
    async selectStockMoveList(oscu, lastReqDt) {
        return this.post('selectStockMoveList', this.lastReqBody(oscu, lastReqDt), oscu);
    }
    async insertStockIO(oscu, stockData) {
        return this.post('insertStockIO', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            ...stockData,
        }, oscu);
    }
    async saveStockMaster(oscu, stockMaster) {
        return this.post('saveStockMaster', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            ...stockMaster,
        }, oscu);
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
        const prev = _singleton.config;
        if (prev.tokenUrl !== config.tokenUrl || prev.baseUrl !== config.baseUrl) {
            _singleton.clearToken().catch(() => undefined);
            _singleton = new EtimsOscuClient(config);
        }
    }
    return _singleton;
}
