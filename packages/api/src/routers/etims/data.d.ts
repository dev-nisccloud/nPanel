export declare const etimsDataRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Retrieve standard code lists (payment types, receipt types, tax codes, etc.)
     * POST /selectCodeList
     */
    getCodeList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Retrieve item classification codes for categorizing products.
     * POST /selectItemClsList
     */
    getItemClassList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
        };
        output: {
            success: boolean;
            data: unknown;
            errorMessage?: undefined;
        } | {
            success: boolean;
            data: null;
            errorMessage: string;
        };
        meta: object;
    }>;
    /**
     * Look up a specific customer by their KRA TIN.
     * POST /selectCustomer  (requires custmTin, NOT lastReqDt)
     */
    lookupCustomer: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            custmTin: string;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
    /**
     * Retrieve KRA notices (announcements, policy changes).
     * POST /selectNoticeList
     */
    getNoticeList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
        };
        output: {
            success: boolean;
            data: unknown;
        };
        meta: object;
    }>;
}>>;
