export declare const etimsSalesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Submit sales transaction and generate tax invoice
     */
    sendSalesTransaction: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            transaction: any;
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
     * Retrieve sales transaction history
     */
    getSalesTransactions: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            lastReqDt: string;
            bhfId?: string | undefined;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
    /**
     * Get detailed invoice information by invoice number
     */
    getInvoiceDetail: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            invcNo: string;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
}>>;
