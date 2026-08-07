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
export declare class EtimsApiError extends Error {
    readonly resultCd: string;
    readonly resultMsg: string;
    readonly response: Record<string, unknown>;
    constructor(endpointKey: string, resultCd: string, resultMsg: string, response: Record<string, unknown>);
}
/**
 * KRA Developer Platform (Apigee / etims-oscu) endpoint paths.
 * Matches Postman collection + docs/kra-etims-api.md.
 */
declare const DEV_PLATFORM_ENDPOINTS: {
    readonly selectInitOsdcInfo: "/initialize";
    readonly selectCodeList: "/selectCodeList";
    readonly selectNoticeList: "/selectNoticeList";
    readonly selectNotices: "/selectNotices";
    readonly selectCustomer: "/customerPinInfo";
    readonly selectCustomerList: "/selectCustomerList";
    readonly selectTaxPayerInfo: "/selectTaxpayerInfo";
    readonly selectBhfList: "/branchList";
    readonly saveBhfCustomer: "/branchSendCustomerInfo";
    readonly saveBhfUser: "/branchUserAccount";
    readonly saveBhfInsurance: "/branchInsuranceInfo";
    readonly selectItemClsList: "/selectItemClass";
    readonly selectItemList: "/itemInfo";
    readonly saveItem: "/saveItem";
    readonly saveItemComposition: "/saveItemComposition";
    readonly selectImportItemList: "/importedItemInfo";
    readonly updateImportItem: "/importedItemConvertedInfo";
    readonly saveTrnsSalesOsdc: "/sendSalesTransaction";
    readonly selectTrnsSalesList: "/selectSalesTransactions";
    readonly selectInvoiceDetails: "/selectInvoiceDetail";
    readonly selectTrnsPurchaseSalesList: "/getPurchaseTransactionInfo";
    readonly insertTrnsPurchase: "/sendPurchaseTransactionInfo";
    readonly selectStockMoveList: "/selectStockMoveLists";
    readonly insertStockIO: "/insert/stockIO";
    readonly saveStockMaster: "/save/stockMaster";
};
export type EtimsEndpointKey = keyof typeof DEV_PLATFORM_ENDPOINTS;
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
export declare class EtimsOscuClient {
    private config;
    private memToken;
    private memTokenExpiresAt;
    constructor(config: EtimsClientConfig);
    /**
     * Get a valid OAuth access token, using Redis as the primary cache
     * and an in-memory fallback. Never fetches more than once per TTL.
     */
    getToken(forceRefresh?: boolean): Promise<string>;
    clearToken(): Promise<void>;
    private fetchToken;
    private endpointPath;
    private buildUrl;
    /**
     * Build request headers.
     * Legacy host: Authorization + tin/bhfId(/cmcKey)  apigee optional.
     * Developer Platform: also sends apigee_app_id (required for saveItem / session scoring).
     */
    private buildHeaders;
    /**
     * Omit null/undefined values from the payload recursively.
     * KRA sandbox rejects requests with null fields in many cases.
     */
    private omitNullish;
    /**
     * Call a KRA endpoint and return the exact response as received.
     * Does not unwrap responseBody, does not throw on business resultCd.
     * Used for certification testing and response typing.
     */
    requestRaw(endpointKey: EtimsEndpointKey, body: Record<string, unknown>, oscu?: EtimsOscuHeaders): Promise<EtimsRawResponse>;
    private post;
    selectInitOsdcInfo(payload: {
        tin: string;
        bhfId: string;
        dvcSrlNo: string;
    }): Promise<unknown>;
    /**
     * Standard sync/search body for Developer Platform list endpoints.
     * tin + bhfId (+ cmcKey) are required in the JSON body, not only headers.
     */
    private lastReqBody;
    selectCodeList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    selectNoticeList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    /** Dashboard test case path: /selectNotices */
    selectNotices(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    /** Look up a single customer by their KRA TIN (central registry). */
    selectCustomer(oscu: EtimsOscuHeaders, custmTin: string): Promise<unknown>;
    /** List customers registered on this branch via saveBhfCustomer. */
    selectCustomerList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    selectTaxPayerInfo(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    selectBhfList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    saveBhfCustomer(oscu: EtimsOscuHeaders, customerData: Record<string, unknown>): Promise<unknown>;
    saveBhfUser(oscu: EtimsOscuHeaders, userData: Record<string, unknown>): Promise<unknown>;
    saveBhfInsurance(oscu: EtimsOscuHeaders, insurance: Record<string, unknown>): Promise<unknown>;
    selectItemClsList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    selectItemList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    saveItem(oscu: EtimsOscuHeaders, item: Record<string, unknown>): Promise<unknown>;
    saveItemComposition(oscu: EtimsOscuHeaders, composition: Record<string, unknown>): Promise<unknown>;
    selectImportItemList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    updateImportItem(oscu: EtimsOscuHeaders, item: Record<string, unknown>): Promise<unknown>;
    saveTrnsSalesOsdc(oscu: EtimsOscuHeaders, transaction: Record<string, unknown>): Promise<unknown>;
    /** List sales transactions submitted by this taxpayer/branch. */
    selectTrnsSalesList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    selectInvoiceDetails(oscu: EtimsOscuHeaders, invcNo: number): Promise<unknown>;
    selectTrnsPurchaseSalesList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    insertTrnsPurchase(oscu: EtimsOscuHeaders, purchase: Record<string, unknown>): Promise<unknown>;
    selectStockMoveList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    insertStockIO(oscu: EtimsOscuHeaders, stockData: Record<string, unknown>): Promise<unknown>;
    saveStockMaster(oscu: EtimsOscuHeaders, stockMaster: Record<string, unknown>): Promise<unknown>;
}
/**
 * Get (or create) the module-level eTIMS client singleton.
 * All routers must use this instead of `new EtimsOscuClient(...)` to share the token cache.
 */
export declare function getEtimsClient(config: EtimsClientConfig): EtimsOscuClient;
export {};
