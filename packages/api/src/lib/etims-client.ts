import { request } from 'undici';

export interface ETimsConfig {
    baseUrl: string;
}

export interface ETimsHeaders {
    tin: string;
    bhfId: string;
    cmcKey?: string;
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

export class ETimsClient {
    private config: ETimsConfig;

    constructor(config: ETimsConfig) {
        this.config = config;
    }

    private async post<T>(endpoint: string, headers: ETimsHeaders, body: any): Promise<T> {
        const url = `${this.config.baseUrl}${endpoint}`;

        console.log(`[eTIMS] Requesting ${url}...`);

        const res = await request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                tin: headers.tin,
                bhfId: headers.bhfId,
                ...(headers.cmcKey ? { cmcKey: headers.cmcKey } : {}),
            },
            body: JSON.stringify(body),
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

    async initializeDevice(tin: string, bhfId: string, dvcSrlNo: string) {
        return this.post<any>(
            '/initialize',
            {
                tin,
                bhfId,
            },
            {
                tin,
                bhfId,
                dvcSrlNo,
            }
        );
    }

    async selectCodeList(headers: ETimsHeaders, lastReqDt: string) {
        return this.post<any>('/select-code-list', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async selectItemClass(headers: ETimsHeaders, lastReqDt: string) {
        return this.post<any>('/select-item-class', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async selectBhfList(headers: ETimsHeaders, lastReqDt: string) {
        return this.post<any>('/branch-list', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async saveItem(headers: ETimsHeaders, item: any) {
        return this.post<any>('/saveItem', headers, item);
    }

    async sendSalesTransaction(headers: ETimsHeaders, transaction: SalesTransaction) {
        return this.post<any>('/sendSalesTransaction', headers, transaction);
    }

    async getPurchaseTransactionInfo(headers: ETimsHeaders, lastReqDt: string) {
        return this.post<any>('/getPurchaseTransactionInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async selectStockMoveList(headers: ETimsHeaders, lastReqDt: string) {
        return this.post<any>('/selectStockMoveLists', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            lastReqDt,
        });
    }

    async insertStockIO(headers: ETimsHeaders, stockData: any) {
        return this.post<any>('/insert/stockIO', headers, stockData);
    }

    async saveStockMaster(headers: ETimsHeaders, stockMaster: any) {
        return this.post<any>('/save/stockMaster', headers, stockMaster);
    }

    async selectCustomerList(headers: ETimsHeaders, custmTin: string) {
        return this.post<any>('/selectCustomerList', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            custmTin,
        });
    }

    async selectTaxpayerInfo(headers: ETimsHeaders, targetTin: string) {
        return this.post<any>('/selectTaxpayerInfo', headers, {
            tin: headers.tin,
            bhfId: headers.bhfId,
            targetTin,
        });
    }
}
