/**
 * Payment Gateway Router
 *
 * This router contains all payment gateway integrations.
 * Currently supports:
 * - M-Pesa (Kenya)
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
}>>;
