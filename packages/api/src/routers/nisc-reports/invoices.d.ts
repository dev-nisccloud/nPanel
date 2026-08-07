export declare const niscInvoicesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
            amount: number;
            currency: string;
        }[];
        meta: object;
    }>;
    statusSummaryWithKra: import("@trpc/server").TRPCQueryProcedure<{
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
            total: number;
            paid: number;
            unpaid: number;
            overdue: number;
            kraSynced: number;
            kraNotSynced: number;
            kraInFlight: number;
            kraFailed: number;
        };
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
                invoiceNumber: string | null;
                teamName: string | null;
                amount: number;
                currency: string;
                status: string;
                issueDate: Date | null;
                dueDate: Date | null;
                paidAt: Date | null;
                sentAt: Date | null;
                createdBy: string;
                kraStatus: string | null;
                createdAt: Date;
            }[];
            total: number;
        };
        meta: object;
    }>;
    cycleTime: import("@trpc/server").TRPCQueryProcedure<{
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
            avgTimeInDraftDays: number;
            avgTimeToPay: number;
            paidOnTimePercent: number;
            currentlyInDraftCount: number;
            currentlyInDraftAmount: number;
        };
        meta: object;
    }>;
    creditNotes: import("@trpc/server").TRPCQueryProcedure<{
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
                creditNumber: string | null;
                invoiceId: string;
                teamName: string | null;
                amount: number;
                currency: string;
                reason: string | null;
                status: string;
                issuedAt: Date | null;
                appliedAt: Date | null;
            }[];
            totalIssued: number;
            totalApplied: number;
            totalPending: number;
        };
        meta: object;
    }>;
    kraCompliance: import("@trpc/server").TRPCQueryProcedure<{
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
                invoiceNumber: string | null;
                teamName: string | null;
                amount: number;
                currency: string;
                kraStatus: string | null;
                kraInvoiceNumber: string | null;
                kraReceiptNumber: string | null;
                kraError: string | null;
                kraVerifiedDate: Date | null;
                issueDate: Date | null;
            }[];
            buckets: {
                VERIFIED: number;
                PENDING: number;
                FAILED: number;
                NOT_SUBMITTED: number;
            };
        };
        meta: object;
    }>;
}>>;
