export declare const etimsPurchasesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Retrieve purchase transactions made from suppliers
     */
    getPurchaseTransactions: import("@trpc/server").TRPCQueryProcedure<{
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
     * Confirm purchase transactions for stock adjustment
     */
    sendPurchaseTransaction: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            purchase: any;
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
}>>;
