/**
 * Nisc Payment Gateway - Request Logs
 *
 * Query detailed request logs
 */
export declare const requestLogsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List request logs for merchant
     */
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            merchantId: string;
            apiKeyId?: string | undefined;
            endpoint?: string | undefined;
            statusCode?: number | undefined;
            success?: boolean | undefined;
            startDate?: Date | undefined;
            endDate?: Date | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            logs: {
                id: string;
                endpoint: string;
                method: string;
                statusCode: number;
                success: boolean;
                ipAddress: string | null;
                timestamp: Date;
                durationMs: number;
            }[];
            pagination: {
                limit: number;
                offset: number;
                hasMore: boolean;
            };
        };
        meta: object;
    }>;
    /**
     * Get detailed request log
     */
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            log: {
                id: string;
                merchantId: string;
                apiKeyId: string;
                endpoint: string;
                method: string;
                path: string;
                requestHeaders: unknown;
                requestBody: unknown;
                requestSize: number | null;
                rawRequest: string | null;
                ipAddress: string | null;
                userAgent: string | null;
                country: string | null;
                statusCode: number;
                success: boolean;
                errorCode: string | null;
                errorMessage: string | null;
                responseBody: unknown;
                responseSize: number | null;
                rawResponse: string | null;
                timestamp: Date;
                durationMs: number;
                gatewayTransactionId: string | null;
                paymentTransactionId: string | null;
                rateLimitRemaining: number | null;
                rateLimitHit: boolean;
                year: number;
                month: number;
                day: number;
                hour: number;
                metadata: unknown;
            };
        };
        meta: object;
    }>;
}>>;
