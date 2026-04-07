import { request } from 'undici';
export class ETimsClient {
    config;
    cachedAccessToken = null;
    cachedAccessTokenExpiresAtMs = null;
    constructor(config) {
        this.config = config;
    }
    /**
     * Generate OAuth 2.0 access token
     */
    async generateToken() {
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
        }
        catch (e) {
            throw new Error(`eTIMS Auth Error: Invalid JSON response: ${responseText}`);
        }
    }
    async getValidAccessToken() {
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
    maskBearer(bearer) {
        if (!bearer)
            return "";
        if (bearer.length <= 16)
            return "***";
        return `${bearer.slice(0, 6)}***${bearer.slice(-6)}`;
    }
    omitNullishDeep(value) {
        // KRA sandbox is strict: remove null/undefined fields from payloads.
        if (value === null || value === undefined)
            return value;
        if (Array.isArray(value)) {
            return value.map((v) => this.omitNullishDeep(v));
        }
        if (typeof value === "object") {
            const out = {};
            for (const [k, v] of Object.entries(value)) {
                if (v === null || v === undefined)
                    continue;
                out[k] = this.omitNullishDeep(v);
            }
            return out;
        }
        return value;
    }
    async request(method, endpoint, headers, body) {
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
        if (sanitizedBody)
            console.log(`[eTIMS] Body:`, JSON.stringify(sanitizedBody, null, 2));
        const res = await request(url, {
            method,
            headers: headersObj,
            body: sanitizedBody ? JSON.stringify(sanitizedBody) : undefined,
        });
        const responseText = await res.body.text();
        let data;
        try {
            data = JSON.parse(responseText);
        }
        catch (e) {
            throw new Error(`eTIMS API Error (${endpoint}): ${res.statusCode} - Invalid JSON response: ${responseText}`);
        }
        if (res.statusCode !== 200) {
            throw new Error(`eTIMS API Error (${endpoint}): ${res.statusCode} - ${JSON.stringify(data)}`);
        }
        return data;
    }
    async initializeDevice(tin, bhfId, dvcSrlNo, accessToken) {
        return this.request('POST', '/initialize', {
            tin,
            bhfId,
            accessToken
        }, {
            tin,
            bhfId,
            dvcSrlNo,
        });
    }
    async selectCodeList(headers, lastReqDt) {
        return this.request('POST', '/selectCodeList', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }
    async selectItemClass(headers, lastReqDt) {
        // KRA sandbox is strict here; body should be minimal.
        // Headers already carry tin/bhfId/cmcKey.
        return this.request('POST', '/selectItemClass', headers, { lastReqDt });
    }
    async selectBhfList(headers, lastReqDt) {
        // KRA docs (Branch Information Management): /selectBhfList
        return this.request('POST', '/selectBhfList', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }
    async saveItem(headers, item) {
        return this.request('POST', '/saveItem', headers, item);
    }
    async selectItemInfo(headers, lastReqDt) {
        return this.request('POST', '/itemInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }
    async saveItemComposition(headers, composition) {
        return this.request('POST', '/saveItemComposition', headers, composition);
    }
    async selectImportedItemInfo(headers, lastReqDt) {
        return this.request('POST', '/importedItemInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }
    async saveImportedItemConvertedInfo(headers, conversion) {
        return this.request('POST', '/importedItemConvertedInfo', headers, conversion);
    }
    async sendSalesTransaction(headers, transaction) {
        return this.request('POST', '/sendSalesTransaction', headers, transaction);
    }
    async selectSalesTransactions(headers, lastReqDt) {
        return this.request('POST', '/selectSalesTransactions', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }
    async selectInvoiceDetail(headers, invcNo) {
        return this.request('POST', '/selectInvoiceDetail', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            invcNo,
        });
    }
    async getPurchaseTransactionInfo(headers, lastReqDt) {
        return this.request('POST', '/getPurchaseTransactionInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }
    async sendPurchaseTransactionInfo(headers, purchaseInfo) {
        return this.request('POST', '/sendPurchaseTransactionInfo', headers, purchaseInfo);
    }
    async selectStockMoveList(headers, lastReqDt) {
        return this.request('POST', '/selectStockMoveLists', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }
    async insertStockIO(headers, stockData) {
        return this.request('POST', '/insert/stockIO', headers, stockData);
    }
    async saveStockMaster(headers, stockMaster) {
        return this.request('POST', '/save/stockMaster', headers, stockMaster);
    }
    async selectCustomerPinInfo(headers, lastReqDt) {
        return this.request('POST', '/customerPinInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }
    async selectTaxpayerInfo(headers, lastReqDt) {
        return this.request('POST', '/selectTaxpayerInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }
    async selectNoticeList(headers, lastReqDt) {
        return this.request('POST', '/selectNoticeList', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }
    async branchSendCustomerInfo(headers, customerInfo) {
        // KRA docs: /saveBhfCustomer
        return this.request('POST', '/saveBhfCustomer', headers, customerInfo);
    }
    async branchUserAccount(headers, userInfo) {
        // KRA docs: /saveBhfUser
        return this.request('POST', '/saveBhfUser', headers, userInfo);
    }
}
