export declare const zeepoAiBillingRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getTokenBalance: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId?: string | undefined;
        };
        output: {
            unlimited: boolean;
            tokens: number | null;
            hasSubscription: boolean;
            isAgency: boolean;
            walletInitialized: boolean;
            hasQualifyingService: boolean;
            welcomeEligible: boolean;
            welcomeTokenGrant: any;
            subscriptionId?: undefined;
        } | {
            unlimited: boolean;
            /** Always a number for customers  0 when wallet not initialized. */
            tokens: number;
            hasSubscription: boolean;
            subscriptionId: string | null;
            isAgency: boolean;
            walletInitialized: boolean;
            hasQualifyingService: boolean;
            welcomeEligible: boolean;
            welcomeTokenGrant: any;
        };
        meta: object;
    }>;
    listTokenActivity: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId: string;
            limit?: number | undefined;
        };
        output: {
            id: string;
            createdAt: Date;
            description: string | null;
            modelId: string | null;
            operationType: string;
            direction: string;
            tokens: string;
            balanceAfter: string;
        }[];
        meta: object;
    }>;
    /**
     * Agency ops: Claude + Google usage rolled up by user (agency) or team (customers).
     * Sourced from zeepo_ai_usage_event (product truth), not provider Admin APIs.
     */
    listUsageActivity: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from: unknown;
            to: unknown;
            page?: number | undefined;
            limit?: number | undefined;
            provider?: "google" | "anthropic" | "all" | undefined;
            eventType?: "generation" | "other" | "all" | "chat_turn" | "image_edit" | undefined;
            status?: "failed" | "succeeded" | "partial" | "all" | "cancelled" | undefined;
            teamId?: string | undefined;
            groupBy?: "user" | "team" | undefined;
            surface?: "all" | "support_fab" | "zeepo_ai" | undefined;
        };
        output: {
            groupBy: "user" | "team";
            items: {
                groupBy: "user";
                userId: string;
                userName: string | null;
                userEmail: string | null;
                teamId: string | null;
                teamName: string | null;
                teamSlug: string | null;
                events: number;
                inputTokens: number;
                outputTokens: number;
                providerCostUsd: number;
                tokensDebited: number;
                failed: number;
                teamsTouched: number;
                usersTouched: number;
                lastAt: Date;
            }[] | {
                groupBy: "team";
                userId: string | null;
                userName: string | null;
                userEmail: string | null;
                teamId: string | null;
                teamName: string;
                teamSlug: string | null;
                events: number;
                inputTokens: number;
                outputTokens: number;
                providerCostUsd: number;
                tokensDebited: number;
                failed: number;
                teamsTouched: number;
                usersTouched: number;
                lastAt: Date;
            }[];
            page: number;
            limit: number;
            total: number;
            summary: {
                events: number;
                inputTokens: number;
                outputTokens: number;
                providerCostUsd: number;
                tokensDebited: number;
                failed: number;
                avgLatencyMs: number;
                liveAiSupport: {
                    events: number;
                    providerCostUsd: number;
                    inputTokens: number;
                    outputTokens: number;
                };
                zeepoAi: {
                    events: number;
                    providerCostUsd: number;
                    inputTokens: number;
                    outputTokens: number;
                };
            };
            byProvider: {
                provider: string;
                events: number;
                providerCostUsd: number;
                inputTokens: number;
                outputTokens: number;
            }[];
            byEventType: {
                eventType: string;
                events: number;
                providerCostUsd: number;
            }[];
            byModel: {
                modelId: string;
                provider: string;
                events: number;
                providerCostUsd: number;
            }[];
        };
        meta: object;
    }>;
    listPaygPacks: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            currency: string | null;
            metadata: unknown;
            description: string | null;
            sortOrder: number;
            highlights: unknown;
            productId: string;
            pricingModel: string;
            billingCycle: string | null;
            price: string | null;
            setupFee: string | null;
            cost: string | null;
            costCurrency: string | null;
            commissionRate: string | null;
            commissionBase: string | null;
            commissionBaseDescription: string | null;
            planFeatures: unknown;
            isPopular: boolean;
            isRecommended: boolean;
            isDefault: boolean;
            pleskServicePlanId: string | null;
            pleskFilterId: string | null;
            pleskIpAddress: string | null;
            hostingType: string | null;
        }[];
        meta: object;
    }>;
    /**
     * Top-up packs for purchase UI (invoice via BuyNowDialog → nisc order).
     * PAYG plan is hidden  wallet is bootstrapped by welcome grant / first top-up.
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
                zeepoPlanType: string;
                tokenGrant: number;
                billingCycle: string | null;
                isPopular: boolean;
                isRecommended: boolean;
                isDefault: boolean;
                highlights: unknown;
                displayPrice: number;
                displayCurrency: string;
                priceUsd: number;
                currencyUsd: string;
            }[];
            productId: any;
            productName: string;
        };
        meta: object;
    }>;
}>>;
