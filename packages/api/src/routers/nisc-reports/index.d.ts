export declare const niscReportsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    revenue: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        overview: import("@trpc/server").TRPCQueryProcedure<{
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
                totalInvoiced: number;
                byStatus: {
                    status: string;
                    count: number;
                    amount: number;
                }[];
                collected: number;
                billedUnpaid: number;
                inDraft: number;
                netCollected: number;
                outstanding: number;
                taxCollected: number;
                avgInvoiceValue: number;
                paymentRate: number;
                currency: string;
            };
            meta: object;
        }>;
        trend: import("@trpc/server").TRPCQueryProcedure<{
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
                period: string;
                invoiced: number;
                collected: number;
                overdue: number;
                draft: number;
                creditNotes: number;
                invoiceCount: number;
            }[];
            meta: object;
        }>;
        byClient: import("@trpc/server").TRPCQueryProcedure<{
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
                teamId: string;
                teamName: string;
                totalInvoiced: number;
                totalCollected: number;
                outstanding: number;
                overdueAmount: number;
                invoiceCount: number;
                lastInvoiceDate: Date | null;
                avgDaysToPay: number;
                currency: string;
            }[];
            meta: object;
        }>;
        byCategory: import("@trpc/server").TRPCQueryProcedure<{
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
                category: string;
                totalInvoiced: number;
                totalCollected: number;
                inDraft: number;
                invoiceCount: number;
            }[];
            meta: object;
        }>;
        aging: import("@trpc/server").TRPCQueryProcedure<{
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
                current: {
                    count: number;
                    amount: number;
                };
                days1_30: {
                    count: number;
                    amount: number;
                };
                days31_60: {
                    count: number;
                    amount: number;
                };
                days61_90: {
                    count: number;
                    amount: number;
                };
                days91_120: {
                    count: number;
                    amount: number;
                };
                days120plus: {
                    count: number;
                    amount: number;
                };
                total: {
                    count: number;
                    amount: number;
                };
            };
            meta: object;
        }>;
        outstandingList: import("@trpc/server").TRPCQueryProcedure<{
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
                    issueDate: Date | null;
                    dueDate: Date | null;
                    amount: number;
                    currency: string;
                    status: string;
                    daysOverdue: number;
                }[];
                total: number;
            };
            meta: object;
        }>;
    }>>;
    invoices: import("@trpc/server").TRPCBuiltRouter<{
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
    quotations: import("@trpc/server").TRPCBuiltRouter<{
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
    subscriptions: import("@trpc/server").TRPCBuiltRouter<{
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
    clients: import("@trpc/server").TRPCBuiltRouter<{
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
    profitability: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        grossMargin: import("@trpc/server").TRPCQueryProcedure<{
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
                    category: string | null;
                    billingCycle: string | null;
                    revenue: number;
                    cost: number;
                    grossMargin: number;
                    marginPct: number;
                }[];
                totalRevenue: number;
                totalCost: number;
                avgMarginPct: number;
            };
            meta: object;
        }>;
        commission: import("@trpc/server").TRPCQueryProcedure<{
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
                    period: string | null;
                    baseAmount: number;
                    commissionRate: number;
                    commissionAmount: number;
                    status: string;
                    invoiceId: string | null;
                }[];
                totalEarned: number;
                totalBilled: number;
                totalPaid: number;
                totalPending: number;
            };
            meta: object;
        }>;
    }>>;
    payments: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        methodBreakdown: import("@trpc/server").TRPCQueryProcedure<{
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
                method: string;
                count: number;
                amount: number;
                percentOfTotal: number;
            }[];
            meta: object;
        }>;
        gatewayPerf: import("@trpc/server").TRPCQueryProcedure<{
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
                gateway: string;
                totalInitiated: number;
                totalCompleted: number;
                totalFailed: number;
                totalRefunded: number;
                successRate: number;
                avgProcessingMinutes: number;
            }[];
            meta: object;
        }>;
        failedPending: import("@trpc/server").TRPCQueryProcedure<{
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
                    gateway: string;
                    amount: number;
                    currency: string;
                    status: string;
                    initiatedAt: Date;
                    phoneNumber: string | null;
                    flagged: boolean;
                }[];
                total: number;
            };
            meta: object;
        }>;
        refunds: import("@trpc/server").TRPCQueryProcedure<{
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
                    amount: number;
                    currency: string;
                    gateway: string;
                    refundedAt: Date | null;
                    receiptNumber: string | null;
                }[];
                totalRefunded: number;
            };
            meta: object;
        }>;
    }>>;
    tax: import("@trpc/server").TRPCBuiltRouter<{
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
}>>;
