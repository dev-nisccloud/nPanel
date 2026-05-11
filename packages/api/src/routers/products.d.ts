export declare const productsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /** List all products with optional filtering (cached via Upstash Redis) */
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            category?: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING" | undefined;
            serviceType?: string | undefined;
            isActive?: boolean | undefined;
        } | undefined;
        output: {
            id: string;
            name: string;
            description: string | null;
            category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
            serviceType: string;
            isActive: boolean;
            sortOrder: number;
            features: unknown[];
            highlights: string[];
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: object;
    }>;
    /** Get a single product by ID, optionally including its plans (cached via Upstash Redis) */
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
            includePlans?: boolean | undefined;
        };
        output: {
            plans?: any;
            id: string;
            name: string;
            description: string | null;
            category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
            serviceType: string;
            isActive: boolean;
            sortOrder: number;
            features: unknown[];
            highlights: string[];
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** Get add-on products for a base product (cached via Upstash Redis) */
    getAddOnsForProduct: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            baseProductId: string;
        };
        output: {
            product: {
                id: string;
                name: string;
                description: string | null;
                category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                serviceType: string;
                isActive: boolean;
                sortOrder: number;
                features: unknown[];
                highlights: string[];
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            plans: unknown[];
        }[];
        meta: object;
    }>;
    /** Get products whose name contains "hosting" (cached via Upstash Redis) */
    getHostingProductsForUpsell: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            product: {
                id: string;
                name: string;
                description: string | null;
                category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                serviceType: string;
                isActive: boolean;
                sortOrder: number;
                features: unknown[];
                highlights: string[];
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            plans: unknown[];
        }[];
        meta: object;
    }>;
    /** Get plans for pricing table from products named "web hosting" or "website hosting" (case-insensitive). Returns product-level feature list (table rows) and plans with per-feature values (enabled + valueOverride exactly as stored, no number conversion). */
    getHostingPlansForPricing: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            productFeatures: {
                key: string;
                label: string;
            }[];
            plans: {
                id: string;
                name: string;
                niscPrice: string | null;
                niscCurrency: string;
                billingCycle: string;
                isPopular: boolean;
                isRecommended: boolean;
                productId: string;
                productName: string;
                featureValues: {
                    available: boolean;
                    valueOverride: string | null;
                }[];
            }[];
        };
        meta: object;
    }>;
    /** Get plans for pricing table from products named "email hosting" (case-insensitive). Same shape as getHostingPlansForPricing. */
    getEmailHostingPlansForPricing: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            productFeatures: {
                key: string;
                label: string;
            }[];
            plans: {
                id: string;
                name: string;
                niscPrice: string | null;
                niscCurrency: string;
                billingCycle: string;
                isPopular: boolean;
                isRecommended: boolean;
                productId: string;
                productName: string;
                featureValues: {
                    available: boolean;
                    valueOverride: string | null;
                }[];
            }[];
        };
        meta: object;
    }>;
    /** Plans for SEO customer pricing table. Product name contains "seo" (case-insensitive). Same shape as getHostingPlansForPricing. */
    getSeoPlansForPricing: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            productFeatures: {
                key: string;
                label: string;
            }[];
            plans: {
                id: string;
                name: string;
                niscPrice: string | null;
                niscCurrency: string;
                billingCycle: string;
                isPopular: boolean;
                isRecommended: boolean;
                productId: string;
                productName: string;
                featureValues: {
                    available: boolean;
                    valueOverride: string | null;
                }[];
            }[];
        };
        meta: object;
    }>;
    /** Creative / design pricing; product name matches creatives design, creative_design, or creatives_design (case-insensitive). Same shape as getHostingPlansForPricing. */
    getCreativesDesignPlansForPricing: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            productFeatures: {
                key: string;
                label: string;
            }[];
            plans: {
                id: string;
                name: string;
                niscPrice: string | null;
                niscCurrency: string;
                billingCycle: string;
                isPopular: boolean;
                isRecommended: boolean;
                productId: string;
                productName: string;
                featureValues: {
                    available: boolean;
                    valueOverride: string | null;
                }[];
            }[];
        };
        meta: object;
    }>;
    /**
     * Plans for the Nisc Email Marketing customer app pricing table. Matches products named
     * "Nisc Email Marketing" or "Email Marketing" (case-insensitive, substring). Same output shape
     * as getHostingPlansForPricing.
     */
    getNiscEmailMarketingPlansForPricing: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            productFeatures: {
                key: string;
                label: string;
            }[];
            plans: {
                id: string;
                name: string;
                niscPrice: string | null;
                niscCurrency: string;
                billingCycle: string;
                isPopular: boolean;
                isRecommended: boolean;
                productId: string;
                productName: string;
                featureValues: {
                    available: boolean;
                    valueOverride: string | null;
                }[];
            }[];
        };
        meta: object;
    }>;
    /** Get plans for pricing by marketplace slug. Searches products by name using slug-derived or predefined search terms (e.g. website-hosting → "website hosting", "web hosting"). Same output shape as getHostingPlansForPricing. */
    getPlansForPricingBySlug: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            slug: string;
        };
        output: {
            productFeatures: {
                key: string;
                label: string;
            }[];
            plans: {
                id: string;
                name: string;
                niscPrice: string | null;
                niscCurrency: string;
                billingCycle: string;
                isPopular: boolean;
                isRecommended: boolean;
                productId: string;
                productName: string;
                featureValues: {
                    available: boolean;
                    valueOverride: string | null;
                }[];
            }[];
        };
        meta: object;
    }>;
    /** Create a new product */
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
            serviceType: string;
            description?: string | undefined;
            isActive?: boolean | undefined;
            sortOrder?: number | undefined;
            features?: {
                key: string;
                label: string;
                description?: string | undefined;
            }[] | undefined;
            highlights?: string[] | undefined;
            metadata?: Record<string, unknown> | undefined;
        };
        output: {
            id: string;
            name: string;
            description: string | null;
            category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
            serviceType: string;
            isActive: boolean;
            sortOrder: number;
            features: unknown[];
            highlights: string[];
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** Update an existing product */
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            name?: string | undefined;
            description?: string | undefined;
            category?: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING" | undefined;
            serviceType?: string | undefined;
            isActive?: boolean | undefined;
            sortOrder?: number | undefined;
            features?: {
                key: string;
                label: string;
                description?: string | undefined;
            }[] | undefined;
            highlights?: string[] | undefined;
            metadata?: Record<string, unknown> | undefined;
        };
        output: {
            id: string;
            name: string;
            description: string | null;
            category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
            serviceType: string;
            isActive: boolean;
            sortOrder: number;
            features: unknown[];
            highlights: string[];
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** Permanently delete a product from the database. Only allowed when product is inactive and has no subscriptions. */
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    /** Get default (or first) active plan ID for a product. Used when creating orders from payment (e.g. domain registration). */
    getDefaultPlanIdForProduct: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            productId: string;
        };
        output: string | null;
        meta: object;
    }>;
    /** Get a single plan by ID */
    getPlanById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            productId: string;
            name: string;
            description: string | null;
            pricingModel: "FIXED" | "COMMISSION";
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
            price: string | null;
            currency: string | null;
            setupFee: string | null;
            commissionRate: unknown;
            commissionBase: string | null;
            commissionBaseDescription: string | null;
            planFeatures: unknown[];
            highlights: string[];
            isPopular: boolean;
            isRecommended: boolean;
            isActive: boolean;
            isDefault: boolean;
            sortOrder: number;
            pleskServicePlanId: string | null;
            pleskFilterId: string | null;
            pleskIpAddress: string | null;
            hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** Create a new plan within a product */
    createPlan: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            productId: string;
            name: string;
            pricingModel: "FIXED" | "COMMISSION";
            description?: string | undefined;
            billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
            price?: string | undefined;
            currency?: string | undefined;
            setupFee?: string | undefined;
            commissionRate?: number | undefined;
            commissionBase?: string | undefined;
            commissionBaseDescription?: string | undefined;
            planFeatures?: {
                key: string;
                available: boolean;
                valueOverride?: string | undefined;
            }[] | undefined;
            highlights?: string[] | undefined;
            isPopular?: boolean | undefined;
            isRecommended?: boolean | undefined;
            isActive?: boolean | undefined;
            isDefault?: boolean | undefined;
            sortOrder?: number | undefined;
            pleskServicePlanId?: string | undefined;
            pleskFilterId?: string | undefined;
            pleskIpAddress?: string | undefined;
            hostingType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
            metadata?: Record<string, unknown> | undefined;
        };
        output: {
            id: string;
            productId: string;
            name: string;
            description: string | null;
            pricingModel: "FIXED" | "COMMISSION";
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
            price: string | null;
            currency: string | null;
            setupFee: string | null;
            commissionRate: unknown;
            commissionBase: string | null;
            commissionBaseDescription: string | null;
            planFeatures: unknown[];
            highlights: string[];
            isPopular: boolean;
            isRecommended: boolean;
            isActive: boolean;
            isDefault: boolean;
            sortOrder: number;
            pleskServicePlanId: string | null;
            pleskFilterId: string | null;
            pleskIpAddress: string | null;
            hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** Update an existing plan */
    updatePlan: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            productId?: string | undefined;
            name?: string | undefined;
            description?: string | undefined;
            pricingModel?: "FIXED" | "COMMISSION" | undefined;
            billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
            price?: string | undefined;
            currency?: string | undefined;
            setupFee?: string | undefined;
            commissionRate?: number | undefined;
            commissionBase?: string | undefined;
            commissionBaseDescription?: string | undefined;
            planFeatures?: {
                key: string;
                available: boolean;
                valueOverride?: string | undefined;
            }[] | undefined;
            highlights?: string[] | undefined;
            isPopular?: boolean | undefined;
            isRecommended?: boolean | undefined;
            isActive?: boolean | undefined;
            isDefault?: boolean | undefined;
            sortOrder?: number | undefined;
            pleskServicePlanId?: string | undefined;
            pleskFilterId?: string | undefined;
            pleskIpAddress?: string | undefined;
            hostingType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
            metadata?: Record<string, unknown> | undefined;
        };
        output: {
            id: string;
            productId: string;
            name: string;
            description: string | null;
            pricingModel: "FIXED" | "COMMISSION";
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
            price: string | null;
            currency: string | null;
            setupFee: string | null;
            commissionRate: unknown;
            commissionBase: string | null;
            commissionBaseDescription: string | null;
            planFeatures: unknown[];
            highlights: string[];
            isPopular: boolean;
            isRecommended: boolean;
            isActive: boolean;
            isDefault: boolean;
            sortOrder: number;
            pleskServicePlanId: string | null;
            pleskFilterId: string | null;
            pleskIpAddress: string | null;
            hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** Soft-delete a plan (set isActive = false) */
    deletePlan: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    listPlanUsages: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            productId?: string | undefined;
            productPlanId?: string | undefined;
            usageKind?: string | undefined;
        } | undefined;
        output: {
            id: string;
            productId: string;
            productPlanId: string;
            userId: string | null;
            teamId: string | null;
            usageKind: string;
            limitValue: string;
            overuse: "HARD" | "SOFT";
            period: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: object;
    }>;
    getPlanUsageById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            productId: string;
            productPlanId: string;
            userId: string | null;
            teamId: string | null;
            usageKind: string;
            limitValue: string;
            overuse: "HARD" | "SOFT";
            period: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    createPlanUsage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            productId: string;
            productPlanId: string;
            usageKind: string;
            limitValue: string;
            overuse: "HARD" | "SOFT";
            userId?: string | undefined;
            teamId?: string | undefined;
            period?: string | undefined;
        };
        output: {
            id: string;
            productId: string;
            productPlanId: string;
            userId: string | null;
            teamId: string | null;
            usageKind: string;
            limitValue: string;
            overuse: "HARD" | "SOFT";
            period: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    updatePlanUsage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            userId?: string | null | undefined;
            teamId?: string | null | undefined;
            usageKind?: string | undefined;
            limitValue?: string | undefined;
            overuse?: "HARD" | "SOFT" | undefined;
            period?: string | null | undefined;
        };
        output: {
            id: string;
            productId: string;
            productPlanId: string;
            userId: string | null;
            teamId: string | null;
            usageKind: string;
            limitValue: string;
            overuse: "HARD" | "SOFT";
            period: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    deletePlanUsage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
}>>;
