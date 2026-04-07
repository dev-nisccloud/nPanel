/**
 * M-Pesa payment gateway router
 *
 * Security measures implemented:
 * - All endpoints require authentication (protectedProcedure)
 * - Input validation using Zod schemas
 * - No hardcoded credentials (all from environment variables)
 * - Phone number sanitization and validation
 * - Amount validation (positive numbers only)
 * - Error handling without exposing sensitive information
 */
export declare const mpesaRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Initiate STK Push payment request
     *
     * This endpoint initiates an M-Pesa STK Push payment request.
     * The user will receive a prompt on their phone to enter their M-Pesa PIN.
     *
     * Security:
     * - Requires authenticated user session
     * - Validates phone number format
     * - Validates amount (must be positive)
     * - All credentials from environment variables
     */
    initiateStkPush: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            phoneNumber: string;
            amount: number;
            accountReference: string;
            transactionDesc?: string | undefined;
            callbackUrl?: string | undefined;
            teamId?: string | undefined;
        };
        output: {
            success: boolean;
            data: {
                transactionId: `${string}-${string}-${string}-${string}-${string}`;
                merchantRequestId: string;
                checkoutRequestId: string;
                responseCode: string;
                responseDescription: string;
                customerMessage: string;
            };
        };
        meta: object;
    }>;
    /**
     * Get payment status by checkout ID (DB-only, no M-Pesa API).
     * Used for polling after STK Push: webhook updates DB, client polls this.
     * Matches pattern from solidarity-online-drivers-sacco (GET /api/mpesa/status).
     */
    getPaymentStatusByCheckoutId: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            checkoutRequestId: string;
        };
        output: {
            status: null;
            resultCode: null;
            resultDesc: null;
        } | {
            status: string;
            resultCode: string | null;
            resultDesc: string | null;
        };
        meta: object;
    }>;
    /**
     * Query STK Push payment status (Daraja-first polling).
     *
     * Polls M-Pesa Daraja STK Query API first for immediate result; if Daraja returns
     * processing/error, falls back to DB (webhook may have already updated). When Daraja
     * returns a terminal result, we update the transaction table immediately (same as webhook).
     *
     * Security:
     * - Requires authenticated user session
     * - Validates checkout request ID; DB lookup scoped by userId
     */
    queryStkPush: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            checkoutRequestId: string;
        };
        output: {
            success: boolean;
            data: {
                responseCode: string;
                responseDescription: string;
                merchantRequestId: string;
                checkoutRequestId: string;
                resultCode: string;
                resultDesc: string;
            };
        };
        meta: object;
    }>;
}>>;
