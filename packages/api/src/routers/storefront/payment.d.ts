/**
 * Storefront payment procedures.
 *
 * All procedures here are gated by a storefrontToken  a short-lived HMAC-signed
 * token issued at registration time. No full session is required.
 *
 * - initiateStkPush: initiate M-Pesa STK Push for the checkout session
 * - pollPaymentStatus / queryStkPush: Daraja-first status (instant terminal feedback)
 *
 * Security:
 *  • Token is verified on every call (signature + expiry).
 *  • Checkout amount is always re-computed server-side from the cart payload.
 *  • Returns minimal data  no transaction IDs, no raw M-Pesa fields.
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
     * The payable amount is always computed server-side from the cart payload.
     */
    initiateStkPush: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            storefrontToken: string;
            phone: string;
            cart: {
                handoff?: string | undefined;
                main?: {
                    serviceType?: string | undefined;
                    planId?: string | undefined;
                    productId?: string | undefined;
                    planName?: string | undefined;
                    productName?: string | undefined;
                    billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "TRIENNIALLY" | "QUADRENNIALLY" | undefined;
                    locationName?: string | undefined;
                    bundleDomains?: string[] | undefined;
                    transferProvider?: "kenic" | "openprovider" | undefined;
                    providerPriceAmount?: number | undefined;
                    providerPriceCurrency?: string | undefined;
                    customerPriceAmount?: number | undefined;
                    customerPriceCurrency?: string | undefined;
                } | undefined;
                transferAuthCode?: string | undefined;
                upsellDomain?: {
                    domain: string;
                    isExisting?: boolean | undefined;
                    isTransfer?: boolean | undefined;
                    provider?: "kenic" | "openprovider" | undefined;
                } | undefined;
                upsellHosting?: {
                    serviceType: "web_hosting" | "wordpress_hosting" | "email_hosting";
                    planId: string;
                    billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "TRIENNIALLY" | "QUADRENNIALLY";
                } | undefined;
                hivelocity?: {
                    hivelocityProductId: number;
                    locationName: string;
                    selectedOsId: string;
                    selectedOptionIds: number[];
                } | undefined;
            };
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
     * Poll payment status  Daraja-first for instant terminal feedback (wrong PIN, cancelled, etc.).
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
    /**
     * Initiate Jenga hosted card checkout for storefront cart.
     * Amount is always recomputed server-side from the cart payload.
     */
    initiateJengaCheckout: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            storefrontToken: string;
            cart: {
                handoff?: string | undefined;
                main?: {
                    serviceType?: string | undefined;
                    planId?: string | undefined;
                    productId?: string | undefined;
                    planName?: string | undefined;
                    productName?: string | undefined;
                    billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "TRIENNIALLY" | "QUADRENNIALLY" | undefined;
                    locationName?: string | undefined;
                    bundleDomains?: string[] | undefined;
                    transferProvider?: "kenic" | "openprovider" | undefined;
                    providerPriceAmount?: number | undefined;
                    providerPriceCurrency?: string | undefined;
                    customerPriceAmount?: number | undefined;
                    customerPriceCurrency?: string | undefined;
                } | undefined;
                transferAuthCode?: string | undefined;
                upsellDomain?: {
                    domain: string;
                    isExisting?: boolean | undefined;
                    isTransfer?: boolean | undefined;
                    provider?: "kenic" | "openprovider" | undefined;
                } | undefined;
                upsellHosting?: {
                    serviceType: "web_hosting" | "wordpress_hosting" | "email_hosting";
                    planId: string;
                    billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "TRIENNIALLY" | "QUADRENNIALLY";
                } | undefined;
                hivelocity?: {
                    hivelocityProductId: number;
                    locationName: string;
                    selectedOsId: string;
                    selectedOptionIds: number[];
                } | undefined;
            };
            customer: {
                customerFirstName: string;
                customerLastName: string;
                customerEmail: string;
                customerPhone: string;
                customerAddress: string;
                customerPostalCodeZip: string;
                countryCode: string;
            };
            returnOrigin?: string | undefined;
            returnPath?: string | undefined;
        };
        output: {
            orderReference: string;
            checkoutUrl: string;
            paymentData: Record<string, string>;
            message: string;
        };
        meta: object;
    }>;
    /**
     * Poll Jenga payment status (DB only; updated by callback/IPN).
     */
    getJengaPaymentStatus: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            storefrontToken: string;
            orderReference: string;
        };
        output: {
            status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELLED";
            orderReference: string;
            amount: string;
            paidAmount: string | null;
            currency: string;
            failureReason: string | undefined;
            orderIntent: {
                cart: unknown;
                planId: string | undefined;
                productId: string | undefined;
                billingCycle: string | undefined;
                primaryDomain: string | undefined;
            } | null;
        };
        meta: object;
    }>;
}>>;
