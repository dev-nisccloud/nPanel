export declare const niscTaxRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    summary: import("@trpc/server").TRPCQueryProcedure<{
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
            taxableAmount: number;
            vatCollected: number;
            taxCollected: number;
            pendingTaxAmount: number;
            pendingVatAmount: number;
            byTaxRate: {
                taxPercentage: number;
                count: number;
                taxableAmount: number;
                taxAmount: number;
            }[];
            currency: string;
        };
        meta: object;
    }>;
}>>;
