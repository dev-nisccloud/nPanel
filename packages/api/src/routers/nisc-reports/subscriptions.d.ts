export declare const niscSubscriptionsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    mrrDashboard: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from: unknown;
            to: unknown;
            granularity?: "MONTHLY" | "YEARLY" | "DAILY" | "WEEKLY" | "QUARTERLY" | undefined;
            teamIds?: string[] | undefined;
            productIds?: string[] | undefined;
            productCategories?: ("AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING")[] | undefined;
            serviceTypes?: string[] | undefined;
            billingCycles?: ("MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM")[] | undefined;
            currency?: string | undefined;
            invoiceStatuses?: string[] | undefined;
            subscriptionStatuses?: string[] | undefined;
            orderStatuses?: string[] | undefined;
            quotationStatuses?: string[] | undefined;
            page?: number | undefined;
            pageSize?: number | undefined;
            sortBy?: string | undefined;
            sortDir?: "ASC" | "DESC" | undefined;
        };
        output: {
            mrr: number;
            arr: number;
            currency: string;
            byCategory: {
                category: string;
                mrr: number;
                count: number;
            }[];
            byClient: {
                teamId: string;
                teamName: string;
                mrr: number;
                count: number;
            }[];
            totalActive: number;
        };
        meta: object;
    }>;
    mrrMovement: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from: unknown;
            to: unknown;
            granularity?: "MONTHLY" | "YEARLY" | "DAILY" | "WEEKLY" | "QUARTERLY" | undefined;
            teamIds?: string[] | undefined;
            productIds?: string[] | undefined;
            productCategories?: ("AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING")[] | undefined;
            serviceTypes?: string[] | undefined;
            billingCycles?: ("MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM")[] | undefined;
            currency?: string | undefined;
            invoiceStatuses?: string[] | undefined;
            subscriptionStatuses?: string[] | undefined;
            orderStatuses?: string[] | undefined;
            quotationStatuses?: string[] | undefined;
            page?: number | undefined;
            pageSize?: number | undefined;
            sortBy?: string | undefined;
            sortDir?: "ASC" | "DESC" | undefined;
        };
        output: {
            newMrr: number;
            expansionMrr: number;
            contractionMrr: number;
            churnedMrr: number;
            netChange: number;
            periodLabel: string;
        };
        meta: object;
    }>;
    statusSummary: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from: unknown;
            to: unknown;
            granularity?: "MONTHLY" | "YEARLY" | "DAILY" | "WEEKLY" | "QUARTERLY" | undefined;
            teamIds?: string[] | undefined;
            productIds?: string[] | undefined;
            productCategories?: ("AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING")[] | undefined;
            serviceTypes?: string[] | undefined;
            billingCycles?: ("MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM")[] | undefined;
            currency?: string | undefined;
            invoiceStatuses?: string[] | undefined;
            subscriptionStatuses?: string[] | undefined;
            orderStatuses?: string[] | undefined;
            quotationStatuses?: string[] | undefined;
            page?: number | undefined;
            pageSize?: number | undefined;
            sortBy?: string | undefined;
            sortDir?: "ASC" | "DESC" | undefined;
        };
        output: {
            status: string;
            count: number;
            mrr: number;
        }[];
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from: unknown;
            to: unknown;
            granularity?: "MONTHLY" | "YEARLY" | "DAILY" | "WEEKLY" | "QUARTERLY" | undefined;
            teamIds?: string[] | undefined;
            productIds?: string[] | undefined;
            productCategories?: ("AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING")[] | undefined;
            serviceTypes?: string[] | undefined;
            billingCycles?: ("MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM")[] | undefined;
            currency?: string | undefined;
            invoiceStatuses?: string[] | undefined;
            subscriptionStatuses?: string[] | undefined;
            orderStatuses?: string[] | undefined;
            quotationStatuses?: string[] | undefined;
            page?: number | undefined;
            pageSize?: number | undefined;
            sortBy?: string | undefined;
            sortDir?: "ASC" | "DESC" | undefined;
        };
        output: {
            rows: {
                id: string;
                teamName: string | null;
                productName: string | null;
                pricingModel: string;
                agreedPrice: number;
                billingCycle: string | null;
                status: string;
                subscriptionDate: Date | null;
                nextRenewalDate: Date | null;
                expiryDate: Date | null;
                mrr: number;
            }[];
            total: number;
        };
        meta: object;
    }>;
    renewalForecast: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from: unknown;
            to: unknown;
            granularity?: "MONTHLY" | "YEARLY" | "DAILY" | "WEEKLY" | "QUARTERLY" | undefined;
            teamIds?: string[] | undefined;
            productIds?: string[] | undefined;
            productCategories?: ("AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING")[] | undefined;
            serviceTypes?: string[] | undefined;
            billingCycles?: ("MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM")[] | undefined;
            currency?: string | undefined;
            invoiceStatuses?: string[] | undefined;
            subscriptionStatuses?: string[] | undefined;
            orderStatuses?: string[] | undefined;
            quotationStatuses?: string[] | undefined;
            page?: number | undefined;
            pageSize?: number | undefined;
            sortBy?: string | undefined;
            sortDir?: "ASC" | "DESC" | undefined;
            withinDays?: number | undefined;
        };
        output: {
            id: string;
            teamName: string | null;
            productName: string | null;
            renewalDate: Date | null;
            expectedPrice: number;
            billingCycle: string | null;
            autoRenew: boolean;
            status: string;
            daysUntilRenewal: number;
        }[];
        meta: object;
    }>;
    churn: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from: unknown;
            to: unknown;
            granularity?: "MONTHLY" | "YEARLY" | "DAILY" | "WEEKLY" | "QUARTERLY" | undefined;
            teamIds?: string[] | undefined;
            productIds?: string[] | undefined;
            productCategories?: ("AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING")[] | undefined;
            serviceTypes?: string[] | undefined;
            billingCycles?: ("MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM")[] | undefined;
            currency?: string | undefined;
            invoiceStatuses?: string[] | undefined;
            subscriptionStatuses?: string[] | undefined;
            orderStatuses?: string[] | undefined;
            quotationStatuses?: string[] | undefined;
            page?: number | undefined;
            pageSize?: number | undefined;
            sortBy?: string | undefined;
            sortDir?: "ASC" | "DESC" | undefined;
        };
        output: {
            rows: {
                id: string;
                teamName: string | null;
                productName: string | null;
                agreedPrice: number;
                billingCycle: string | null;
                subscriptionDate: Date | null;
                churnDate: Date;
                mrrLost: number;
                tenureDays: number;
            }[];
            totalChurnedMrr: number;
            churnRate: number;
        };
        meta: object;
    }>;
    upgrades: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from: unknown;
            to: unknown;
            granularity?: "MONTHLY" | "YEARLY" | "DAILY" | "WEEKLY" | "QUARTERLY" | undefined;
            teamIds?: string[] | undefined;
            productIds?: string[] | undefined;
            productCategories?: ("AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING")[] | undefined;
            serviceTypes?: string[] | undefined;
            billingCycles?: ("MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM")[] | undefined;
            currency?: string | undefined;
            invoiceStatuses?: string[] | undefined;
            subscriptionStatuses?: string[] | undefined;
            orderStatuses?: string[] | undefined;
            quotationStatuses?: string[] | undefined;
            page?: number | undefined;
            pageSize?: number | undefined;
            sortBy?: string | undefined;
            sortDir?: "ASC" | "DESC" | undefined;
        };
        output: {
            id: string;
            teamName: string | null;
            productName: string | null;
            changeType: string;
            priceDelta: number;
            eventDate: Date;
        }[];
        meta: object;
    }>;
}>>;
