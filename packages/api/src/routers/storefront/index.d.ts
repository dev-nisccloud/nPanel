/**
 * Storefront router  public landing page checkout.
 *
 * This namespace is ISOLATED from all dashboard routers by design.
 * Every procedure here is either:
 *   • publicProcedure   (no session required)
 *   • token-gated       (requires a valid storefrontToken issued at registration)
 *
 * No dashboard protectedProcedure is ever used here.
 * No role other than "CUSTOMER" can be created through this router.
 * Any security incident in this namespace is immediately identifiable
 * because it will never touch ordersRouter, invoicingRouter, teamsRouter, etc.
 */
export declare const storefrontRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /** Email check + new customer registration. */
    auth: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        checkEmail: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                email: string;
            };
            output: {
                exists: boolean;
            };
            meta: object;
        }>;
        register: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                firstName: string;
                lastName: string;
                email: string;
                phone: string;
                companyName: string;
                acceptedTermsAndConditions: boolean;
                planName?: string | undefined;
            };
            output: {
                storefrontToken: string;
                teamSlug: string;
                displayName: string;
            };
            meta: object;
        }>;
    }>>;
    /** M-Pesa STK Push initiation + payment status polling. */
    payment: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
        queryStkPush: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                storefrontToken: string;
                checkoutRequestId: string;
            };
            output: import("../payment-gateway/mpesa/query-stk-push-status").StkPushQueryResult;
            meta: object;
        }>;
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
    /** Order creation + handoff to order processor after confirmed payment. */
    orders: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        createFromPayment: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                storefrontToken: string;
                checkoutRequestId: string;
                productId: string;
                planId?: string | undefined;
                billingCycle?: "MONTHLY" | "YEARLY" | undefined;
                primaryDomain?: string | undefined;
            };
            output: {
                orderId: string;
                orderNumber: string;
                teamSlug: string;
            };
            meta: object;
        }>;
    }>>;
}>>;
