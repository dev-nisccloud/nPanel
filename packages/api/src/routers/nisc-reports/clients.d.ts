export declare const niscClientsRouter: import("@trpc/server").TRPCBuiltRouter<{
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
            specificTeamId?: string | undefined;
        };
        output: {
            teamId: string;
            teamName: string;
            totalInvoiced: number;
            totalPaid: number;
            outstanding: number;
            activeSubs: number;
            mrr: number;
            totalOrders: number;
            pipelineValue: number;
            lastActivity: Date | null;
        }[];
        meta: object;
    }>;
    cohortRetention: import("@trpc/server").TRPCQueryProcedure<{
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
            cohortMonth: string;
            startCount: number;
            at1Month: number;
            at3Months: number;
            at6Months: number;
            at12Months: number;
        }[];
        meta: object;
    }>;
    newVsReturning: import("@trpc/server").TRPCQueryProcedure<{
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
            newClients: number;
            returningClients: number;
            newClientsRevenue: number;
            returningClientsRevenue: number;
            periodLabel: string;
        };
        meta: object;
    }>;
}>>;
