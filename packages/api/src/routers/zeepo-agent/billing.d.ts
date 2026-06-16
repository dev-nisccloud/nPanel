export declare const zeepoAgentBillingRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /** Customer token balance for a team (agency users see balance but are not debited). */
    /** Live token balance from `nisc_client_subscription_usage.credits` (not the ledger audit table). */
    getTokenBalance: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId: string;
        };
        output: {
            tokens: number;
            hasSubscription: boolean;
            isAgency: boolean;
            unlimited: boolean;
        };
        meta: object;
    }>;
    /** Customer-facing usage history (tokens only - no USD). */
    listTokenActivity: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId: string;
            limit?: number | undefined;
        };
        output: {
            data: {
                id: string;
                description: string | null;
                createdAt: Date;
                balanceAfter: string;
                operationType: string;
                direction: string;
                tokens: string;
            }[];
        };
        meta: object;
    }>;
    /**
     * Plans for purchase UI. Prices stored in USD; pass displayCurrency=KES to get
     * converted retail prices using the same ceil FX strategy as domains.
     */
    listPurchasePlans: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            displayCurrency?: string | undefined;
        };
        output: {
            data: Array<Record<string, unknown>>;
            productId?: undefined;
            productName?: undefined;
        } | {
            data: {
                id: string;
                name: string;
                description: string | null;
                zeepoPlanType: {};
                tokenGrant: number;
                billingCycle: string | null;
                isPopular: boolean;
                isRecommended: boolean;
                isDefault: boolean;
                highlights: unknown;
                /** Retail price for checkout display */
                displayPrice: number;
                displayCurrency: string;
                /** Stored backend price (USD) - omit from customer UI components */
                priceUsd: number;
                currencyUsd: string;
            }[];
            productId: string;
            productName: string;
        };
        meta: object;
    }>;
}>>;
