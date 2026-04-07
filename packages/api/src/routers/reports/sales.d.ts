export declare const salesReportsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getSalesReportOverview: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from?: unknown;
            to?: unknown;
            monthsTrend?: number | undefined;
            topTeamsLimit?: number | undefined;
        };
        output: {
            executive: {
                mrr: number;
                mrrPreviousMonth: number;
                mrrChangePercent: number;
                mrrChangeAmount: number;
                currency: string;
            };
            mrrByCategory: {
                category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                label: string;
                mrr: number;
                subscriptionCount: number;
            }[];
            mrrMovement: {
                newMrr: number;
                lostMrr: number;
                existingMrr: number;
                netChange: number;
                currency: string;
            };
            revenueTrend: {
                month: string;
                year: number;
                paidRevenue: number;
                invoicedAmount: number;
                invoiceCount: number;
                paidInvoiceCount: number;
            }[];
            customer: {
                arpc: number;
                customerCount: number;
                currency: string;
            };
            revenueByTeam: {
                teamId: string;
                teamName: string;
                amount: number;
                currency: string;
                percentOfTotal?: number | undefined;
            }[];
            commission: {
                commissionSubscriptionCount: number;
                estimatedFeesAmount: number;
                currency: string;
                hasBaseData: boolean;
            };
            activeSubscriptions: {
                webHosting: number;
                emailHosting: number;
                byCategory: Record<"AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING", number>;
                totalActive: number;
            };
            domainRenewalRate: {
                renewedCount: number;
                dueCount: number;
                ratePercent: number;
                periodLabel: string;
            };
            invoicing: {
                invoicedThisMonth: number;
                paidThisMonth: number;
                overdueCount: number;
                outstandingAmount: number;
                currency: string;
            };
            revenueByProduct: {
                productId: string;
                productName: string;
                category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                mrr: number;
                subscriptionCount: number;
            }[];
            revenueByPlan: {
                planId: string;
                planName: string;
                productName: string;
                mrr: number;
                subscriptionCount: number;
            }[];
            billingMix: {
                billingCycle: string;
                mrr: number;
                subscriptionCount: number;
                percentOfMrr: number;
            }[];
            averageDealSize: {
                mean: number;
                median: number;
                currency: string;
            };
            revenueConcentration: {
                top5Percent: number;
                top10Percent: number;
                top5Amount: number;
                top10Amount: number;
                totalAmount: number;
            };
            churnRate: {
                churnedCount: number;
                activeAtStartCount: number;
                ratePercent: number;
                lostMrr: number;
                periodLabel: string;
            };
            subscriptionTenure: {
                label: string;
                monthsMin: number;
                monthsMax: number | null;
                subscriptionCount: number;
            }[];
            upgradesDowngrades: {
                upgradesCount: number;
                downgradesCount: number;
                upgradesMrrImpact: number;
                downgradesMrrImpact: number;
                periodLabel: string;
            };
            autoRenewRate: {
                withAutoRenew: number;
                withoutAutoRenew: number;
                ratePercent: number;
                totalActive: number;
            };
            renewalsDue: {
                days30: {
                    count: number;
                    mrr: number;
                };
                days60: {
                    count: number;
                    mrr: number;
                };
                days90: {
                    count: number;
                    mrr: number;
                };
                currency: string;
            };
            expiringSoon: {
                count: number;
                mrr: number;
                withinDays: number;
                currency: string;
            };
            paymentVelocity: {
                avgDaysToPay: number;
                medianDaysToPay: number;
                invoiceCount: number;
            };
            overdueAging: {
                bucket0_30: {
                    count: number;
                    amount: number;
                };
                bucket31_60: {
                    count: number;
                    amount: number;
                };
                bucket61_90: {
                    count: number;
                    amount: number;
                };
                bucket90Plus: {
                    count: number;
                    amount: number;
                };
                totalCount: number;
                totalAmount: number;
                currency: string;
            };
            invoiceStatusMix: {
                DRAFT: number;
                SENT: number;
                PARTIALLY_PAID: number;
                PAID: number;
                OVERDUE: number;
                CANCELLED: number;
                WRITTEN_OFF: number;
                totalCount: number;
            };
            taxAndCredits: {
                taxCollectedThisMonth: number;
                taxCollectedPeriod: number;
                discountsThisMonth: number;
                creditNotesIssuedPeriod: number;
                currency: string;
            };
            revenueByPaymentMethod: {
                method: string;
                amount: number;
                count: number;
                percentOfTotal: number;
            }[];
            newCustomers: {
                thisMonth: number;
                previousMonth: number;
                periodLabel: string;
            };
            newSubscriptionsByProduct: {
                productId: string;
                productName: string;
                category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                count: number;
            }[];
            orderPipeline: {
                PENDING: {
                    count: number;
                    value: number;
                };
                PROCESSING: {
                    count: number;
                    value: number;
                };
                COMPLETED: {
                    count: number;
                    value: number;
                };
                FAILED: {
                    count: number;
                    value: number;
                };
                PARTIAL: {
                    count: number;
                    value: number;
                };
                totalValue: number;
                conversionPercent: number;
                currency: string;
            };
            promoEffectiveness: {
                redemptionsThisPeriod: number;
                ordersWithPromo: number;
                revenueWithPromo: number;
                revenueWithoutPromo: number;
                topPromos: {
                    promoCode: string;
                    redemptions: number;
                }[];
                currency: string;
            };
            marginByCategory: {
                category: "AI" | "CUSTOM" | "CLOUD" | "MARKETING" | "CONSULTING";
                revenue: number;
                cost: number;
                marginPercent: number;
                subscriptionCount: number;
            }[];
            multiProductCustomers: {
                multiProductCount: number;
                singleProductCount: number;
                totalWithSubs: number;
                multiProductPercent: number;
            };
            topCustomersTrend: {
                teamId: string;
                teamName: string;
                mrrCurrent: number;
                mrrPrevious: number;
                changePercent: number;
                changeAmount: number;
            }[];
            atRiskCustomers: {
                count: number;
                daysWithoutPayment: number;
                description: string;
            };
            timeComparison: {
                mrrMonthOverMonthPercent: number;
                paidRevenueMonthOverMonthPercent: number;
                paidRevenueYearOverYearPercent: number | null;
                annualRunRate: number;
                currency: string;
            };
        };
        meta: object;
    }>;
    getRevenueTrends: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from?: unknown;
            to?: unknown;
            limit?: number | undefined;
        };
        output: {
            id: string;
            period: string;
            date: Date;
            totalRevenue: number;
            totalInvoiced: number;
            totalPaid: number;
            taxableAmount: number;
            taxAmount: number;
            pendingAmount: number;
            invoiceCount: number;
            paidInvoiceCount: number;
            currency: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: object;
    }>;
    getRevenueByService: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from?: unknown;
            to?: unknown;
            limit?: number | undefined;
        };
        output: {
            id: string;
            period: string;
            date: Date;
            serviceType: string;
            amount: number;
            currency: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: object;
    }>;
    getRevenueByCompany: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            from?: unknown;
            to?: unknown;
            limit?: number | undefined;
        };
        output: {
            id: string;
            period: string;
            date: Date;
            teamId: string;
            teamName: string;
            amount: number;
            currency: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: object;
    }>;
    sync: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            period?: "MONTHLY" | "DAILY" | undefined;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
}>>;
