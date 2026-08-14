/**
 * Storefront router  public landing page checkout.
 *
 * This namespace is ISOLATED from all dashboard routers by design.
 * Every procedure here is either:
 *   • publicProcedure   (no session required)
 *   • token-gated       (requires a valid storefrontToken issued at registration
 *                        or via session-backed issueCheckoutToken)
 *   • optional-session  (checkoutIdentity / issueCheckoutToken only; LANDING_PAGE_ORIGINS gated)
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
        checkoutIdentity: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                authenticated: false;
            } | {
                authenticated: true;
                user: {
                    id: string;
                    name: string;
                    email: string;
                };
                profile: {
                    complete: boolean;
                    missing: ("city" | "country" | "postalCode" | "phone" | "firstName" | "lastName" | "address")[];
                    prefill: {
                        firstName: string;
                        lastName: string;
                        phone: string;
                        address: string;
                        city: string;
                        state: string;
                        country: string;
                        postalCode: string;
                    };
                };
                teams: {
                    id: string;
                    name: string;
                    slug: string;
                    role: "MEMBER" | "OWNER" | "ADMIN" | "VIEWER";
                }[];
            };
            meta: object;
        }>;
        completeProfile: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                country: string;
                postalCode: string;
                state?: string | undefined;
            };
            output: {
                complete: boolean;
                missing: ("city" | "country" | "postalCode" | "phone" | "firstName" | "lastName" | "address")[];
                displayName: string;
                prefill: {
                    firstName: string;
                    lastName: string;
                    phone: string;
                    address: string;
                    city: string;
                    state: string;
                    country: string;
                    postalCode: string;
                };
            };
            meta: object;
        }>;
        createOrganization: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                name: string;
            };
            output: {
                id: `${string}-${string}-${string}-${string}-${string}`;
                name: string;
                slug: string;
                role: "OWNER";
            };
            meta: object;
        }>;
        issueCheckoutToken: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                teamId: string;
            };
            output: {
                storefrontToken: string;
                teamSlug: string;
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
                password: string;
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
    /** Authoritative cart pricing (never trust URL amounts). */
    cart: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        createHandoff: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                serviceType: string;
                productId?: string | undefined;
                billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "TRIENNIALLY" | "QUADRENNIALLY" | undefined;
                productName?: string | undefined;
                locationName?: string | undefined;
                providerPriceAmount?: number | undefined;
                providerPriceCurrency?: string | undefined;
                customerPriceAmount?: number | undefined;
                customerPriceCurrency?: string | undefined;
                planId?: string | undefined;
                planName?: string | undefined;
                bundleDomains?: string[] | undefined;
                transferProvider?: "kenic" | "openprovider" | undefined;
            };
            output: {
                handoff: string;
            };
            meta: object;
        }>;
        quote: import("@trpc/server").TRPCQueryProcedure<{
            input: {
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
            output: import("../../lib/storefront-cart-pricing").StorefrontCartQuote;
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
                returnOrigin: string;
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
                billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "TRIENNIALLY" | "QUADRENNIALLY" | undefined;
                primaryDomain?: string | undefined;
                cart?: {
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
                } | undefined;
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
