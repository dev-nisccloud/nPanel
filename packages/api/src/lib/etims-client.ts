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

    private async request<T>(method: 'GET' | 'POST', endpoint: string, headers: ETimsHeaders, body?: any): Promise<T> {
        const url = `${this.config.baseUrl}${endpoint}`;

        const headersObj = {
            'Content-Type': 'application/json',
            'Authorization': headers.accessToken ? `Bearer ${headers.accessToken}` : '',
            'apigee_app_id': this.config.consumerKey,
            'tin': headers.tin,
            'bhfId': headers.bhfId,
            ...(headers.cmcKey ? { 'cmcKey': headers.cmcKey } : {}),
        };

        console.log(`[eTIMS] ${method} ${url}`);
        console.log(`[eTIMS] Headers:`, JSON.stringify(headersObj, null, 2));
        if (body) {
            console.log(`[eTIMS] Body:`, JSON.stringify(body, null, 2));
        }

        const res = await request(url, {
            method,
            headers: headersObj,
            body: body ? JSON.stringify(body) : undefined,
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
        return this.request<any>('POST', '/branchList', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async saveItem(headers: ETimsHeaders, item: any) {
        return this.request<any>('POST', '/saveItem', headers, item);
    }

    async selectItemInfo(headers: ETimsHeaders, lastReqDt: string) {
        return this.request<any>('POST', '/itemInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async saveItemComposition(headers: ETimsHeaders, composition: any) {
        return this.request<any>('POST', '/saveItemComposition', headers, composition);
    }

    async selectImportedItemInfo(headers: ETimsHeaders, lastReqDt: string) {
        return this.request<any>('POST', '/importedItemInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async saveImportedItemConvertedInfo(headers: ETimsHeaders, conversion: any) {
        return this.request<any>('POST', '/importedItemConvertedInfo', headers, conversion);
    }

    async sendSalesTransaction(headers: ETimsHeaders, transaction: SalesTransaction) {
        return this.request<any>('POST', '/sendSalesTransaction', headers, transaction);
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
        return this.request<any>('POST', '/sendPurchaseTransactionInfo', headers, purchaseInfo);
    }

    async selectStockMoveList(headers: ETimsHeaders, lastReqDt: string) {
        return this.request<any>('POST', '/selectStockMoveLists', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async insertStockIO(headers: ETimsHeaders, stockData: any) {
        return this.request<any>('POST', '/insert/stockIO', headers, stockData);
    }

    async saveStockMaster(headers: ETimsHeaders, stockMaster: any) {
        return this.request<any>('POST', '/save/stockMaster', headers, stockMaster);
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
        return this.request<any>('POST', '/branchSendCustomerInfo', headers, customerInfo);
    }

    async branchUserAccount(headers: ETimsHeaders, userInfo: any) {
        return this.request<any>('POST', '/branchUserAccount', headers, userInfo);
    }

    async branchInsuranceInfo(headers: ETimsHeaders, insuranceInfo: any) {
        return this.request<any>('POST', '/branchInsuranceInfo', headers, insuranceInfo);
    }
}
