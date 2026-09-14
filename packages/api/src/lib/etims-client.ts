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
    /**
     * APigee app id sent on every OSCU request.
     * Required for Developer Platform automated testing attribution.
     * Defaults to consumerKey when omitted.
     */
    apigeeAppId?: string;
    /**
     * Isolated cert client: OAuth token stays in this process only.
     * Never read/write the shared Redis key used by the live nPanel app.
     */
    memoryTokenOnly?: boolean;
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

/** Thrown when KRA returns a non-success business resultCd. Carries the full response body. */
export class EtimsApiError extends Error {
    readonly resultCd: string;
    readonly resultMsg: string;
    readonly response: Record<string, unknown>;

    constructor(endpointKey: string, resultCd: string, resultMsg: string, response: Record<string, unknown>) {
        super(`eTIMS API (${endpointKey}) resultCd=${resultCd}: ${resultMsg}`);
        this.name = 'EtimsApiError';
        this.resultCd = resultCd;
        this.resultMsg = resultMsg;
        this.response = response;
    }
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
}

/** Gava wraps OSCU errors as HTTP 400 + responseHeader.customerMessage "Validation failed". The useful text is debugMessage. */
export function kraGatewayErrorMessage(
    endpointKey: string,
    statusCode: number,
    bodyJson: unknown,
    bodyText: string,
): string {
    const root = asRecord(bodyJson) ?? {};
    const wrapped = asRecord(root.responseBody);
    const data = wrapped ?? root;
    const header = asRecord(root.responseHeader) ?? asRecord(data.responseHeader);
    const parts: string[] = [];
    const push = (value: unknown) => {
        if (typeof value !== 'string') return;
        const trimmed = value.trim();
        if (!trimmed || parts.includes(trimmed)) return;
        parts.push(trimmed);
    };
    push(data.resultMsg);
    push(data.errorMessage);
    push(header?.customerMessage);
    push(header?.debugMessage);
    if (header?.errors != null) {
        try {
            push(JSON.stringify(header.errors));
        } catch {
            /* ignore */
        }
    }
    return `eTIMS API (${endpointKey}) HTTP ${statusCode}: ${parts.join(' — ') || bodyText}`;
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
} as const;

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
} as const;

export type EtimsEndpointKey = keyof typeof DEV_PLATFORM_ENDPOINTS;

function isDeveloperPlatformHost(baseUrl: string): boolean {
    return /etims-oscu/i.test(baseUrl);
}

function resolveEndpoints(baseUrl: string): Record<EtimsEndpointKey, string> {
    return isDeveloperPlatformHost(baseUrl)
        ? DEV_PLATFORM_ENDPOINTS
        : LEGACY_ENDPOINTS;
}

export type EtimsRawResponse = {
    endpointKey: EtimsEndpointKey;
    kraPath: string;
    url: string;
    statusCode: number;
    /** Exact response body text from KRA  unaltered */
    bodyText: string;
    /** Parsed JSON if body is valid JSON; otherwise null. Shape is unaltered (no responseBody unwrap). */
    bodyJson: unknown | null;
};

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
     * Get a valid OAuth access token.
     * Live app: Redis then in-memory. Isolated cert client: in-memory only.
     */
    private redisTokenCacheEnabled(): boolean {
        return this.config.memoryTokenOnly !== true;
    }

    async getToken(forceRefresh = false): Promise<string> {
        if (!forceRefresh) {
            if (this.redisTokenCacheEnabled()) {
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
            }

            if (this.memToken && this.memTokenExpiresAt && Date.now() < this.memTokenExpiresAt * 1000) {
                return this.memToken;
            }
        }

        const tokenData = await this.fetchToken();
        const expiresIn = parseInt(tokenData.expires_in ?? '3600', 10);
        const expiresAt = Math.floor(Date.now() / 1000) + expiresIn - TOKEN_BUFFER_SECS;

        this.memToken = tokenData.access_token;
        this.memTokenExpiresAt = expiresAt;

        if (this.redisTokenCacheEnabled()) {
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
        }

        return tokenData.access_token;
    }

    async clearToken(): Promise<void> {
        this.memToken = null;
        this.memTokenExpiresAt = null;
        if (!this.redisTokenCacheEnabled()) return;
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

    private endpointPath(endpointKey: EtimsEndpointKey): string {
        return resolveEndpoints(this.config.baseUrl)[endpointKey];
    }

    private buildUrl(endpointKey: EtimsEndpointKey): string {
        return `${this.config.baseUrl.trim().replace(/\/+$/, '')}${this.endpointPath(endpointKey)}`;
    }

    /**
     * Build request headers.
     * Legacy host: Authorization + tin/bhfId(/cmcKey)  apigee optional.
     * Developer Platform: also sends apigee_app_id (required for saveItem / session scoring).
     */
    private async buildHeaders(
        endpointKey: EtimsEndpointKey,
        oscu?: EtimsOscuHeaders
    ): Promise<Record<string, string>> {
        const token = await this.getToken();
        const onDevPlatform = isDeveloperPlatformHost(this.config.baseUrl);
        const explicitApigee = this.config.apigeeAppId?.trim();
        const base: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        // Only force apigee on Developer Platform. Legacy worked without it (pre-2ffc841e).
        if (onDevPlatform) {
            base.apigee_app_id = (explicitApigee || this.config.consumerKey).trim();
        } else if (explicitApigee) {
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

    /**
     * Call a KRA endpoint and return the exact response as received.
     * Does not unwrap responseBody, does not throw on business resultCd.
     * Used for certification testing and response typing.
     */
    async requestRaw(
        endpointKey: EtimsEndpointKey,
        body: Record<string, unknown>,
        oscu?: EtimsOscuHeaders,
    ): Promise<EtimsRawResponse> {
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

        let bodyJson: unknown | null = null;
        try {
            bodyJson = JSON.parse(text);
        } catch {
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

    private async post<T>(
        endpointKey: EtimsEndpointKey,
        body: Record<string, unknown>,
        oscu?: EtimsOscuHeaders
    ): Promise<T> {
        const raw = await this.requestRaw(endpointKey, body, oscu);
        const { statusCode, bodyText, bodyJson } = raw;

        if (bodyJson == null || typeof bodyJson !== 'object') {
            throw new Error(`eTIMS API (${endpointKey}): invalid JSON response (${statusCode}): ${bodyText}`);
        }

        let data = bodyJson as Record<string, unknown>;

        // Developer Platform often wraps the OSCU body in responseBody
        const wrapped = data.responseBody;
        if (wrapped && typeof wrapped === 'object' && !Array.isArray(wrapped)) {
            data = wrapped as Record<string, unknown>;
        }

        if (statusCode !== 200) {
            throw new Error(kraGatewayErrorMessage(endpointKey, statusCode, bodyJson, bodyText));
        }

        // Validate KRA business result code
        const resultCd = (data as { resultCd?: string }).resultCd;
        const resultMsg = (data as { resultMsg?: string }).resultMsg ?? 'Unknown eTIMS error';

        if (resultCd && resultCd !== '000' && resultCd !== '001') {
            throw new EtimsApiError(endpointKey, resultCd, resultMsg, data);
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
        // Init: Authorization + apigee_app_id + tin + bhfId (cmcKey not yet available)
        return this.post(
            'selectInitOsdcInfo',
            payload as Record<string, unknown>,
            { tin: payload.tin, bhfId: payload.bhfId, cmcKey: '' },
        );
    }

    /**
     * Standard sync/search body for Developer Platform list endpoints.
     * tin + bhfId (+ cmcKey) are required in the JSON body, not only headers.
     */
    private lastReqBody(oscu: EtimsOscuHeaders, lastReqDt: string): Record<string, unknown> {
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

    async selectCodeList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectCodeList', this.lastReqBody(oscu, lastReqDt), oscu);
    }

    async selectNoticeList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectNoticeList', this.lastReqBody(oscu, lastReqDt), oscu);
    }

    /** Dashboard test case path: /selectNotices */
    async selectNotices(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectNotices', this.lastReqBody(oscu, lastReqDt), oscu);
    }

    // ───────────────────────
    // Customer
    // ───────────────────────

    /** Look up a single customer by their KRA TIN (central registry). */
    async selectCustomer(oscu: EtimsOscuHeaders, custmTin: string) {
        return this.post('selectCustomer', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            custmTin,
        }, oscu);
    }

    /** List customers registered on this branch via saveBhfCustomer. */
    async selectCustomerList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectCustomerList', this.lastReqBody(oscu, lastReqDt), oscu);
    }

    async selectTaxPayerInfo(oscu: EtimsOscuHeaders, lastReqDt: string) {
        // Classic OSCU has no /selectTaxPayerInfo  look up own PIN via /selectCustomer.
        // Developer Platform keeps /selectTaxpayerInfo + lastReqDt.
        if (isDeveloperPlatformHost(this.config.baseUrl)) {
            return this.post('selectTaxPayerInfo', this.lastReqBody(oscu, lastReqDt), oscu);
        }
        return this.post(
            'selectTaxPayerInfo',
            {
                tin: oscu.tin,
                bhfId: oscu.bhfId,
                cmcKey: oscu.cmcKey,
                custmTin: oscu.tin,
            },
            oscu,
        );
    }

    // ───────────────────────
    // Branches
    // ───────────────────────

    async selectBhfList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectBhfList', this.lastReqBody(oscu, lastReqDt), oscu);
    }

    async saveBhfCustomer(oscu: EtimsOscuHeaders, customerData: Record<string, unknown>) {
        return this.post('saveBhfCustomer', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            ...customerData,
        }, oscu);
    }

    async saveBhfUser(oscu: EtimsOscuHeaders, userData: Record<string, unknown>) {
        return this.post('saveBhfUser', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            ...userData,
        }, oscu);
    }

    async saveBhfInsurance(oscu: EtimsOscuHeaders, insurance: Record<string, unknown>) {
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

    async selectItemClsList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectItemClsList', this.lastReqBody(oscu, lastReqDt), oscu);
    }

    async selectItemList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectItemList', this.lastReqBody(oscu, lastReqDt), oscu);
    }

    async saveItem(oscu: EtimsOscuHeaders, item: Record<string, unknown>) {
        // tin + bhfId must also be in the request body for KRA session tracking
        return this.post('saveItem', { tin: oscu.tin, bhfId: oscu.bhfId, cmcKey: oscu.cmcKey, ...item }, oscu);
    }

    async saveItemComposition(oscu: EtimsOscuHeaders, composition: Record<string, unknown>) {
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

    async selectImportItemList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectImportItemList', this.lastReqBody(oscu, lastReqDt), oscu);
    }

    async updateImportItem(oscu: EtimsOscuHeaders, item: Record<string, unknown>) {
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

    async saveTrnsSalesOsdc(oscu: EtimsOscuHeaders, transaction: Record<string, unknown>) {
        return this.post('saveTrnsSalesOsdc', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            ...transaction,
        }, oscu);
    }

    /** List sales transactions submitted by this taxpayer/branch. */
    async selectTrnsSalesList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectTrnsSalesList', this.lastReqBody(oscu, lastReqDt), oscu);
    }

    async selectInvoiceDetails(oscu: EtimsOscuHeaders, invcNo: number) {
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

    async selectTrnsPurchaseSalesList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectTrnsPurchaseSalesList', this.lastReqBody(oscu, lastReqDt), oscu);
    }

    async insertTrnsPurchase(oscu: EtimsOscuHeaders, purchase: Record<string, unknown>) {
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

    async selectStockMoveList(oscu: EtimsOscuHeaders, lastReqDt: string) {
        return this.post('selectStockMoveList', this.lastReqBody(oscu, lastReqDt), oscu);
    }

    async insertStockIO(oscu: EtimsOscuHeaders, stockData: Record<string, unknown>) {
        return this.post('insertStockIO', {
            tin: oscu.tin,
            bhfId: oscu.bhfId,
            cmcKey: oscu.cmcKey,
            ...stockData,
        }, oscu);
    }

    async saveStockMaster(oscu: EtimsOscuHeaders, stockMaster: Record<string, unknown>) {
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

let _singleton: EtimsOscuClient | null = null;

/** Dedicated client that does not share the live-app singleton or Redis token. */
export function createEtimsClient(config: EtimsClientConfig): EtimsOscuClient {
    return new EtimsOscuClient(config);
}

/**
 * Get (or create) the module-level eTIMS client singleton.
 * Live routers must use this instead of `new EtimsOscuClient(...)` to share the token cache.
 */
export function getEtimsClient(config: EtimsClientConfig): EtimsOscuClient {
    if (!_singleton) {
        _singleton = new EtimsOscuClient(config);
    } else {
        const prev = (_singleton as unknown as { config: EtimsClientConfig }).config;
        if (
            prev.tokenUrl !== config.tokenUrl ||
            prev.baseUrl !== config.baseUrl ||
            prev.consumerKey !== config.consumerKey ||
            prev.consumerSecret !== config.consumerSecret ||
            (prev.apigeeAppId ?? "") !== (config.apigeeAppId ?? "")
        ) {
            _singleton.clearToken().catch(() => undefined);
            _singleton = new EtimsOscuClient(config);
        }
    }
    return _singleton;
}
