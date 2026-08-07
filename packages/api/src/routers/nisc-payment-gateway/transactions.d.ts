/**
 * Nisc Payment Gateway - Transactions
 *
 * Query transaction history with full M-Pesa details
 */
export declare const transactionsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * List transactions for merchant with full M-Pesa details
     */
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            merchantId: string;
            status?: "PENDING" | "PROCESSING" | "FAILED" | "CANCELLED" | "SUCCESS" | undefined;
            provider?: string | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            transactions: {
                id: string;
                merchantId: string;
                apiKeyId: string;
                paymentTransactionId: string;
                clientReferenceId: string | null;
                clientMetadata: unknown;
                provider: string;
                status: string;
                webhookDeliveryStatus: string;
                createdAt: Date;
                updatedAt: Date;
                gateway: string;
                gatewayStatus: string | null;
                gatewayMessage: string | null;
                merchantRequestId: string | null;
                checkoutRequestId: string | null;
                receiptNumber: string | null;
                amount: string;
                paidAmount: string | null;
                currency: string;
                accountReference: string | null;
                transactionDesc: string | null;
                phoneNumber: string | null;
                paymentStatus: string;
                rawResponse: unknown;
                initiatedAt: Date;
                processedAt: Date | null;
                failedAt: Date | null;
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
     * Get transaction details with full M-Pesa information
     */
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            transaction: {
                id: string;
                merchantId: string;
                apiKeyId: string;
                paymentTransactionId: string;
                clientReferenceId: string | null;
                clientMetadata: unknown;
                provider: string;
                status: string;
                webhookDeliveryStatus: string;
                createdAt: Date;
                updatedAt: Date;
                gateway: string;
                gatewayStatus: string | null;
                gatewayMessage: string | null;
                merchantRequestId: string | null;
                checkoutRequestId: string | null;
                receiptNumber: string | null;
                amount: string;
                paidAmount: string | null;
                currency: string;
                accountReference: string | null;
                transactionDesc: string | null;
                phoneNumber: string | null;
                paymentStatus: string;
                rawResponse: unknown;
                initiatedAt: Date;
                processedAt: Date | null;
                failedAt: Date | null;
            };
        };
        meta: object;
    }>;
}>>;
