/**
 * Storefront payment procedures.
 *
 * All procedures here are gated by a storefrontToken — a short-lived HMAC-signed
 * token issued at registration time. No full session is required.
 *
 * - initiateStkPush: initiate M-Pesa STK Push for the checkout session
 * - pollPaymentStatus / queryStkPush: Daraja-first status (instant terminal feedback)
 *
 * Security:
 *  • Token is verified on every call (signature + expiry).
 *  • Amount is re-derived server-side from planId — client value is used only as
 *    a hint and overridden if the plan price differs.
 *  • Returns minimal data — no transaction IDs, no raw M-Pesa fields.
 */
export declare const storefrontPaymentRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Initiate an M-Pesa STK Push for a storefront checkout session.
     *
     * The plan price is always re-fetched from the DB — the client-supplied
     * amount is ignored if it doesn't match the authoritative price.
     */
    initiateStkPush: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            storefrontToken: string;
            phone: string;
            clientAmount: number;
            planId?: string | undefined;
            billingCycle?: "MONTHLY" | "YEARLY" | undefined;
        };
        output: {
            checkoutRequestId: string;
            message: string;
        };
        meta: object;
    }>;
    /**
     * Query STK push status via Daraja first (instant feedback), same as dashboard buy-now.
     * Falls back to DB when Daraja returns processing codes.
     */
    queryStkPush: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            storefrontToken: string;
            checkoutRequestId: string;
        };
        output: import("../payment-gateway/mpesa/query-stk-push-status").StkPushQueryResult;
        meta: object;
    }>;
    /**
     * Poll payment status — Daraja-first for instant terminal feedback (wrong PIN, cancelled, etc.).
     *
     * Returns { status, failureReason } for legacy callers; prefer queryStkPush for full result codes.
     */
    pollPaymentStatus: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            storefrontToken: string;
            checkoutRequestId: string;
        };
        output: {
            status: "PROCESSING";
            failureReason: undefined;
        } | {
            status: "SUCCESS";
            failureReason: undefined;
        } | {
            status: "CANCELLED";
            failureReason: string;
        } | {
            status: "FAILED";
            failureReason: string;
        };
        meta: object;
    }>;
}>>;
