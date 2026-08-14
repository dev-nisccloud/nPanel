/**
 * Payment Gateway Router
 *
 * This router contains all payment gateway integrations.
 * Currently supports:
 * - M-Pesa (Kenya)  STK Push
 * - Jenga  hosted card checkout
 *
 * Future gateways can be added here:
 * - Stripe
 * - PayPal
 * - Flutterwave
 * - etc.
 */
export declare const paymentGatewayRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    mpesa: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        initiateStkPush: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                phoneNumber: string;
                amount: number;
                accountReference: string;
                transactionDesc?: string | undefined;
                callbackUrl?: string | undefined;
                teamId?: string | undefined;
                checkoutTotalIncVat?: number | undefined;
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
    jenga: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        initiateCardPayment: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                customerFirstName: string;
                customerLastName: string;
                customerEmail: string;
                customerPhone: string;
                customerAddress: string;
                customerPostalCodeZip: string;
                countryCode: string;
                amount: number;
                productDescription: string;
                currency?: "KES" | "USD" | "EUR" | "GBP" | "TZS" | "UGX" | undefined;
                productType?: "Product" | "Service" | undefined;
                paymentTimeLimit?: string | undefined;
                teamId?: string | undefined;
                orderIntent?: {
                    source: "buy_now" | "global_buy_now" | "storefront";
                    returnOrigin: string;
                    returnPath?: string | undefined;
                    items?: unknown[] | undefined;
                    currency?: string | undefined;
                    teamId?: string | undefined;
                    billedForUserId?: string | undefined;
                    skipInvoice?: boolean | undefined;
                    cart?: unknown;
                    planId?: string | undefined;
                    productId?: string | undefined;
                    billingCycle?: string | undefined;
                    primaryDomain?: string | undefined;
                } | undefined;
            };
            output: {
                success: boolean;
                data: {
                    paymentTransactionId: `${string}-${string}-${string}-${string}-${string}`;
                    orderReference: string;
                    checkoutUrl: string;
                    paymentData: Record<string, string>;
                };
            };
            meta: object;
        }>;
        getPaymentStatus: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                orderReference: string;
            };
            output: {
                success: boolean;
                data: {
                    paymentTransactionId: string;
                    orderReference: string;
                    status: string;
                    amount: string;
                    paidAmount: string | null;
                    currency: string;
                    gatewayTransactionId: string | null;
                    receiptNumber: string | null;
                    gatewayMessage: string | null;
                    source: "buy_now" | "global_buy_now" | "storefront" | undefined;
                    orderIntent: {
                        items: unknown[] | undefined;
                        currency: string | undefined;
                        teamId: string | undefined;
                        billedForUserId: string | undefined;
                        skipInvoice: boolean | undefined;
                        cart: unknown;
                        planId: string | undefined;
                        productId: string | undefined;
                        billingCycle: string | undefined;
                        primaryDomain: string | undefined;
                    } | null;
                };
            };
            meta: object;
        }>;
    }>>;
}>>;
