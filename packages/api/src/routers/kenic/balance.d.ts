/**
 * KENIC registrar account balance (CoCCA finance EPP extension).
 */
export declare const kenicBalanceRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Get registrar credit balance from KENIC via EPP finance:info.
     * Response format from CoCCA: TLD|CURRENCY|BALANCE per zone.
     */
    getBalance: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            balance: number;
            currency: string;
            balances: {
                tld: string;
                currency: string;
                balance: number;
            }[];
        };
        meta: object;
    }>;
}>>;
