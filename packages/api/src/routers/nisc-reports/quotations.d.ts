export declare const niscQuotationsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    pipeline: import("@trpc/server").TRPCQueryProcedure<{
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
            inPreparation: number;
            activePipeline: number;
            wonValue: number;
            lostValue: number;
            expiredValue: number;
            winRate: number;
            avgQuoteValue: number;
            avgTimeToDecision: number;
            avgTimeToSend: number;
            byStatus: {
                status: string;
                count: number;
                amount: number;
            }[];
        };
        meta: object;
    }>;
    conversionFunnel: import("@trpc/server").TRPCQueryProcedure<{
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
            stage: string;
            count: number;
            amount: number;
            dropOffPct: number;
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
                quotationNumber: string | null;
                customerName: string | null;
                customerEmail: string | null;
                amount: number;
                currency: string;
                status: string;
                issueDate: Date | null;
                createdBy: string;
                createdAt: Date;
            }[];
            total: number;
        };
        meta: object;
    }>;
}>>;
