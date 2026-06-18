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
    private buildUrl;
    /**
     * Build request headers.
     * Initialization only needs Authorization.
     * All other endpoints also need tin + bhfId + cmcKey.
     */
    private buildHeaders;
    /**
     * Omit null/undefined values from the payload recursively.
     * KRA sandbox rejects requests with null fields in many cases.
     */
    private omitNullish;
    private post;
    selectInitOsdcInfo(payload: {
        tin: string;
        bhfId: string;
        dvcSrlNo: string;
    }): Promise<unknown>;
    selectCodeList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    selectNoticeList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    /** Look up a single customer by their KRA TIN (central registry). */
    selectCustomer(oscu: EtimsOscuHeaders, custmTin: string): Promise<unknown>;
    /** List customers registered on this branch via saveBhfCustomer. */
    selectCustomerList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    selectBhfList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    saveBhfCustomer(oscu: EtimsOscuHeaders, customerData: Record<string, unknown>): Promise<unknown>;
    saveBhfUser(oscu: EtimsOscuHeaders, userData: Record<string, unknown>): Promise<unknown>;
    selectItemClsList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    selectItemList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    saveItem(oscu: EtimsOscuHeaders, item: Record<string, unknown>): Promise<unknown>;
    saveItemComposition(oscu: EtimsOscuHeaders, composition: Record<string, unknown>): Promise<unknown>;
    selectImportItemList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
    updateImportItem(oscu: EtimsOscuHeaders, item: Record<string, unknown>): Promise<unknown>;
    saveTrnsSalesOsdc(oscu: EtimsOscuHeaders, transaction: Record<string, unknown>): Promise<unknown>;
    selectTrnsSalesList(oscu: EtimsOscuHeaders, lastReqDt: string): Promise<unknown>;
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
