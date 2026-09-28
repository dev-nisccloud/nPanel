import { z } from "zod";

const categorySchema = z.enum(["CLOUD", "MARKETING", "CONSULTING", "CUSTOM", "AI"]);

export const salesReportOverviewInputSchema = z.object({
	from: z.coerce.date().optional(),
	to: z.coerce.date().optional(),
	monthsTrend: z.number().min(1).max(24).optional().default(12),
	topTeamsLimit: z.number().min(1).max(50).optional().default(10),
});

export const executiveSummarySchema = z.object({
	mrr: z.number(),
	mrrPreviousMonth: z.number(),
	mrrChangePercent: z.number(),
	mrrChangeAmount: z.number(),
	currency: z.string(),
});

export const mrrByCategoryItemSchema = z.object({
	category: categorySchema,
	label: z.string(),
	mrr: z.number(),
	subscriptionCount: z.number(),
});

export const mrrMovementSchema = z.object({
	newMrr: z.number(),
	lostMrr: z.number(),
	existingMrr: z.number(),
	netChange: z.number(),
	currency: z.string(),
});

export const revenueTrendMonthSchema = z.object({
	month: z.string(),
	year: z.number(),
	paidRevenue: z.number(),
	invoicedAmount: z.number(),
	invoiceCount: z.number(),
	paidInvoiceCount: z.number(),
});

export const customerMetricsSchema = z.object({
	arpc: z.number(),
	customerCount: z.number(),
	currency: z.string(),
});

export const revenueByTeamItemSchema = z.object({
	teamId: z.string(),
	teamName: z.string(),
	amount: z.number(),
	currency: z.string(),
	percentOfTotal: z.number().optional(),
});

export const commissionSummarySchema = z.object({
	commissionSubscriptionCount: z.number(),
	estimatedFeesAmount: z.number(),
	currency: z.string(),
	hasBaseData: z.boolean(),
});

export const activeSubscriptionsSchema = z.object({
	webHosting: z.number(),
	emailHosting: z.number(),
	byCategory: z.record(categorySchema, z.number()),
	totalActive: z.number(),
});

export const domainRenewalRateSchema = z.object({
	renewedCount: z.number(),
	dueCount: z.number(),
	ratePercent: z.number(),
	periodLabel: z.string(),
});

export const invoicingHealthSchema = z.object({
	invoicedThisMonth: z.number(),
	paidThisMonth: z.number(),
	overdueCount: z.number(),
	outstandingAmount: z.number(),
	currency: z.string(),
});

// --- Extended reports ---

export const revenueByProductItemSchema = z.object({
	productId: z.string(),
	productName: z.string(),
	category: categorySchema,
	mrr: z.number(),
	subscriptionCount: z.number(),
});

export const revenueByPlanItemSchema = z.object({
	planId: z.string(),
	planName: z.string(),
	productName: z.string(),
	mrr: z.number(),
	subscriptionCount: z.number(),
});

export const billingMixItemSchema = z.object({
	billingCycle: z.string(),
	mrr: z.number(),
	subscriptionCount: z.number(),
	percentOfMrr: z.number(),
});

export const revenueConcentrationSchema = z.object({
	top5Percent: z.number(),
	top10Percent: z.number(),
	top5Amount: z.number(),
	top10Amount: z.number(),
	totalAmount: z.number(),
});

export const churnRateSchema = z.object({
	churnedCount: z.number(),
	activeAtStartCount: z.number(),
	ratePercent: z.number(),
	lostMrr: z.number(),
	periodLabel: z.string(),
});

export const tenureBucketSchema = z.object({
	label: z.string(),
	monthsMin: z.number(),
	monthsMax: z.number().nullable(),
	subscriptionCount: z.number(),
});

export const upgradesDowngradesSchema = z.object({
	upgradesCount: z.number(),
	downgradesCount: z.number(),
	upgradesMrrImpact: z.number(),
	downgradesMrrImpact: z.number(),
	periodLabel: z.string(),
});

export const renewalsDueSchema = z.object({
	days30: z.object({ count: z.number(), mrr: z.number() }),
	days60: z.object({ count: z.number(), mrr: z.number() }),
	days90: z.object({ count: z.number(), mrr: z.number() }),
	currency: z.string(),
});

export const expiringSoonSchema = z.object({
	count: z.number(),
	mrr: z.number(),
	withinDays: z.number(),
	currency: z.string(),
});

export const paymentVelocitySchema = z.object({
	avgDaysToPay: z.number(),
	medianDaysToPay: z.number(),
	invoiceCount: z.number(),
});

export const overdueAgingSchema = z.object({
	bucket0_30: z.object({ count: z.number(), amount: z.number() }),
	bucket31_60: z.object({ count: z.number(), amount: z.number() }),
	bucket61_90: z.object({ count: z.number(), amount: z.number() }),
	bucket90Plus: z.object({ count: z.number(), amount: z.number() }),
	totalCount: z.number(),
	totalAmount: z.number(),
	currency: z.string(),
});

export const invoiceStatusMixSchema = z.object({
	DRAFT: z.number(),
	SENT: z.number(),
	UNPAID: z.number(),
	PARTIALLY_PAID: z.number(),
	PAID: z.number(),
	OVERDUE: z.number(),
	CANCELLED: z.number(),
	WRITTEN_OFF: z.number(),
	totalCount: z.number(),
});

export const taxAndCreditsSchema = z.object({
	taxCollectedThisMonth: z.number(),
	taxCollectedPeriod: z.number(),
	discountsThisMonth: z.number(),
	creditNotesIssuedPeriod: z.number(),
	currency: z.string(),
});

export const revenueByPaymentMethodSchema = z.object({
	method: z.string(),
	amount: z.number(),
	count: z.number(),
	percentOfTotal: z.number(),
});

export const newCustomersSchema = z.object({
	thisMonth: z.number(),
	previousMonth: z.number(),
	periodLabel: z.string(),
});

export const newSubscriptionsByProductSchema = z.object({
	productId: z.string(),
	productName: z.string(),
	category: categorySchema,
	count: z.number(),
});

export const orderPipelineSchema = z.object({
	PENDING: z.object({ count: z.number(), value: z.number() }),
	PROCESSING: z.object({ count: z.number(), value: z.number() }),
	COMPLETED: z.object({ count: z.number(), value: z.number() }),
	FAILED: z.object({ count: z.number(), value: z.number() }),
	PARTIAL: z.object({ count: z.number(), value: z.number() }),
	totalValue: z.number(),
	conversionPercent: z.number(),
	currency: z.string(),
});

export const promoEffectivenessSchema = z.object({
	redemptionsThisPeriod: z.number(),
	ordersWithPromo: z.number(),
	revenueWithPromo: z.number(),
	revenueWithoutPromo: z.number(),
	topPromos: z.array(z.object({ promoCode: z.string(), redemptions: z.number() })),
	currency: z.string(),
});

export const marginByCategorySchema = z.object({
	category: categorySchema,
	revenue: z.number(),
	cost: z.number(),
	marginPercent: z.number(),
	subscriptionCount: z.number(),
});

export const multiProductCustomersSchema = z.object({
	multiProductCount: z.number(),
	singleProductCount: z.number(),
	totalWithSubs: z.number(),
	multiProductPercent: z.number(),
});

export const topCustomersTrendSchema = z.object({
	teamId: z.string(),
	teamName: z.string(),
	mrrCurrent: z.number(),
	mrrPrevious: z.number(),
	changePercent: z.number(),
	changeAmount: z.number(),
});

export const atRiskCustomersSchema = z.object({
	count: z.number(),
	daysWithoutPayment: z.number(),
	description: z.string(),
});

export const timeComparisonSchema = z.object({
	mrrMonthOverMonthPercent: z.number(),
	paidRevenueMonthOverMonthPercent: z.number(),
	paidRevenueYearOverYearPercent: z.number().nullable(),
	annualRunRate: z.number(),
	currency: z.string(),
});

export const autoRenewRateSchema = z.object({
	withAutoRenew: z.number(),
	withoutAutoRenew: z.number(),
	ratePercent: z.number(),
	totalActive: z.number(),
});

export const salesReportOverviewSchema = z.object({
	executive: executiveSummarySchema,
	mrrByCategory: z.array(mrrByCategoryItemSchema),
	mrrMovement: mrrMovementSchema,
	revenueTrend: z.array(revenueTrendMonthSchema),
	customer: customerMetricsSchema,
	revenueByTeam: z.array(revenueByTeamItemSchema),
	commission: commissionSummarySchema,
	activeSubscriptions: activeSubscriptionsSchema,
	domainRenewalRate: domainRenewalRateSchema,
	invoicing: invoicingHealthSchema,
	// Extended
	revenueByProduct: z.array(revenueByProductItemSchema),
	revenueByPlan: z.array(revenueByPlanItemSchema),
	billingMix: z.array(billingMixItemSchema),
	averageDealSize: z.object({ mean: z.number(), median: z.number(), currency: z.string() }),
	revenueConcentration: revenueConcentrationSchema,
	churnRate: churnRateSchema,
	subscriptionTenure: z.array(tenureBucketSchema),
	upgradesDowngrades: upgradesDowngradesSchema,
	autoRenewRate: autoRenewRateSchema,
	renewalsDue: renewalsDueSchema,
	expiringSoon: expiringSoonSchema,
	paymentVelocity: paymentVelocitySchema,
	overdueAging: overdueAgingSchema,
	invoiceStatusMix: invoiceStatusMixSchema,
	taxAndCredits: taxAndCreditsSchema,
	revenueByPaymentMethod: z.array(revenueByPaymentMethodSchema),
	newCustomers: newCustomersSchema,
	newSubscriptionsByProduct: z.array(newSubscriptionsByProductSchema),
	orderPipeline: orderPipelineSchema,
	promoEffectiveness: promoEffectivenessSchema,
	marginByCategory: z.array(marginByCategorySchema),
	multiProductCustomers: multiProductCustomersSchema,
	topCustomersTrend: z.array(topCustomersTrendSchema),
	atRiskCustomers: atRiskCustomersSchema,
	timeComparison: timeComparisonSchema,
});

export type SalesReportOverviewInput = z.infer<typeof salesReportOverviewInputSchema>;
export type SalesReportOverview = z.infer<typeof salesReportOverviewSchema>;
