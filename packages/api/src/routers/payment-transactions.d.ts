import { type Context } from "../trpc";
export declare const paymentTransactionsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            limit?: number | undefined;
            offset?: number | undefined;
            status?: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "REFUNDED" | "SUCCESS" | "PARTIALLY_REFUNDED" | undefined;
            gateway?: "MPESA" | "OTHER" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE" | undefined;
        };
        output: {
            transactions: {
                id: string;
                userId: string;
                teamId: string | null;
                userName: string | null;
                gateway: "MPESA" | "OTHER" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE";
                status: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "REFUNDED" | "SUCCESS" | "PARTIALLY_REFUNDED";
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
            gateway: "MPESA" | "OTHER" | "STRIPE" | "PAYPAL" | "FLUTTERWAVE";
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
            status: "PENDING" | "PROCESSING" | "CANCELLED" | "FAILED" | "REFUNDED" | "SUCCESS" | "PARTIALLY_REFUNDED";
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
}>>;
