export declare const currencyConversionRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getSupportedCurrencies: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            code: string;
            name: string;
            symbol: string;
        }[];
        meta: object;
    }>;
    getExchangeRates: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            baseCurrency?: string | undefined;
        };
        output: {
            success: boolean;
            data?: {
                base: string;
                rates: Record<string, number>;
                timestamp: number;
            } | undefined;
            error?: string | undefined;
        };
        meta: object;
    }>;
    convertPrices: import("@trpc/server").TRPCMutationProcedure<{
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
    getApiConfigStatus: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            apiKeyConfigured: boolean;
            apiTier: "free" | "paid";
            apiEndpoint: string;
            monthlyLimit: number;
        };
        meta: object;
    }>;
    getCacheStatus: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            redisConnected: boolean;
            cacheKeys: string[];
            lastFetchTime?: number | undefined;
            cacheAge?: string | undefined;
        };
        meta: object;
    }>;
    getApiUsageStatus: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            currentUsage: number;
            monthlyLimit: number;
            usagePercentage: number;
            status: "normal" | "warning" | "critical";
        };
        meta: object;
    }>;
}>>;
