import { type Context } from "../trpc";
export declare const paymentTransactionsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Agency only: record an external payment (M-Pesa receipt, bank transfer, etc.) in payment_transaction
     * so checkout can proceed via createFromPayment using the returned checkoutRequestId.
     */
    recordManual: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            transactionReference: string;
            amount: number;
            currency?: string | undefined;
            gateway?: "MPESA" | "JENGA" | "OTHER" | undefined;
            accountReference?: string | undefined;
            transactionDesc?: string | undefined;
            teamId?: string | undefined;
            notes?: string | undefined;
        };
        output: {
            transactionId: `${string}-${string}-${string}-${string}-${string}`;
            checkoutRequestId: string;
        };
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            limit?: number | undefined;
            offset?: number | undefined;
            status?: "PENDING" | "PROCESSING" | "CANCELLED" | "SUCCESS" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED" | undefined;
            gateway?: "MPESA" | "JENGA" | "OTHER" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE" | undefined;
        };
        output: {
            transactions: {
                id: string;
                userId: string;
                teamId: string | null;
                userName: string | null;
                gateway: "MPESA" | "JENGA" | "OTHER" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE";
                status: "PENDING" | "PROCESSING" | "CANCELLED" | "SUCCESS" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
                amount: string;
                currency: string;
                accountReference: string | null;
                transactionDesc: string | null;
                receiptNumber: string | null;
                initiatedAt: Date;
                processedAt: Date | null;
                failedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            total: number;
        };
        meta: object;
    }>;
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            userId: string;
            teamId: string | null;
            userName: string | null;
            teamName: string | null;
            gateway: "MPESA" | "JENGA" | "OTHER" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE";
            gatewayStatus: string | null;
            gatewayMessage: string | null;
            gatewayTransactionId: string | null;
            merchantRequestId: string | null;
            checkoutRequestId: string | null;
            receiptNumber: string | null;
            amount: string;
            paidAmount: string | null;
            currency: string;
            accountReference: string | null;
            transactionDesc: string | null;
            phoneNumber: string | null;
            status: "PENDING" | "PROCESSING" | "CANCELLED" | "SUCCESS" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
            rawResponse: unknown;
            rawError: unknown;
            initiatedAt: Date;
            processedAt: Date | null;
            failedAt: Date | null;
            refundedAt: Date | null;
            notes: string | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /**
     * Get summary statistics for payment transactions
     */
    getSummary: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            total: number;
            success: number;
            pending: number;
            failed: number;
            processing: number;
            completedTotal: number;
            activeTotal: number;
        };
        meta: object;
    }>;
}>>;
