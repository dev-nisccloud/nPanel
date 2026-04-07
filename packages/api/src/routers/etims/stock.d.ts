export declare const etimsStockRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Retrieve stock movement requests between branches
     */
    getStockMovements: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
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
     * Record stock in/out transactions
     */
    sendStockIO: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            stockData: any;
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
     * Update stock master with current quantities
     */
    saveStockMaster: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            stockMaster: {
                itemCd: string;
                rsdQty: number;
                regrId: string;
                regrNm: string;
                modrNm: string;
                modrId: string;
            };
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
}>>;
