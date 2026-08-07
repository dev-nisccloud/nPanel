/**
 * Jenga card payment gateway router (hosted redirect checkout).
 */
export declare const jengaRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Initiate Jenga card payment. Returns checkoutUrl + paymentData for browser POST form.
     */
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
            currency?: "USD" | "EUR" | "GBP" | "KES" | "TZS" | "UGX" | undefined;
            productType?: "Product" | "Service" | undefined;
            paymentTimeLimit?: string | undefined;
            teamId?: string | undefined;
            orderIntent?: {
                source: "buy_now" | "global_buy_now" | "storefront";
                returnPath?: string | undefined;
                returnOrigin?: string | undefined;
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
    /**
     * DB-only payment status by order reference (after callback/IPN).
     * Includes stored order intent so the return page can call createFromPayment.
     */
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
