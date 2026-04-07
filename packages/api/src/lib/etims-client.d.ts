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
    taxTyCd: string;
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
export declare class ETimsClient {
    private config;
    private cachedAccessToken;
    private cachedAccessTokenExpiresAtMs;
    constructor(config: ETimsConfig);
    /**
     * Generate OAuth 2.0 access token
     */
    generateToken(): Promise<AuthResponse>;
    private getValidAccessToken;
    private maskBearer;
    private omitNullishDeep;
    private request;
    initializeDevice(tin: string, bhfId: string, dvcSrlNo: string, accessToken?: string): Promise<any>;
    selectCodeList(headers: ETimsHeaders, lastReqDt: string): Promise<any>;
    selectItemClass(headers: ETimsHeaders, lastReqDt: string): Promise<any>;
    selectBhfList(headers: ETimsHeaders, lastReqDt: string): Promise<any>;
    saveItem(headers: ETimsHeaders, item: any): Promise<any>;
    selectItemInfo(headers: ETimsHeaders, lastReqDt: string): Promise<any>;
    saveItemComposition(headers: ETimsHeaders, composition: any): Promise<any>;
    selectImportedItemInfo(headers: ETimsHeaders, lastReqDt: string): Promise<any>;
    saveImportedItemConvertedInfo(headers: ETimsHeaders, conversion: any): Promise<any>;
    sendSalesTransaction(headers: ETimsHeaders, transaction: SalesTransaction): Promise<any>;
    selectSalesTransactions(headers: ETimsHeaders, lastReqDt: string): Promise<any>;
    selectInvoiceDetail(headers: ETimsHeaders, invcNo: string): Promise<any>;
    getPurchaseTransactionInfo(headers: ETimsHeaders, lastReqDt: string): Promise<any>;
    sendPurchaseTransactionInfo(headers: ETimsHeaders, purchaseInfo: any): Promise<any>;
    selectStockMoveList(headers: ETimsHeaders, lastReqDt: string): Promise<any>;
    insertStockIO(headers: ETimsHeaders, stockData: any): Promise<any>;
    saveStockMaster(headers: ETimsHeaders, stockMaster: any): Promise<any>;
    selectCustomerPinInfo(headers: ETimsHeaders, lastReqDt: string): Promise<any>;
    selectTaxpayerInfo(headers: ETimsHeaders, lastReqDt: string): Promise<any>;
    selectNoticeList(headers: ETimsHeaders, lastReqDt: string): Promise<any>;
    branchSendCustomerInfo(headers: ETimsHeaders, customerInfo: any): Promise<any>;
    branchUserAccount(headers: ETimsHeaders, userInfo: any): Promise<any>;
}
