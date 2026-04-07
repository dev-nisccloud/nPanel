export declare const publicPricingRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Public: get default TLD margin configuration (no prices).
     * Returns whether margin is percentage or fixed and the corresponding values.
     */
    getDefaultMarginConfig: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            data: {
                marginType: string | null;
                percentageMargin: string | null;
                fixedMargin: string | null;
                roundOff: string | null;
            } | null;
            error?: string | undefined;
        };
        meta: object;
    }>;
    /**
     * Public: get exchange rates only (no conversion).
     */
    getExchangeRatesPublic: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            baseCurrency?: string | undefined;
        } | undefined;
        output: {
            success: boolean;
            data: {
                base: string;
                rates: Record<string, number>;
                timestamp: number;
            } | null;
            error?: string | undefined;
        };
        meta: object;
    }>;
    /**
     * Legacy: batch currency conversion. Requires POST/mutation.
     * Prefer getExchangeRatesPublic + client-side math for new usage.
     */
    convertPricesPublic: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            prices: {
                amount: number;
                currency: string;
            }[];
            targetCurrency: string;
        };
        output: {
            success: boolean;
            data?: {
                originalAmount: number;
                convertedAmount: number;
                rate: number;
                currency: string;
            }[] | undefined;
            error?: string | undefined;
        };
        meta: object;
    }>;
}>>;
