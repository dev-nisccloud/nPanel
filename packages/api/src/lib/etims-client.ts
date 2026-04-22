import { request } from 'undici';

export interface ETimsConfig {
    baseUrl: string;
    tokenUrl: string;
    consumerKey: string;
    consumerSecret: string;
}

export interface ETimsHeaders {
    tin: string;
    bhfId: string;
    cmcKey?: string;
    accessToken?: string;
}

export interface SalesItem {
    itemSeq: number;
    itemCd: string;
    itemClsCd: string;
    itemNm: string;
    bcd: string | null;
    pkgUnitCd: string;
    pkg: number;
    qtyUnitCd: string;
    qty: number;
    prc: number;
    splyAmt: number;
    dcRt: number;
    dcAmt: number;
    taxTyCd: string; // A, B, C, D, E
    taxblAmt: number;
    taxAmt: number;
    totAmt: number;
}

export interface SalesTransaction {
    invcNo: number;
    orgInvcNo: number;
    custTin: string | null;
    custNm: string | null;
    salesTyCd: string;
    rcptTyCd: string;
    pmtTyCd: string;
    salesSttsCd: string;
    cfmDt: string;
    salesDt: string;
    stockRlsDt?: string;
    cnclReqDt?: number | string;
    cnclDt?: number | string;
    rfdDt?: string;
    rfdRsnCd?: string;
    totItemCnt: number;
    taxblAmtA: number;
    taxblAmtB: number;
    taxblAmtC: number;
    taxblAmtD: number;
    taxblAmtE: number;
    taxRtA: number;
    taxRtB: number;
    taxRtC: number;
    taxRtD: number;
    taxRtE: number;
    taxAmtA: number;
    taxAmtB: number;
    taxAmtC: number;
    taxAmtD: number;
    taxAmtE: number;
    totTaxblAmt: number;
    totTaxAmt: number;
    totAmt: number;
    prchrAcptcYn: 'Y' | 'N';
    remark: string | null;
    regrId: string;
    regrNm: string;
    modrId: string;
    modrNm: string;
    receipt: {
        custTin: string | null;
        custMblNo: string | null;
        rptNo: number;
        rcptPbctDt: string;
        trdeNm: string;
        adrs: string;
        topMsg: string;
        btmMsg: string;
        prchrAcptcYn: 'Y' | 'N';
    };
    itemList: SalesItem[];
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    expires_in: string;
}

export class ETimsClient {
    private config: ETimsConfig;
    private cachedAccessToken: string | null = null;
    private cachedAccessTokenExpiresAtMs: number | null = null;

    constructor(config: ETimsConfig) {
        this.config = config;
    }

    /**
     * Generate OAuth 2.0 access token
     */
    async generateToken(): Promise<AuthResponse> {
        const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');

        const res = await request(`${this.config.tokenUrl}?grant_type=client_credentials`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
            }
        });

        const responseText = await res.body.text();
        if (res.statusCode !== 200) {
            throw new Error(`eTIMS Auth Error: ${res.statusCode} - ${responseText}`);
        }

        try {
            return JSON.parse(responseText);
        } catch (e) {
            throw new Error(`eTIMS Auth Error: Invalid JSON response: ${responseText}`);
        }
    }

    private async getValidAccessToken(): Promise<string> {
        const now = Date.now();
        if (this.cachedAccessToken && this.cachedAccessTokenExpiresAtMs && now < this.cachedAccessTokenExpiresAtMs) {
            return this.cachedAccessToken;
        }

        const token = await this.generateToken();
        const expiresInSec = Number(token.expires_in);
        // Refresh a bit early to avoid edge-of-expiry failures.
        const skewMs = 30_000;
        const ttlMs = Number.isFinite(expiresInSec) ? Math.max(0, expiresInSec * 1000 - skewMs) : 0;

        this.cachedAccessToken = token.access_token;
        this.cachedAccessTokenExpiresAtMs = now + ttlMs;

        return token.access_token;
    }

    private maskBearer(bearer: string | undefined) {
        if (!bearer) return "";
        if (bearer.length <= 16) return "***";
        return `${bearer.slice(0, 6)}***${bearer.slice(-6)}`;
    }

    private omitNullishDeep<T>(value: T): T {
        // KRA sandbox is strict: remove null/undefined fields from payloads.
        if (value === null || value === undefined) return value;

        if (Array.isArray(value)) {
            return value.map((v) => this.omitNullishDeep(v)) as any;
        }

        if (typeof value === "object") {
            const out: any = {};
            for (const [k, v] of Object.entries(value as any)) {
                if (v === null || v === undefined) continue;
                out[k] = this.omitNullishDeep(v);
            }
            return out;
        }

        return value;
    }

    private async request<T>(method: 'GET' | 'POST', endpoint: string, headers: ETimsHeaders, body?: any): Promise<T> {
        const url = `${this.config.baseUrl}${endpoint}`;

        const accessToken = headers.accessToken ?? (await this.getValidAccessToken());
        const headersObj = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apigee_app_id': this.config.consumerKey,
            'tin': headers.tin,
            'bhfId': headers.bhfId,
            ...(headers.cmcKey ? { 'cmcKey': headers.cmcKey } : {}),
        };

        console.log(`[eTIMS] ${method} ${url}`);
        const headersForLog = {
            ...headersObj,
            Authorization: `Bearer ${this.maskBearer(accessToken)}`,
            apigee_app_id: this.config.consumerKey ? `${this.config.consumerKey.slice(0, 6)}***${this.config.consumerKey.slice(-6)}` : "",
            ...(headers.cmcKey ? { cmcKey: `${headers.cmcKey.slice(0, 6)}***${headers.cmcKey.slice(-6)}` } : {}),
        };
        console.log(`[eTIMS] Headers:`, JSON.stringify(headersForLog, null, 2));

        const sanitizedBody = body ? this.omitNullishDeep(body) : undefined;
        if (sanitizedBody) console.log(`[eTIMS] Body:`, JSON.stringify(sanitizedBody, null, 2));

        const res = await request(url, {
            method,
            headers: headersObj,
            body: sanitizedBody ? JSON.stringify(sanitizedBody) : undefined,
        });

        const responseText = await res.body.text();
        let data: any;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`eTIMS API Error (${endpoint}): ${res.statusCode} - Invalid JSON response: ${responseText}`);
        }

        if (res.statusCode !== 200) {
            throw new Error(`eTIMS API Error (${endpoint}): ${res.statusCode} - ${JSON.stringify(data)}`);
        }

        return data as T;
    }

    async initializeDevice(tin: string, bhfId: string, dvcSrlNo: string, accessToken?: string) {
        return this.request<any>(
            'POST',
            '/initialize',
            {
                tin,
                bhfId,
                accessToken
            },
            {
                tin,
                bhfId,
                dvcSrlNo,
            }
        );
    }

    async selectCodeList(headers: ETimsHeaders, lastReqDt: string) {
        return this.request<any>('POST', '/selectCodeList', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async selectItemClass(headers: ETimsHeaders, lastReqDt: string) {
        return this.request<any>('POST', '/selectItemClass', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async selectBhfList(headers: ETimsHeaders, lastReqDt: string) {
        return this.request<any>('POST', '/selectBhfList', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async saveItem(headers: ETimsHeaders, item: any) {
        // KRA OSCU docs: tin + bhfId must be present in the request body AND headers.
        // KRA's sandbox uses the body fields to look up the TestSession for API logging;
        // if they are absent getTestSessionApiLog() returns null → 400 NPE.
        return this.request<any>('POST', '/saveItem', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            ...item,
        });
    }

    async selectItemInfo(headers: ETimsHeaders, lastReqDt: string) {
        return this.request<any>('POST', '/itemInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async saveItemComposition(headers: ETimsHeaders, composition: any) {
        // Same rule: tin + bhfId required in body for KRA session tracking.
        return this.request<any>('POST', '/saveItemComposition', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            ...composition,
        });
    }

    async selectImportedItemInfo(headers: ETimsHeaders, lastReqDt: string) {
        return this.request<any>('POST', '/importedItemInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async saveImportedItemConvertedInfo(headers: ETimsHeaders, conversion: any) {
        return this.request<any>('POST', '/importedItemConvertedInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            ...conversion,
        });
    }

    async sendSalesTransaction(headers: ETimsHeaders, transaction: SalesTransaction) {
        // KRA requires tin + bhfId in the body for session tracking (same as all write endpoints).
        return this.request<any>('POST', '/sendSalesTransaction', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            ...transaction,
        });
    }

    async selectSalesTransactions(headers: ETimsHeaders, lastReqDt: string) {
        return this.request<any>('POST', '/selectSalesTransactions', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async selectInvoiceDetail(headers: ETimsHeaders, invcNo: string) {
        return this.request<any>('POST', '/selectInvoiceDetail', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            invcNo,
        });
    }

    async getPurchaseTransactionInfo(headers: ETimsHeaders, lastReqDt: string) {
        return this.request<any>('POST', '/getPurchaseTransactionInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async sendPurchaseTransactionInfo(headers: ETimsHeaders, purchaseInfo: any) {
        return this.request<any>('POST', '/sendPurchaseTransactionInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            ...purchaseInfo,
        });
    }

    async selectStockMoveList(headers: ETimsHeaders, lastReqDt: string) {
        return this.request<any>('POST', '/selectStockMoveLists', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async insertStockIO(headers: ETimsHeaders, stockData: any) {
        return this.request<any>('POST', '/insert/stockIO', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            ...stockData,
        });
    }

    async saveStockMaster(headers: ETimsHeaders, stockMaster: any) {
        return this.request<any>('POST', '/save/stockMaster', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            ...stockMaster,
        });
    }

    async selectCustomerPinInfo(headers: ETimsHeaders, lastReqDt: string) {
        return this.request<any>('POST', '/customerPinInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async selectTaxpayerInfo(headers: ETimsHeaders, lastReqDt: string) {
        return this.request<any>('POST', '/selectTaxpayerInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async selectNoticeList(headers: ETimsHeaders, lastReqDt: string) {
        return this.request<any>('POST', '/selectNoticeList', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async branchSendCustomerInfo(headers: ETimsHeaders, customerInfo: any) {
        // KRA docs: /saveBhfCustomer
        return this.request<any>('POST', '/saveBhfCustomer', headers, customerInfo);
    }

    async branchUserAccount(headers: ETimsHeaders, userInfo: any) {
        // KRA docs: /saveBhfUser
        return this.request<any>('POST', '/saveBhfUser', headers, userInfo);
    }
}
