/**
 * Nisc Payment Gateway - Access Logs (Analytics & Billing)
 *
 * Query aggregated access logs for analytics and billing
 */
export declare const accessLogsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Get monthly statistics
     */
    getMonthlyStats: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            merchantId: string;
            year: number;
            month: number;
        };
        output: {
            merchantId: string;
            year: number;
            month: number;
            stats: import("../../lib/nisc-payment-gateway-access-log").AccessLogStats;
        };
        meta: object;
    }>;
    /**
     * Get current month statistics
     */
    getCurrentMonthStats: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            merchantId: string;
        };
        output: {
            merchantId: string;
            year: number;
            month: number;
            stats: import("../../lib/nisc-payment-gateway-access-log").AccessLogStats;
        };
        meta: object;
    }>;
    /**
     * Get daily statistics
     */
    getDailyStats: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            merchantId: string;
            year: number;
            month: number;
            day: number;
        };
        output: {
            merchantId: string;
            year: number;
            month: number;
            day: number;
            stats: import("../../lib/nisc-payment-gateway-access-log").AccessLogStats;
        };
        meta: object;
    }>;
    /**
     * Get billing summary (for future billing system)
     */
    getBillingSummary: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            merchantId: string;
            year: number;
            month: number;
            pricePerRequest?: number | undefined;
        };
        output: {
            merchantId: string;
            year: number;
            month: number;
            stats: import("../../lib/nisc-payment-gateway-access-log").AccessLogStats;
            billing: {
                billableRequests: number;
                pricePerRequest: number;
                totalBill: number;
                currency: string;
            };
        };
        meta: object;
    }>;
}>>;
