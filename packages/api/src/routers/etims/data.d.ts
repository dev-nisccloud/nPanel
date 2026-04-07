export declare const etimsDataRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Retrieve standard codes (payment types, receipt types, tax codes, etc.)
     */
    getCodeList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            tin: string;
            bhfId: string;
            lastReqDt: string;
            accessToken?: string | undefined;
            cmcKey?: string | undefined;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
    /**
     * Get item classification codes for categorizing products
     */
    getItemClassList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
            bhfId?: string | undefined;
        };
        output: {
            success: boolean;
            data: any;
            errorMessage?: undefined;
        } | {
            success: boolean;
            data: null;
            errorMessage: any;
        };
        meta: object;
    }>;
    /**
     * Get list of registered branches
     */
    getBranchList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
    /**
     * Retrieve notices from KRA
     */
    getNoticeList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
    /**
     * Get taxpayer registration details
     */
    getTaxpayerInfo: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
    /**
     * Retrieve registered customer PIN information
     */
    getCustomerList: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
}>>;
