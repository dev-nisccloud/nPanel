export declare const clientSubscriptionsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /** List subscriptions with optional filters */
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            userId?: string | undefined;
            teamId?: string | undefined;
            productId?: string | undefined;
            productPlanId?: string | undefined;
            pricingModel?: "FIXED" | "COMMISSION" | undefined;
            status?: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED" | undefined;
            fromDate?: unknown;
            toDate?: unknown;
            limit?: number | undefined;
            offset?: number | undefined;
        } | undefined;
        output: {
            id: string;
            name: string | null;
            userId: string | null;
            teamId: string | null;
            productId: string;
            productPlanId: string | null;
            orderId: string | null;
            subscribedBy: string | null;
            recordedBy: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            subscriptionDate: Date | null;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
            nextRenewalDate: Date | null;
            expiryDate: Date | null;
            autoRenew: boolean;
            pricingModel: "FIXED" | "COMMISSION";
            agreedPrice: string | null;
            agreedCurrency: string | null;
            agreedCommissionRate: unknown;
            agreedCommissionBase: string | null;
            primaryDomain: string | null;
            pleskFilterId: string | null;
            pleskOwnerId: string | null;
            pleskFtpLogin: string | null;
            hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            openProviderId: number | null;
            domainAuthCode: string | null;
            nameserverGroupId: string | null;
            wpInstallationId: number | null;
            serviceRefs: unknown;
            hostingSubscriptionId: string | null;
            notes: string | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: object;
    }>;
    /** List subscriptions for agency UI with product/plan/team/user names. Optional productFilter: "hosting" restricts to products whose name contains "hosting". */
    listForAgency: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            limit?: number | undefined;
            offset?: number | undefined;
            search?: string | undefined;
            productFilter?: "hosting" | undefined;
        } | undefined;
        output: {
            id: string;
            name: string | null;
            userId: string | null;
            teamId: string | null;
            productId: string;
            productPlanId: string | null;
            orderId: string | null;
            subscribedBy: string | null;
            recordedBy: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            subscriptionDate: Date | null;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
            nextRenewalDate: Date | null;
            expiryDate: Date | null;
            autoRenew: boolean;
            pricingModel: "FIXED" | "COMMISSION";
            agreedPrice: string | null;
            agreedCurrency: string | null;
            agreedCommissionRate: unknown;
            agreedCommissionBase: string | null;
            primaryDomain: string | null;
            pleskFilterId: string | null;
            pleskOwnerId: string | null;
            pleskFtpLogin: string | null;
            hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            openProviderId: number | null;
            domainAuthCode: string | null;
            nameserverGroupId: string | null;
            wpInstallationId: number | null;
            serviceRefs: unknown;
            hostingSubscriptionId: string | null;
            notes: string | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
            productName: string;
            productPlanName: string | null;
            subscriptionName: string | null;
            teamName: string | null;
            userName: string | null;
        }[];
        meta: object;
    }>;
    /** List hosting subscriptions for a team (customer view). teamSlug is the route slug; returns only subscriptions for products named "web hosting" or "website hosting" (case-insensitive). Caller must be a member of the team. */
    listForTeamHosting: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamSlug: string;
        };
        output: {
            id: string;
            pleskSubscriptionId: string | null;
            subscriptionName: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            productName: string;
            productPlanName: string | null;
            subscriptionDate: Date | null;
            expiryDate: Date | null;
            primaryDomain: string | null;
        }[];
        meta: object;
    }>;
    /** List email hosting subscriptions for a team (customer view). Same as listForTeamHosting but for products named "email hosting" (case-insensitive). */
    listForTeamEmailHosting: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamSlug: string;
        };
        output: {
            id: string;
            pleskSubscriptionId: string | null;
            subscriptionName: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            productName: string;
            productPlanName: string | null;
            subscriptionDate: Date | null;
            expiryDate: Date | null;
            primaryDomain: string | null;
        }[];
        meta: object;
    }>;
    /**
     * List Nisc Email Marketing subscriptions for a team (customer view). Matches products whose name
     * contains "nisc email marketing" or "email marketing" (case-insensitive), same criteria as
     * products.getNiscEmailMarketingPlansForPricing. Caller must be a member of the team.
     */
    listForTeamNiscEmailMarketing: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamSlug: string;
        };
        output: {
            id: string;
            pleskSubscriptionId: string | null;
            subscriptionName: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            productName: string;
            productPlanName: string | null;
            subscriptionDate: Date | null;
            expiryDate: Date | null;
            primaryDomain: string | null;
        }[];
        meta: object;
    }>;
    /** List Creatives & Design subscriptions for a team (customer view). Same auth as listForTeamNiscEmailMarketing. */
    listForTeamCreativesDesign: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamSlug: string;
        };
        output: {
            id: string;
            pleskSubscriptionId: string | null;
            subscriptionName: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            productName: string;
            productPlanName: string | null;
            subscriptionDate: Date | null;
            expiryDate: Date | null;
            primaryDomain: string | null;
        }[];
        meta: object;
    }>;
    /** List SEO Reports subscriptions for a team (customer view). Same auth as listForTeamNiscEmailMarketing. */
    listForTeamSeoReports: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamSlug: string;
        };
        output: {
            id: string;
            pleskSubscriptionId: string | null;
            subscriptionName: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            productName: string;
            productPlanName: string | null;
            subscriptionDate: Date | null;
            expiryDate: Date | null;
            primaryDomain: string | null;
        }[];
        meta: object;
    }>;
    /** List domain subscriptions for a team (customer view). Returns subscriptions for products whose name contains "domains" (case-insensitive). Caller must be a member of the team. */
    listForTeamDomains: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamSlug: string;
        };
        output: {
            id: string;
            pleskSubscriptionId: string | null;
            subscriptionName: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            productName: string;
            productPlanName: string | null;
            subscriptionDate: Date | null;
            expiryDate: Date | null;
            primaryDomain: string | null;
        }[];
        meta: object;
    }>;
    /** List all NiscClientSubscription for a team (customer dashboard). Same auth as listForTeamDomains; returns all products. */
    listForTeam: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamSlug: string;
        };
        output: {
            id: string;
            productName: string;
            productPlanName: string | null;
            subscriptionName: string | null;
            subscriptionDate: Date | null;
            nextRenewalDate: Date | null;
            expiryDate: Date | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
        }[];
        meta: object;
    }>;
    /** Live domain metrics for a team (OpenProvider + KENIC), scoped to accessible domain subscriptions. */
    getTeamLiveDomainsSummary: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamSlug: string;
        };
        output: {
            total: number;
            active: number;
            expired: number;
        };
        meta: object;
    }>;
    /** Subscription status counts for a team from NiscClientSubscription. */
    getTeamSubscriptionSummary: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamSlug: string;
        };
        output: {
            total: number;
            active: number;
            other: number;
        };
        meta: object;
    }>;
    /** Web hosting subscription counts for a team from NiscClientSubscription. */
    getTeamHostingSummary: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamSlug: string;
        };
        output: {
            total: number;
            active: number;
            other: number;
        };
        meta: object;
    }>;
    /** Get a single subscription by ID */
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
            teamSlug?: string | undefined;
            includeRenewals?: boolean | undefined;
            includeCommissions?: boolean | undefined;
        };
        output: {
            commissionEntries?: {
                id: string;
                subscriptionId: string;
                productPlanId: string;
                teamId: string | null;
                period: string;
                baseAmount: unknown;
                baseAmountDescription: string | null;
                commissionRate: unknown;
                commissionAmount: unknown;
                currency: string;
                status: "DRAFT" | "PAID" | "INVOICED" | "WAIVED";
                invoiceId: string | null;
                notes: string | null;
                createdBy: string;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
            renewals?: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                billingCycle: string | null;
                orderId: string | null;
                subscriptionId: string;
                renewalType: string;
                renewedBy: string | null;
                renewalDate: Date;
                newExpiryDate: Date | null;
                newNextRenewalDate: Date | null;
                renewalPrice: string | null;
                renewalCurrency: string | null;
                providerRenewalPrice: string | null;
                providerRenewalCurrency: string | null;
            }[] | undefined;
            product: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                isActive: boolean;
                metadata: unknown;
                category: string;
                serviceType: string;
                sortOrder: number;
                features: unknown;
                highlights: unknown;
                isAddOn: boolean;
            };
            productPlan: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                isActive: boolean;
                metadata: unknown;
                currency: string | null;
                price: string | null;
                sortOrder: number;
                highlights: unknown;
                productId: string;
                pricingModel: string;
                billingCycle: string | null;
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
            } | null;
            team: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                baseCurrency: string;
                logoUrl: string | null;
                isActive: boolean;
                createdById: string;
            } | null;
            userName: string | null;
            id: string;
            name: string | null;
            userId: string | null;
            teamId: string | null;
            productId: string;
            productPlanId: string | null;
            orderId: string | null;
            subscribedBy: string | null;
            recordedBy: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            subscriptionDate: Date | null;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
            nextRenewalDate: Date | null;
            expiryDate: Date | null;
            autoRenew: boolean;
            pricingModel: "FIXED" | "COMMISSION";
            agreedPrice: string | null;
            agreedCurrency: string | null;
            agreedCommissionRate: unknown;
            agreedCommissionBase: string | null;
            primaryDomain: string | null;
            pleskFilterId: string | null;
            pleskOwnerId: string | null;
            pleskFtpLogin: string | null;
            hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            openProviderId: number | null;
            domainAuthCode: string | null;
            nameserverGroupId: string | null;
            wpInstallationId: number | null;
            serviceRefs: unknown;
            hostingSubscriptionId: string | null;
            notes: string | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** Resolve product ID for "Domains" product (name contains "domain", case-insensitive). Used when creating domain subscriptions from portfolio. */
    getDomainsProductId: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: string | null;
        meta: object;
    }>;
    /** Resolve product ID for domain transfer (serviceType domain_transfer). Used for transfer checkout → createFromPayment. */
    getTransferProductId: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: string;
            name: string;
        } | null;
        meta: object;
    }>;
    /** Get subscription by OpenProvider domain ID (for checking if domain already has a connected subscription). */
    getByOpenProviderId: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            openProviderId: number;
        };
        output: {
            id: string;
            name: string | null;
            userId: string | null;
            teamId: string | null;
            productId: string;
            productPlanId: string | null;
            orderId: string | null;
            subscribedBy: string | null;
            recordedBy: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            subscriptionDate: Date | null;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
            nextRenewalDate: Date | null;
            expiryDate: Date | null;
            autoRenew: boolean;
            pricingModel: "FIXED" | "COMMISSION";
            agreedPrice: string | null;
            agreedCurrency: string | null;
            agreedCommissionRate: unknown;
            agreedCommissionBase: string | null;
            primaryDomain: string | null;
            pleskFilterId: string | null;
            pleskOwnerId: string | null;
            pleskFtpLogin: string | null;
            hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            openProviderId: number | null;
            domainAuthCode: string | null;
            nameserverGroupId: string | null;
            wpInstallationId: number | null;
            serviceRefs: unknown;
            hostingSubscriptionId: string | null;
            notes: string | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        meta: object;
    }>;
    /** Return OpenProvider domain IDs that already have a subscription (for batch check on list). */
    getOpenProviderIdsWithSubscriptions: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            openProviderIds: number[];
        };
        output: number[];
        meta: object;
    }>;
    /** Check if a Plesk subscription id already has a linked NiscClientSubscription (serviceRefs.pleskSubscriptionId). */
    getHasLinkedSubscriptionByPleskId: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            pleskSubscriptionId: string | number;
        };
        output: {
            hasLinked: boolean;
        };
        meta: object;
    }>;
    /** Return Plesk subscription ids that already have a linked NiscClientSubscription (for batch check on hosting list). */
    getPleskSubscriptionIdsWithLinkedSubscription: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            pleskSubscriptionIds: (string | number)[];
        };
        output: string[];
        meta: object;
    }>;
    /** Check if a Hivelocity device id already has a linked NiscClientSubscription (serviceRefs.hivelocityDeviceId). */
    getHasLinkedSubscriptionByHivelocityDeviceId: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            hivelocityDeviceId: string | number;
        };
        output: {
            hasLinked: boolean;
            subscriptionId: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED" | null;
        };
        meta: object;
    }>;
    /** Return Hivelocity device ids that already have a linked NiscClientSubscription (for batch check on list views). */
    getHivelocityDeviceIdsWithLinkedSubscription: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            hivelocityDeviceIds: (string | number)[];
        };
        output: string[];
        meta: object;
    }>;
    /** Get active media buying product and its active plans for subscription creation. */
    getMediaBuyingProductForSubscription: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: string;
            name: string;
            plans: {
                id: string;
                name: string;
                pricingModel: "FIXED" | "COMMISSION";
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
                price: string | null;
                currency: string | null;
                agreedCommissionRate: number | null;
                agreedCommissionBase: string | null;
            }[];
        } | null;
        meta: object;
    }>;
    /** Check whether an ad account already has a linked media buying subscription. */
    getLinkedMediaBuyingSubscriptionByAdAccount: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            platform: "META_ADS" | "GOOGLE_ADS" | "LINKEDIN_ADS" | "INSTAGRAM_ADS";
            accountId: string;
        };
        output: {
            hasLinkedSubscription: boolean;
            subscriptionId: string | null;
            teamId: string | null;
            teamName: string | null;
        };
        meta: object;
    }>;
    /** Create a team-linked media buying subscription for a specific ad account. */
    createMediaBuyingSubscription: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            teamId: string;
            productPlanId: string;
            platform: "META_ADS" | "GOOGLE_ADS" | "LINKEDIN_ADS" | "INSTAGRAM_ADS";
            accountId: string;
            adServingFee: string;
            adServingFeeCurrency: "KES" | "USD" | "EUR";
            accountName?: string | undefined;
        };
        output: {
            id: string;
            name: string | null;
            userId: string | null;
            teamId: string | null;
            productId: string;
            productPlanId: string | null;
            orderId: string | null;
            subscribedBy: string | null;
            recordedBy: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            subscriptionDate: Date | null;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
            nextRenewalDate: Date | null;
            expiryDate: Date | null;
            autoRenew: boolean;
            pricingModel: "FIXED" | "COMMISSION";
            agreedPrice: string | null;
            agreedCurrency: string | null;
            agreedCommissionRate: unknown;
            agreedCommissionBase: string | null;
            primaryDomain: string | null;
            pleskFilterId: string | null;
            pleskOwnerId: string | null;
            pleskFtpLogin: string | null;
            hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            openProviderId: number | null;
            domainAuthCode: string | null;
            nameserverGroupId: string | null;
            wpInstallationId: number | null;
            serviceRefs: unknown;
            hostingSubscriptionId: string | null;
            notes: string | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** Active SEO product + plans (Search Console / GA4 subscriptions share this product; scope is stored in serviceRefs). */
    getSeoProductForSubscription: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: string;
            name: string;
            plans: {
                id: string;
                name: string;
                pricingModel: "FIXED" | "COMMISSION";
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
                price: string | null;
                currency: string | null;
                agreedCommissionRate: number | null;
                agreedCommissionBase: string | null;
            }[];
        } | null;
        meta: object;
    }>;
    /** Whether this Search Console site or GA4 property already has an SEO subscription row. */
    getLinkedSeoSubscriptionByResource: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            scope: "SEARCH_CONSOLE";
            searchConsoleSiteUrl: string;
        } | {
            scope: "GA4";
            ga4PropertyId: string;
        };
        output: {
            hasLinkedSubscription: boolean;
            subscriptionId: string | null;
            teamId: string | null;
            teamName: string | null;
        };
        meta: object;
    }>;
    /** Create a team SEO subscription for Search Console (site URL) or GA4 (property id) - one subscription per tab integration. */
    createSeoSubscription: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            scope: "SEARCH_CONSOLE";
            teamId: string;
            productPlanId: string;
            searchConsoleSiteUrl: string;
            managementFee: string;
            managementFeeCurrency: "KES" | "USD" | "EUR";
        } | {
            scope: "GA4";
            teamId: string;
            productPlanId: string;
            ga4PropertyId: string;
            managementFee: string;
            managementFeeCurrency: "KES" | "USD" | "EUR";
            ga4DisplayName?: string | undefined;
        };
        output: {
            id: string;
            name: string | null;
            userId: string | null;
            teamId: string | null;
            productId: string;
            productPlanId: string | null;
            orderId: string | null;
            subscribedBy: string | null;
            recordedBy: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            subscriptionDate: Date | null;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
            nextRenewalDate: Date | null;
            expiryDate: Date | null;
            autoRenew: boolean;
            pricingModel: "FIXED" | "COMMISSION";
            agreedPrice: string | null;
            agreedCurrency: string | null;
            agreedCommissionRate: unknown;
            agreedCommissionBase: string | null;
            primaryDomain: string | null;
            pleskFilterId: string | null;
            pleskOwnerId: string | null;
            pleskFtpLogin: string | null;
            hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            openProviderId: number | null;
            domainAuthCode: string | null;
            nameserverGroupId: string | null;
            wpInstallationId: number | null;
            serviceRefs: unknown;
            hostingSubscriptionId: string | null;
            notes: string | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** Return ad account IDs linked to media buying subscriptions for a team/platform. */
    listLinkedAdAccountsForTeam: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamSlug: string;
            platform: "META_ADS" | "GOOGLE_ADS" | "LINKEDIN_ADS" | "INSTAGRAM_ADS";
        };
        output: string[];
        meta: object;
    }>;
    /** Return linked ad accounts (id + name) from media buying subscriptions for a team/platform. */
    listLinkedAdAccountsForTeamDetailed: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamSlug: string;
            platform: "META_ADS" | "GOOGLE_ADS" | "LINKEDIN_ADS" | "INSTAGRAM_ADS";
        };
        output: {
            accountId: string;
            accountName: string | null;
        }[];
        meta: object;
    }>;
    /** Create a new subscription */
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            productId: string;
            pricingModel: "FIXED" | "COMMISSION";
            name?: string | undefined;
            userId?: string | undefined;
            teamId?: string | undefined;
            productPlanId?: string | undefined;
            orderId?: string | undefined;
            subscribedBy?: string | undefined;
            recordedBy?: string | undefined;
            status?: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED" | undefined;
            subscriptionDate?: unknown;
            billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
            nextRenewalDate?: unknown;
            expiryDate?: unknown;
            autoRenew?: boolean | undefined;
            agreedPrice?: string | undefined;
            agreedCurrency?: string | undefined;
            agreedCost?: string | undefined;
            agreedCostCurrency?: string | undefined;
            providerCost?: string | undefined;
            providerCostCurrency?: string | undefined;
            agreedCommissionRate?: number | undefined;
            agreedCommissionBase?: string | undefined;
            primaryDomain?: string | undefined;
            pleskFilterId?: string | undefined;
            pleskOwnerId?: string | undefined;
            pleskFtpLogin?: string | undefined;
            pleskFtpPassword?: string | undefined;
            hostingType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | undefined;
            openProviderId?: number | undefined;
            domainAuthCode?: string | undefined;
            nameserverGroupId?: string | undefined;
            wpInstallationId?: number | undefined;
            serviceRefs?: Record<string, string | string[]> | undefined;
            hostingSubscriptionId?: string | undefined;
            notes?: string | undefined;
            metadata?: Record<string, unknown> | undefined;
        };
        output: {
            id: string;
            name: string | null;
            userId: string | null;
            teamId: string | null;
            productId: string;
            productPlanId: string | null;
            orderId: string | null;
            subscribedBy: string | null;
            recordedBy: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            subscriptionDate: Date | null;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
            nextRenewalDate: Date | null;
            expiryDate: Date | null;
            autoRenew: boolean;
            pricingModel: "FIXED" | "COMMISSION";
            agreedPrice: string | null;
            agreedCurrency: string | null;
            agreedCommissionRate: unknown;
            agreedCommissionBase: string | null;
            primaryDomain: string | null;
            pleskFilterId: string | null;
            pleskOwnerId: string | null;
            pleskFtpLogin: string | null;
            hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            openProviderId: number | null;
            domainAuthCode: string | null;
            nameserverGroupId: string | null;
            wpInstallationId: number | null;
            serviceRefs: unknown;
            hostingSubscriptionId: string | null;
            notes: string | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** Update a subscription */
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            name?: string | null | undefined;
            userId?: string | null | undefined;
            teamId?: string | null | undefined;
            productPlanId?: string | null | undefined;
            status?: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED" | undefined;
            subscriptionDate?: unknown;
            billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
            nextRenewalDate?: unknown;
            expiryDate?: unknown;
            autoRenew?: boolean | undefined;
            agreedPrice?: string | null | undefined;
            agreedCurrency?: string | undefined;
            agreedCommissionRate?: number | null | undefined;
            agreedCommissionBase?: string | null | undefined;
            primaryDomain?: string | null | undefined;
            pleskFilterId?: string | undefined;
            pleskOwnerId?: string | undefined;
            pleskFtpLogin?: string | undefined;
            pleskFtpPassword?: string | undefined;
            hostingType?: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null | undefined;
            openProviderId?: number | undefined;
            domainAuthCode?: string | undefined;
            nameserverGroupId?: string | undefined;
            wpInstallationId?: number | undefined;
            serviceRefs?: Record<string, string | string[]> | undefined;
            notes?: string | null | undefined;
            metadata?: Record<string, unknown> | undefined;
        };
        output: {
            id: string;
            name: string | null;
            userId: string | null;
            teamId: string | null;
            productId: string;
            productPlanId: string | null;
            orderId: string | null;
            subscribedBy: string | null;
            recordedBy: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            subscriptionDate: Date | null;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
            nextRenewalDate: Date | null;
            expiryDate: Date | null;
            autoRenew: boolean;
            pricingModel: "FIXED" | "COMMISSION";
            agreedPrice: string | null;
            agreedCurrency: string | null;
            agreedCommissionRate: unknown;
            agreedCommissionBase: string | null;
            primaryDomain: string | null;
            pleskFilterId: string | null;
            pleskOwnerId: string | null;
            pleskFtpLogin: string | null;
            hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            openProviderId: number | null;
            domainAuthCode: string | null;
            nameserverGroupId: string | null;
            wpInstallationId: number | null;
            serviceRefs: unknown;
            hostingSubscriptionId: string | null;
            notes: string | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** Cancel a subscription */
    cancel: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            reason?: string | undefined;
        };
        output: {
            id: string;
            name: string | null;
            userId: string | null;
            teamId: string | null;
            productId: string;
            productPlanId: string | null;
            orderId: string | null;
            subscribedBy: string | null;
            recordedBy: string | null;
            status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
            subscriptionDate: Date | null;
            billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
            nextRenewalDate: Date | null;
            expiryDate: Date | null;
            autoRenew: boolean;
            pricingModel: "FIXED" | "COMMISSION";
            agreedPrice: string | null;
            agreedCurrency: string | null;
            agreedCommissionRate: unknown;
            agreedCommissionBase: string | null;
            primaryDomain: string | null;
            pleskFilterId: string | null;
            pleskOwnerId: string | null;
            pleskFtpLogin: string | null;
            hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
            openProviderId: number | null;
            domainAuthCode: string | null;
            nameserverGroupId: string | null;
            wpInstallationId: number | null;
            serviceRefs: unknown;
            hostingSubscriptionId: string | null;
            notes: string | null;
            metadata: unknown;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** Permanently delete a subscription (agency super admin only). */
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: true;
        };
        meta: object;
    }>;
    /** Send a service renewal reminder email. Grace period: 7 days before suspension for most services; for domains, suspension is immediate. */
    sendRenewalEmail: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            subscriptionId: string;
            to: string;
            ccOrBcc?: {
                type: "cc" | "bcc";
                email: string;
            } | undefined;
        };
        output: {
            sent: boolean;
        };
        meta: object;
    }>;
    /** Record a renewal for a subscription */
    renew: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            subscriptionId: string;
            renewalType: "DOMAIN" | "HOSTING" | "FIXED_BILLING";
            renewalDate: unknown;
            renewedBy?: string | undefined;
            newExpiryDate?: unknown;
            newNextRenewalDate?: unknown;
            billingCycle?: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | undefined;
            status?: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED" | undefined;
            renewalPrice?: string | undefined;
            renewalCurrency?: string | undefined;
            externalRenewalId?: string | undefined;
            orderId?: string | undefined;
            invoiceId?: string | undefined;
            notes?: string | undefined;
        };
        output: {
            renewalId: string;
            subscription: {
                id: string;
                name: string | null;
                userId: string | null;
                teamId: string | null;
                productId: string;
                productPlanId: string | null;
                orderId: string | null;
                subscribedBy: string | null;
                recordedBy: string | null;
                status: "ACTIVE" | "PENDING" | "PROCESSING" | "FAILED" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
                subscriptionDate: Date | null;
                billingCycle: "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM" | null;
                nextRenewalDate: Date | null;
                expiryDate: Date | null;
                autoRenew: boolean;
                pricingModel: "FIXED" | "COMMISSION";
                agreedPrice: string | null;
                agreedCurrency: string | null;
                agreedCommissionRate: unknown;
                agreedCommissionBase: string | null;
                primaryDomain: string | null;
                pleskFilterId: string | null;
                pleskOwnerId: string | null;
                pleskFtpLogin: string | null;
                hostingType: "WEB_HOSTING" | "EMAIL_HOSTING" | "RESELLER_HOSTING" | "VPS_HOSTING" | "DEDICATED_HOSTING" | null;
                openProviderId: number | null;
                domainAuthCode: string | null;
                nameserverGroupId: string | null;
                wpInstallationId: number | null;
                serviceRefs: unknown;
                hostingSubscriptionId: string | null;
                notes: string | null;
                metadata: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
        };
        meta: object;
    }>;
    /** Record a new commission entry for a COMMISSION subscription */
    recordCommission: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            subscriptionId: string;
            period: string;
            baseAmount: number;
            baseAmountDescription?: string | undefined;
            currency?: string | undefined;
            notes?: string | undefined;
        };
        output: {
            id: string;
            subscriptionId: string;
            productPlanId: string;
            teamId: string | null;
            period: string;
            baseAmount: unknown;
            baseAmountDescription: string | null;
            commissionRate: unknown;
            commissionAmount: unknown;
            currency: string;
            status: "DRAFT" | "PAID" | "INVOICED" | "WAIVED";
            invoiceId: string | null;
            notes: string | null;
            createdBy: string;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** List commission entries with optional filters */
    getCommissionEntries: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            subscriptionId?: string | undefined;
            teamId?: string | undefined;
            status?: "DRAFT" | "PAID" | "INVOICED" | "WAIVED" | undefined;
            periodFrom?: string | undefined;
            periodTo?: string | undefined;
        } | undefined;
        output: {
            id: string;
            subscriptionId: string;
            productPlanId: string;
            teamId: string | null;
            period: string;
            baseAmount: unknown;
            baseAmountDescription: string | null;
            commissionRate: unknown;
            commissionAmount: unknown;
            currency: string;
            status: "DRAFT" | "PAID" | "INVOICED" | "WAIVED";
            invoiceId: string | null;
            notes: string | null;
            createdBy: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: object;
    }>;
    /** Update a commission entry status (DRAFT → INVOICED → PAID / WAIVED) */
    updateCommissionEntry: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            status: "DRAFT" | "PAID" | "INVOICED" | "WAIVED";
            invoiceId?: string | undefined;
            notes?: string | undefined;
        };
        output: {
            id: string;
            subscriptionId: string;
            productPlanId: string;
            teamId: string | null;
            period: string;
            baseAmount: unknown;
            baseAmountDescription: string | null;
            commissionRate: unknown;
            commissionAmount: unknown;
            currency: string;
            status: "DRAFT" | "PAID" | "INVOICED" | "WAIVED";
            invoiceId: string | null;
            notes: string | null;
            createdBy: string;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /** List domain subscriptions for a user/team (product.serviceType === "domain_registration"). Used for domain dropdown in Nisc orders. */
    getDomainSubscriptions: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            userId?: string | undefined;
            teamId?: string | undefined;
        };
        output: {
            id: string;
            name: string | null;
            primaryDomain: string | null;
        }[];
        meta: object;
    }>;
}>>;
