import {
	addDays,
	differenceInDays,
	endOfMonth,
	startOfMonth,
	subMonths,
	subYears,
} from "date-fns";
import {
	and,
	count,
	eq,
	gte,
	inArray,
	isNotNull,
	isNull,
	lt,
	lte,
	notInArray,
} from "@npanel/db";

import { db } from "@npanel/db";
import { creditNote, invoice, invoiceTransaction } from "@npanel/db/schema/invoicing";
import { niscOrder } from "@npanel/db/schema/nisc-orders";
import {
	niscClientSubscription,
	niscClientSubscriptionRenewal,
	niscProduct,
	niscProductPromoRedeem,
} from "@npanel/db/schema/products";
import type { SalesReportOverview } from "./sales-overview-schemas";

type BillingCycle = "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM";
type NiscProductCategory = "CLOUD" | "MARKETING" | "CONSULTING" | "CUSTOM" | "AI";

const ACTIVE = "ACTIVE";
const CANCELLED = "CANCELLED";
const EXPIRED = "EXPIRED";
const UPGRADED = "UPGRADED";
const DOWNGRADED = "DOWNGRADED";
const COMMISSION = "COMMISSION";
const FIXED = "FIXED";

const CATEGORY_LABELS: Record<NiscProductCategory, string> = {
	CLOUD: "Cloud (Domains, Hosting)",
	MARKETING: "Marketing",
	CONSULTING: "Consulting",
	CUSTOM: "Custom",
	AI: "AI",
};

/** Normalize subscription price to monthly (MRR). */
function monthlyValue(
	priceStr: string | null,
	billingCycle: string | null,
): number {
	if (!priceStr) return 0;
	const price = Number.parseFloat(priceStr);
	if (!Number.isFinite(price) || price <= 0) return 0;
	switch (billingCycle as BillingCycle | null) {
		case "MONTHLY":
			return price;
		case "YEARLY":
			return price / 12;
		case "BIENNIALLY":
			return price / 24;
		case "CUSTOM":
		default:
			return price; // treat as monthly for lack of info
	}
}

/** Build sales report overview from live data (no snapshot tables). */
export async function computeSalesReportOverview(params: {
	from: Date;
	to: Date;
	monthsTrend: number;
	topTeamsLimit: number;
}): Promise<SalesReportOverview> {
	const { from, to, monthsTrend, topTeamsLimit } = params;
	const currency = "KES";
	const now = new Date();
	const startOfThisMonth = startOfMonth(now);
	const endOfThisMonth = endOfMonth(now);
	const startOfPrevMonth = startOfMonth(subMonths(now, 1));
	const endOfPrevMonth = endOfMonth(subMonths(now, 1));

	// --- Active subscriptions for MRR (current: ACTIVE, not upgraded/downgraded) ---
	const activeSubs = await db.query.niscClientSubscription.findMany({
		where: and(
			eq(niscClientSubscription.status, ACTIVE),
			isNull(niscClientSubscription.upgradedToSubscriptionId),
			isNull(niscClientSubscription.downgradedToSubscriptionId),
		),
		with: {
			product: { columns: { category: true, serviceType: true, name: true } },
			team: { columns: { id: true, name: true } },
		},
	});

	let mrrTotal = 0;
	const mrrByCategoryMap = new Map<
		NiscProductCategory,
		{ mrr: number; count: number }
	>();
	for (const sub of activeSubs) {
		let mrr = 0;
		if (sub.pricingModel === FIXED && sub.agreedPrice) {
			mrr = monthlyValue(sub.agreedPrice, sub.billingCycle);
		}
		// COMMISSION: no base in DB for now -> 0
		mrrTotal += mrr;
		const cat = sub.product.category as NiscProductCategory;
		const existing = mrrByCategoryMap.get(cat) ?? { mrr: 0, count: 0 };
		mrrByCategoryMap.set(cat, {
			mrr: existing.mrr + mrr,
			count: existing.count + 1,
		});
	}

	// New MRR: subscriptions that started this month (subscriptionDate in range)
	const newSubs = await db.query.niscClientSubscription.findMany({
		where: and(
			gte(niscClientSubscription.subscriptionDate, startOfThisMonth),
			lte(niscClientSubscription.subscriptionDate, endOfThisMonth),
		),
		with: { product: { columns: { category: true, name: true } } },
	});
	let newMrr = 0;
	for (const sub of newSubs) {
		if (sub.pricingModel === FIXED && sub.agreedPrice)
			newMrr += monthlyValue(sub.agreedPrice, sub.billingCycle);
	}

	// Lost MRR: subscriptions that left (cancelled/expired) this month (updatedAt or expiryDate in range)
	const churnedSubs = await db.query.niscClientSubscription.findMany({
		where: and(
			inArray(niscClientSubscription.status, [CANCELLED, EXPIRED]),
			gte(niscClientSubscription.updatedAt, startOfThisMonth),
			lte(niscClientSubscription.updatedAt, endOfThisMonth),
		),
	});
	let lostMrr = 0;
	for (const sub of churnedSubs) {
		if (sub.pricingModel === FIXED && sub.agreedPrice)
			lostMrr += monthlyValue(sub.agreedPrice, sub.billingCycle);
	}

	// Previous month MRR: approximate as current - new + lost (same-period view)
	const previousMonthMrr = Math.max(
		0,
		mrrTotal - newMrr + lostMrr,
	);
	const mrrChangeAmount = mrrTotal - previousMonthMrr;
	const mrrChangePercent =
		previousMonthMrr > 0
			? (mrrChangeAmount / previousMonthMrr) * 100
			: mrrTotal > 0
				? 100
				: 0;

	// Revenue trend: paid invoices by month (last N months)
	const trendMonths: { month: Date; label: string }[] = [];
	for (let i = monthsTrend - 1; i >= 0; i--) {
		const d = subMonths(now, i);
		trendMonths.push({
			month: startOfMonth(d),
			label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
		});
	}

	const invoicesInRange = await db
		.select({
			createdAt: invoice.createdAt,
			amount: invoice.amount,
			status: invoice.status,
			paidAt: invoice.paidAt,
		})
		.from(invoice)
		.where(
			and(
				gte(invoice.createdAt, trendMonths[0]?.month ?? from),
				lte(invoice.createdAt, now),
			),
		);

	const revenueByMonth = new Map<
		string,
		{
			paidRevenue: number;
			invoicedAmount: number;
			invoiceCount: number;
			paidInvoiceCount: number;
		}
	>();
	for (const m of trendMonths) {
		revenueByMonth.set(m.label, {
			paidRevenue: 0,
			invoicedAmount: 0,
			invoiceCount: 0,
			paidInvoiceCount: 0,
		});
	}
	for (const inv of invoicesInRange) {
		const key = `${inv.createdAt.getFullYear()}-${String(inv.createdAt.getMonth() + 1).padStart(2, "0")}`;
		const entry = revenueByMonth.get(key);
		if (!entry) continue;
		const amount = Number.parseFloat(inv.amount ?? "0") || 0;
		entry.invoicedAmount += amount;
		entry.invoiceCount += 1;
		if (inv.status === "PAID") {
			entry.paidRevenue += amount;
			entry.paidInvoiceCount += 1;
		}
	}

	const revenueTrend = trendMonths.map(({ month, label }) => {
		const e = revenueByMonth.get(label) ?? {
			paidRevenue: 0,
			invoicedAmount: 0,
			invoiceCount: 0,
			paidInvoiceCount: 0,
		};
		return {
			month: label,
			year: month.getFullYear(),
			paidRevenue: e.paidRevenue,
			invoicedAmount: e.invoicedAmount,
			invoiceCount: e.invoiceCount,
			paidInvoiceCount: e.paidInvoiceCount,
		};
	});

	// Customer count (distinct teams with active sub or paid invoice in period)
	const teamIdsFromSubs = new Set(
		activeSubs.map((s) => s.teamId).filter(Boolean) as string[],
	);
	const paidInvoices = await db
		.select({ teamId: invoice.teamId })
		.from(invoice)
		.where(
			and(eq(invoice.status, "PAID"), gte(invoice.paidAt, from), lte(invoice.paidAt, to)),
		);
	for (const inv of paidInvoices) {
		if (inv.teamId) teamIdsFromSubs.add(inv.teamId);
	}
	const customerCount = teamIdsFromSubs.size;
	const arpc = customerCount > 0 ? mrrTotal / customerCount : 0;

	// Revenue by team (paid amount in period)
	const invoicesWithTeam = await db.query.invoice.findMany({
		where: and(
			gte(invoice.createdAt, from),
			lte(invoice.createdAt, to),
			eq(invoice.status, "PAID"),
		),
		with: { team: { columns: { id: true, name: true } } },
	});
	const teamAmounts = new Map<string, { name: string; amount: number }>();
	let totalPaidInPeriod = 0;
	for (const inv of invoicesWithTeam) {
		const amount = Number.parseFloat(inv.amount ?? "0") || 0;
		totalPaidInPeriod += amount;
		const tid = inv.teamId ?? "__NO_TEAM__";
		const name = inv.team?.name ?? "No company";
		const existing = teamAmounts.get(tid);
		if (existing) {
			existing.amount += amount;
		} else {
			teamAmounts.set(tid, { name, amount });
		}
	}
	const revenueByTeam = Array.from(teamAmounts.entries())
		.map(([teamId, { name, amount }]) => ({
			teamId,
			teamName: name,
			amount,
			currency,
			percentOfTotal:
				totalPaidInPeriod > 0 ? (amount / totalPaidInPeriod) * 100 : 0,
		}))
		.sort((a, b) => b.amount - a.amount)
		.slice(0, topTeamsLimit);

	// Commission: count COMMISSION subs; fee = base * rate (no base in DB -> 0)
	const commissionSubs = activeSubs.filter((s) => s.pricingModel === COMMISSION);
	const commissionSubscriptionCount = commissionSubs.length;
	let estimatedFeesAmount = 0;
	// If we had agreedCommissionBase value in serviceRefs we could sum here
	const hasBaseData = false;

	// Active subscription counts by type
	let webHosting = 0;
	let emailHosting = 0;
	const byCategory: Record<NiscProductCategory, number> = {
		CLOUD: 0,
		MARKETING: 0,
		CONSULTING: 0,
		CUSTOM: 0,
		AI: 0,
	};
	for (const sub of activeSubs) {
		if (sub.hostingType === "WEB_HOSTING") webHosting += 1;
		if (sub.hostingType === "EMAIL_HOSTING") emailHosting += 1;
		const pc = sub.product.category as NiscProductCategory;
		byCategory[pc] = (byCategory[pc] ?? 0) + 1;
	}

	// Domain renewal rate: due in period vs renewed in period
	const domainProductRows = await db
		.select({ id: niscProduct.id })
		.from(niscProduct)
		.where(
			inArray(niscProduct.serviceType, [
				"domain_registration",
				"domain",
				"domains",
			]),
		);
	const domainProductIds = domainProductRows.map((p) => p.id);

	let domainsDueInPeriod = 0;
	if (domainProductIds.length > 0) {
		const [dueRow] = await db
			.select({ c: count() })
			.from(niscClientSubscription)
			.where(
				and(
					inArray(niscClientSubscription.productId, domainProductIds),
					eq(niscClientSubscription.status, ACTIVE),
					gte(niscClientSubscription.nextRenewalDate, startOfThisMonth),
					lte(niscClientSubscription.nextRenewalDate, endOfThisMonth),
				),
			);
		domainsDueInPeriod = Number(dueRow?.c ?? 0);
	}

	const [renewedRow] = await db
		.select({ c: count() })
		.from(niscClientSubscriptionRenewal)
		.where(
			and(
				eq(niscClientSubscriptionRenewal.renewalType, "DOMAIN"),
				gte(niscClientSubscriptionRenewal.renewalDate, startOfThisMonth),
				lte(niscClientSubscriptionRenewal.renewalDate, endOfThisMonth),
			),
		);
	const renewedInPeriod = Number(renewedRow?.c ?? 0);

	const dueCount = domainsDueInPeriod;
	const renewedCount = renewedInPeriod;
	const ratePercent =
		dueCount > 0 ? (renewedCount / dueCount) * 100 : 0;

	// Invoicing health: this month
	const thisMonthInvoices = await db
		.select({ amount: invoice.amount, status: invoice.status })
		.from(invoice)
		.where(
			and(
				gte(invoice.createdAt, startOfThisMonth),
				lte(invoice.createdAt, endOfThisMonth),
			),
		);
	let invoicedThisMonth = 0;
	let paidThisMonth = 0;
	for (const inv of thisMonthInvoices) {
		const a = Number.parseFloat(inv.amount ?? "0") || 0;
		invoicedThisMonth += a;
		if (inv.status === "PAID") paidThisMonth += a;
	}

	const [overdueRow] = await db
		.select({ c: count() })
		.from(invoice)
		.where(and(eq(invoice.status, "OVERDUE"), lt(invoice.dueDate, now)));
	const overdueInvoices = Number(overdueRow?.c ?? 0);

	const outstandingInvoices = await db
		.select({ amount: invoice.amount })
		.from(invoice)
		.where(
			notInArray(invoice.status, ["PAID", "CANCELLED", "WRITTEN_OFF", "REFUNDED"]),
		);
	let outstandingAmount = 0;
	for (const inv of outstandingInvoices) {
		outstandingAmount += Number.parseFloat(inv.amount ?? "0") || 0;
	}

	// --- Revenue by product ---
	const productMrrMap = new Map<
		string,
		{ name: string; category: NiscProductCategory; mrr: number; count: number }
	>();
	for (const sub of activeSubs) {
		let mrr = 0;
		if (sub.pricingModel === FIXED && sub.agreedPrice)
			mrr = monthlyValue(sub.agreedPrice, sub.billingCycle);
		const pid = sub.productId;
		const existing = productMrrMap.get(pid);
		const cat = sub.product.category as NiscProductCategory;
		const pName = sub.product.name ?? sub.productId;
		if (existing) {
			existing.mrr += mrr;
			existing.count += 1;
		} else {
			productMrrMap.set(pid, {
				name: pName,
				category: cat,
				mrr,
				count: 1,
			});
		}
	}
	const revenueByProduct = Array.from(productMrrMap.entries())
		.map(([productId, v]) => ({
			productId,
			productName: v.name,
			category: v.category,
			mrr: v.mrr,
			subscriptionCount: v.count,
		}))
		.sort((a, b) => b.mrr - a.mrr);

	// --- Revenue by plan (need productPlan from activeSubs) ---
	const activeSubsWithPlan = await db.query.niscClientSubscription.findMany({
		where: and(
			eq(niscClientSubscription.status, ACTIVE),
			isNull(niscClientSubscription.upgradedToSubscriptionId),
			isNull(niscClientSubscription.downgradedToSubscriptionId),
		),
		with: {
			product: { columns: { name: true } },
			productPlan: { columns: { id: true, name: true } },
		},
	});
	const planMrrMap = new Map<
		string,
		{ planName: string; productName: string; mrr: number; count: number }
	>();
	for (const sub of activeSubsWithPlan) {
		let mrr = 0;
		if (sub.pricingModel === FIXED && sub.agreedPrice)
			mrr = monthlyValue(sub.agreedPrice, sub.billingCycle);
		const planId = sub.productPlanId ?? `none-${sub.productId}`;
		const planName = sub.productPlan?.name ?? "No plan";
		const productName = sub.product?.name ?? "Unknown";
		const existing = planMrrMap.get(planId);
		if (existing) {
			existing.mrr += mrr;
			existing.count += 1;
		} else {
			planMrrMap.set(planId, { planName, productName, mrr, count: 1 });
		}
	}
	const revenueByPlan = Array.from(planMrrMap.entries())
		.map(([planId, v]) => ({
			planId,
			planName: v.planName,
			productName: v.productName,
			mrr: v.mrr,
			subscriptionCount: v.count,
		}))
		.sort((a, b) => b.mrr - a.mrr);

	// --- Billing mix ---
	const billingCycleMap = new Map<string, { mrr: number; count: number }>();
	for (const sub of activeSubs) {
		let mrr = 0;
		if (sub.pricingModel === FIXED && sub.agreedPrice)
			mrr = monthlyValue(sub.agreedPrice, sub.billingCycle);
		const cycle = sub.billingCycle ?? "CUSTOM";
		const existing = billingCycleMap.get(cycle) ?? { mrr: 0, count: 0 };
		billingCycleMap.set(cycle, {
			mrr: existing.mrr + mrr,
			count: existing.count + 1,
		});
	}
	const billingMixTotal = mrrTotal || 1;
	const billingMix = [
		"MONTHLY",
		"YEARLY",
		"BIENNIALLY",
		"CUSTOM",
	].map((billingCycle) => {
		const e = billingCycleMap.get(billingCycle) ?? { mrr: 0, count: 0 };
		return {
			billingCycle,
			mrr: e.mrr,
			subscriptionCount: e.count,
			percentOfMrr: (e.mrr / billingMixTotal) * 100,
		};
	});

	// --- Average deal size (from paid invoices in period) ---
	const paidAmounts = invoicesWithTeam.map((inv) =>
		Number.parseFloat(inv.amount ?? "0") || 0,
	);
	const sortedAmounts = [...paidAmounts].sort((a, b) => a - b);
	const mean =
		paidAmounts.length > 0
			? paidAmounts.reduce((s, a) => s + a, 0) / paidAmounts.length
			: 0;
	const median =
		sortedAmounts.length > 0
			? sortedAmounts[Math.floor(sortedAmounts.length / 2)] ?? 0
			: 0;

	// --- Revenue concentration ---
	const sortedTeams = [...revenueByTeam].sort((a, b) => b.amount - a.amount);
	const top5Amount = sortedTeams.slice(0, 5).reduce((s, t) => s + t.amount, 0);
	const top10Amount = sortedTeams
		.slice(0, 10)
		.reduce((s, t) => s + t.amount, 0);
	const revenueConcentration = {
		top5Percent: totalPaidInPeriod > 0 ? (top5Amount / totalPaidInPeriod) * 100 : 0,
		top10Percent: totalPaidInPeriod > 0 ? (top10Amount / totalPaidInPeriod) * 100 : 0,
		top5Amount,
		top10Amount,
		totalAmount: totalPaidInPeriod,
	};

	// --- Churn rate: active at start of month vs churned in month ---
	const activeAtStartCount =
		activeSubs.length + churnedSubs.length - newSubs.length;
	const churnRate = {
		churnedCount: churnedSubs.length,
		activeAtStartCount: Math.max(0, activeAtStartCount),
		ratePercent:
			activeAtStartCount > 0
				? (churnedSubs.length / activeAtStartCount) * 100
				: 0,
		lostMrr,
		periodLabel: startOfThisMonth.toLocaleDateString("en-CA", {
			month: "short",
			year: "numeric",
		}),
	};

	// --- Subscription tenure (0-3, 3-6, 6-12, 12+ months) ---
	const tenureBuckets = [
		{ label: "0–3 months", monthsMin: 0, monthsMax: 3 },
		{ label: "3–6 months", monthsMin: 3, monthsMax: 6 },
		{ label: "6–12 months", monthsMin: 6, monthsMax: 12 },
		{ label: "12+ months", monthsMin: 12, monthsMax: null },
	];
	const tenureCounts = tenureBuckets.map((b) => ({
		...b,
		subscriptionCount: 0,
	}));
	for (const sub of activeSubs) {
		const start = sub.subscriptionDate ?? sub.createdAt;
		const months = differenceInDays(now, start) / 30;
		for (let i = 0; i < tenureBuckets.length; i++) {
			const b = tenureBuckets[i]!;
			if (b.monthsMax === null) {
				if (months >= b.monthsMin) {
					tenureCounts[i]!.subscriptionCount += 1;
					break;
				}
			} else if (months >= b.monthsMin && months < b.monthsMax) {
				tenureCounts[i]!.subscriptionCount += 1;
				break;
			}
		}
	}
	const subscriptionTenure = tenureCounts.map((t) => ({
		label: t.label,
		monthsMin: t.monthsMin,
		monthsMax: t.monthsMax,
		subscriptionCount: t.subscriptionCount,
	}));

	// --- Upgrades / downgrades this month ---
	const upgrades = await db.query.niscClientSubscription.findMany({
		where: and(
			eq(niscClientSubscription.status, UPGRADED),
			gte(niscClientSubscription.upgradedAt, startOfThisMonth),
			lte(niscClientSubscription.upgradedAt, endOfThisMonth),
		),
		with: { product: true },
	});
	const downgrades = await db.query.niscClientSubscription.findMany({
		where: and(
			eq(niscClientSubscription.status, DOWNGRADED),
			gte(niscClientSubscription.downgradedAt, startOfThisMonth),
			lte(niscClientSubscription.downgradedAt, endOfThisMonth),
		),
		with: { product: true },
	});
	let upgradesMrrImpact = 0;
	let downgradesMrrImpact = 0;
	for (const sub of upgrades) {
		if (sub.pricingModel === FIXED && sub.agreedPrice)
			upgradesMrrImpact += monthlyValue(sub.agreedPrice, sub.billingCycle);
	}
	for (const sub of downgrades) {
		if (sub.pricingModel === FIXED && sub.agreedPrice)
			downgradesMrrImpact += monthlyValue(sub.agreedPrice, sub.billingCycle);
	}
	const upgradesDowngrades = {
		upgradesCount: upgrades.length,
		downgradesCount: downgrades.length,
		upgradesMrrImpact,
		downgradesMrrImpact,
		periodLabel: startOfThisMonth.toLocaleDateString("en-CA", {
			month: "short",
			year: "numeric",
		}),
	};

	// --- Auto-renew rate ---
	let withAutoRenew = 0;
	for (const sub of activeSubs) {
		if (sub.autoRenew) withAutoRenew += 1;
	}
	const autoRenewRate = {
		withAutoRenew,
		withoutAutoRenew: activeSubs.length - withAutoRenew,
		ratePercent:
			activeSubs.length > 0 ? (withAutoRenew / activeSubs.length) * 100 : 0,
		totalActive: activeSubs.length,
	};

	// --- Renewals due 30/60/90 days ---
	const in30 = addDays(now, 30);
	const in60 = addDays(now, 60);
	const in90 = addDays(now, 90);
	const subsDue30 = await db
		.select({
			agreedPrice: niscClientSubscription.agreedPrice,
			billingCycle: niscClientSubscription.billingCycle,
			pricingModel: niscClientSubscription.pricingModel,
		})
		.from(niscClientSubscription)
		.where(
			and(
				eq(niscClientSubscription.status, ACTIVE),
				isNull(niscClientSubscription.upgradedToSubscriptionId),
				isNull(niscClientSubscription.downgradedToSubscriptionId),
				gte(niscClientSubscription.nextRenewalDate, now),
				lte(niscClientSubscription.nextRenewalDate, in30),
			),
		);
	const subsDue60 = await db
		.select({
			agreedPrice: niscClientSubscription.agreedPrice,
			billingCycle: niscClientSubscription.billingCycle,
			pricingModel: niscClientSubscription.pricingModel,
		})
		.from(niscClientSubscription)
		.where(
			and(
				eq(niscClientSubscription.status, ACTIVE),
				isNull(niscClientSubscription.upgradedToSubscriptionId),
				isNull(niscClientSubscription.downgradedToSubscriptionId),
				gte(niscClientSubscription.nextRenewalDate, in30),
				lte(niscClientSubscription.nextRenewalDate, in60),
			),
		);
	const subsDue90 = await db
		.select({
			agreedPrice: niscClientSubscription.agreedPrice,
			billingCycle: niscClientSubscription.billingCycle,
			pricingModel: niscClientSubscription.pricingModel,
		})
		.from(niscClientSubscription)
		.where(
			and(
				eq(niscClientSubscription.status, ACTIVE),
				isNull(niscClientSubscription.upgradedToSubscriptionId),
				isNull(niscClientSubscription.downgradedToSubscriptionId),
				gte(niscClientSubscription.nextRenewalDate, in60),
				lte(niscClientSubscription.nextRenewalDate, in90),
			),
		);
	const mrrForSubs = (list: { agreedPrice: string | null; billingCycle: string | null; pricingModel: string }[]) => {
		let sum = 0;
		for (const s of list) {
			if (s.pricingModel === FIXED && s.agreedPrice)
				sum += monthlyValue(s.agreedPrice, s.billingCycle);
		}
		return sum;
	};
	const renewalsDue = {
		days30: { count: subsDue30.length, mrr: mrrForSubs(subsDue30) },
		days60: { count: subsDue60.length, mrr: mrrForSubs(subsDue60) },
		days90: { count: subsDue90.length, mrr: mrrForSubs(subsDue90) },
		currency,
	};

	// --- Expiring soon (next 30 days, no renewal yet) ---
	const expiringSubs = await db
		.select({
			agreedPrice: niscClientSubscription.agreedPrice,
			billingCycle: niscClientSubscription.billingCycle,
			pricingModel: niscClientSubscription.pricingModel,
		})
		.from(niscClientSubscription)
		.where(
			and(
				eq(niscClientSubscription.status, ACTIVE),
				gte(niscClientSubscription.expiryDate, now),
				lte(niscClientSubscription.expiryDate, in30),
			),
		);
	const expiringSoon = {
		count: expiringSubs.length,
		mrr: mrrForSubs(expiringSubs),
		withinDays: 30,
		currency,
	};

	// --- Payment velocity (paid invoices: days from createdAt/issueDate to paidAt) ---
	const paidForVelocity = await db
		.select({
			createdAt: invoice.createdAt,
			issueDate: invoice.issueDate,
			paidAt: invoice.paidAt,
		})
		.from(invoice)
		.where(
			and(eq(invoice.status, "PAID"), gte(invoice.paidAt, subMonths(now, 6))),
		);
	const daysToPay: number[] = [];
	for (const inv of paidForVelocity) {
		const fromDate = inv.issueDate ?? inv.createdAt;
		const toDate = inv.paidAt;
		if (fromDate && toDate)
			daysToPay.push(differenceInDays(toDate, fromDate));
	}
	const avgDaysToPay =
		daysToPay.length > 0
			? daysToPay.reduce((a, b) => a + b, 0) / daysToPay.length
			: 0;
	const sortedDays = [...daysToPay].sort((a, b) => a - b);
	const medianDaysToPay =
		sortedDays.length > 0
			? sortedDays[Math.floor(sortedDays.length / 2)] ?? 0
			: 0;
	const paymentVelocity = {
		avgDaysToPay: Math.round(avgDaysToPay * 10) / 10,
		medianDaysToPay: Math.round(medianDaysToPay * 10) / 10,
		invoiceCount: daysToPay.length,
	};

	// --- Overdue aging (0-30, 31-60, 61-90, 90+ days overdue) ---
	const overdueInvs = await db
		.select({ amount: invoice.amount, dueDate: invoice.dueDate })
		.from(invoice)
		.where(
			and(
				notInArray(invoice.status, ["PAID", "CANCELLED", "WRITTEN_OFF", "REFUNDED"]),
				lt(invoice.dueDate, now),
			),
		);
	const agingBuckets = {
		bucket0_30: { count: 0, amount: 0 },
		bucket31_60: { count: 0, amount: 0 },
		bucket61_90: { count: 0, amount: 0 },
		bucket90Plus: { count: 0, amount: 0 },
	};
	let totalAgingAmount = 0;
	for (const inv of overdueInvs) {
		const amt = Number.parseFloat(inv.amount ?? "0") || 0;
		const daysOverdue = differenceInDays(now, inv.dueDate ?? now);
		totalAgingAmount += amt;
		if (daysOverdue <= 30) {
			agingBuckets.bucket0_30.count += 1;
			agingBuckets.bucket0_30.amount += amt;
		} else if (daysOverdue <= 60) {
			agingBuckets.bucket31_60.count += 1;
			agingBuckets.bucket31_60.amount += amt;
		} else if (daysOverdue <= 90) {
			agingBuckets.bucket61_90.count += 1;
			agingBuckets.bucket61_90.amount += amt;
		} else {
			agingBuckets.bucket90Plus.count += 1;
			agingBuckets.bucket90Plus.amount += amt;
		}
	}
	const overdueAging = {
		...agingBuckets,
		totalCount: overdueInvs.length,
		totalAmount: totalAgingAmount,
		currency,
	};

	// --- Invoice status mix ---
	const statusCounts = await db
		.select({ status: invoice.status, c: count() })
		.from(invoice)
		.groupBy(invoice.status);
	const statusMap = new Map(
		statusCounts.map((s) => [s.status, Number(s.c)]),
	);
	const invoiceStatusMix = {
		DRAFT: statusMap.get("DRAFT") ?? 0,
		SENT: statusMap.get("SENT") ?? 0,
		UNPAID: statusMap.get("UNPAID") ?? 0,
		PARTIALLY_PAID: statusMap.get("PARTIALLY_PAID") ?? 0,
		PAID: statusMap.get("PAID") ?? 0,
		OVERDUE: statusMap.get("OVERDUE") ?? 0,
		CANCELLED: statusMap.get("CANCELLED") ?? 0,
		WRITTEN_OFF: statusMap.get("WRITTEN_OFF") ?? 0,
		totalCount: statusCounts.reduce((s, x) => s + Number(x.c), 0),
	};

	// --- Tax and credits ---
	const invoicesForTax = await db
		.select({ tax: invoice.tax, discount: invoice.discount })
		.from(invoice)
		.where(
			and(
				eq(invoice.status, "PAID"),
				gte(invoice.paidAt, startOfThisMonth),
				lte(invoice.paidAt, endOfThisMonth),
			),
		);
	let taxCollectedThisMonth = 0;
	let discountsThisMonth = 0;
	for (const inv of invoicesForTax) {
		taxCollectedThisMonth += Number.parseFloat(inv.tax ?? "0") || 0;
		discountsThisMonth += Number.parseFloat(inv.discount ?? "0") || 0;
	}
	const invoicesTaxPeriod = await db
		.select({ tax: invoice.tax })
		.from(invoice)
		.where(
			and(eq(invoice.status, "PAID"), gte(invoice.paidAt, from), lte(invoice.paidAt, to)),
		);
	let taxCollectedPeriod = 0;
	for (const inv of invoicesTaxPeriod) {
		taxCollectedPeriod += Number.parseFloat(inv.tax ?? "0") || 0;
	}
	const creditNotesPeriod = await db
		.select({ amount: creditNote.amount })
		.from(creditNote)
		.where(
			and(gte(creditNote.issuedAt, from), lte(creditNote.issuedAt, to)),
		);
	let creditNotesIssuedPeriod = 0;
	for (const cn of creditNotesPeriod) {
		creditNotesIssuedPeriod += Number.parseFloat(cn.amount ?? "0") || 0;
	}
	const taxAndCredits = {
		taxCollectedThisMonth,
		taxCollectedPeriod,
		discountsThisMonth,
		creditNotesIssuedPeriod,
		currency,
	};

	// --- Revenue by payment method (from transactions) ---
	const transactions = await db
		.select({ method: invoiceTransaction.method, amount: invoiceTransaction.amount })
		.from(invoiceTransaction)
		.where(
			and(
				eq(invoiceTransaction.status, "COMPLETED"),
				gte(invoiceTransaction.paidAt, from),
				lte(invoiceTransaction.paidAt, to),
			),
		);
	const methodMap = new Map<string, { amount: number; count: number }>();
	for (const t of transactions) {
		const amt = Number.parseFloat(t.amount ?? "0") || 0;
		const m = t.method;
		const existing = methodMap.get(m) ?? { amount: 0, count: 0 };
		methodMap.set(m, {
			amount: existing.amount + amt,
			count: existing.count + 1,
		});
	}
	const totalByMethod = transactions.reduce(
		(s, t) => s + (Number.parseFloat(t.amount ?? "0") || 0),
		0,
	);
	const revenueByPaymentMethod = Array.from(methodMap.entries()).map(
		([method, v]) => ({
			method,
			amount: v.amount,
			count: v.count,
			percentOfTotal: totalByMethod > 0 ? (v.amount / totalByMethod) * 100 : 0,
		}),
	);

	// --- New customers (teams with first invoice or first sub in period) ---
	const paidInvoicesByTeam = await db
		.select({ teamId: invoice.teamId, paidAt: invoice.paidAt })
		.from(invoice)
		.where(
			and(
				eq(invoice.status, "PAID"),
				isNotNull(invoice.teamId),
				isNotNull(invoice.paidAt),
			),
		);
	// Sort by paidAt asc so first occurrence per team is earliest
	paidInvoicesByTeam.sort(
		(a, b) => (a.paidAt?.getTime() ?? 0) - (b.paidAt?.getTime() ?? 0),
	);
	const firstPaidByTeam = new Map<string, Date>();
	for (const inv of paidInvoicesByTeam) {
		if (inv.teamId && inv.paidAt && !firstPaidByTeam.has(inv.teamId))
			firstPaidByTeam.set(inv.teamId, inv.paidAt);
	}
	let newCustomersThisMonth = 0;
	let newCustomersPrevMonth = 0;
	for (const [, date] of firstPaidByTeam) {
		if (date >= startOfThisMonth && date <= endOfThisMonth)
			newCustomersThisMonth += 1;
		if (date >= startOfPrevMonth && date <= endOfPrevMonth)
			newCustomersPrevMonth += 1;
	}
	const newCustomers = {
		thisMonth: newCustomersThisMonth,
		previousMonth: newCustomersPrevMonth,
		periodLabel: startOfThisMonth.toLocaleDateString("en-CA", {
			month: "short",
			year: "numeric",
		}),
	};

	// --- New subscriptions by product this month ---
	const newSubsByProductMap = new Map<
		string,
		{ name: string; category: NiscProductCategory; count: number }
	>();
	for (const sub of newSubs) {
		const pid = sub.productId;
		const cat = sub.product.category as NiscProductCategory;
		const name = sub.product.name ?? pid;
		const existing = newSubsByProductMap.get(pid);
		if (existing) {
			existing.count += 1;
		} else {
			newSubsByProductMap.set(pid, {
				name,
				category: cat,
				count: 1,
			});
		}
	}
	const newSubscriptionsByProduct = Array.from(newSubsByProductMap.entries()).map(
		([productId, v]) => ({
			productId,
			productName: v.name,
			category: v.category,
			count: v.count,
		}),
	);

	// --- Order pipeline ---
	const ordersAll = await db
		.select({ status: niscOrder.status, total: niscOrder.total })
		.from(niscOrder)
		.where(gte(niscOrder.createdAt, subMonths(now, 3)));
	const orderPipelineMap = new Map<
		string,
		{ count: number; value: number }
	>();
	for (const o of ordersAll) {
		const status = o.status;
		const val = Number.parseFloat(o.total ?? "0") || 0;
		const e = orderPipelineMap.get(status) ?? { count: 0, value: 0 };
		orderPipelineMap.set(status, {
			count: e.count + 1,
			value: e.value + val,
		});
	}
	const totalOrderValue = ordersAll.reduce(
		(s, o) => s + (Number.parseFloat(o.total ?? "0") || 0),
		0,
	);
	const orderPipeline = {
		PENDING: orderPipelineMap.get("PENDING") ?? { count: 0, value: 0 },
		PROCESSING: orderPipelineMap.get("PROCESSING") ?? { count: 0, value: 0 },
		COMPLETED: orderPipelineMap.get("COMPLETED") ?? { count: 0, value: 0 },
		FAILED: orderPipelineMap.get("FAILED") ?? { count: 0, value: 0 },
		PARTIAL: orderPipelineMap.get("PARTIAL") ?? { count: 0, value: 0 },
		totalValue: totalOrderValue,
		conversionPercent:
			ordersAll.length > 0
				? (ordersAll.filter((o) => o.status === "COMPLETED").length /
						ordersAll.length) *
					100
				: 0,
		currency,
	};

	// --- Promo effectiveness ---
	const redeems = await db.query.niscProductPromoRedeem.findMany({
		where: and(
			gte(niscProductPromoRedeem.redeemedAt, from),
			lte(niscProductPromoRedeem.redeemedAt, to),
		),
		with: { promo: { columns: { code: true } } },
	});
	const promoCountMap = new Map<string, number>();
	for (const r of redeems) {
		const code = r.promo?.code ?? "?";
		promoCountMap.set(code, (promoCountMap.get(code) ?? 0) + 1);
	}
	const [ordersWithPromoCountRow] = await db
		.select({ c: count() })
		.from(niscOrder)
		.where(
			and(
				isNotNull(niscOrder.niscProductPromoId),
				gte(niscOrder.createdAt, from),
				lte(niscOrder.createdAt, to),
			),
		);
	const ordersWithPromoCount = Number(ordersWithPromoCountRow?.c ?? 0);
	const ordersWithPromoValue = await db
		.select({ total: niscOrder.total })
		.from(niscOrder)
		.where(
			and(
				isNotNull(niscOrder.niscProductPromoId),
				gte(niscOrder.createdAt, from),
				lte(niscOrder.createdAt, to),
			),
		);
	const revenueWithPromo = ordersWithPromoValue.reduce(
		(s, o) => s + (Number.parseFloat(o.total ?? "0") || 0),
		0,
	);
	const ordersNoPromo = await db
		.select({ total: niscOrder.total })
		.from(niscOrder)
		.where(
			and(
				isNull(niscOrder.niscProductPromoId),
				gte(niscOrder.createdAt, from),
				lte(niscOrder.createdAt, to),
			),
		);
	const revenueWithoutPromo = ordersNoPromo.reduce(
		(s, o) => s + (Number.parseFloat(o.total ?? "0") || 0),
		0,
	);
	const topPromos = Array.from(promoCountMap.entries())
		.map(([promoCode, redemptions]) => ({ promoCode, redemptions }))
		.sort((a, b) => b.redemptions - a.redemptions)
		.slice(0, 5);
	const promoEffectiveness = {
		redemptionsThisPeriod: redeems.length,
		ordersWithPromo: ordersWithPromoCount,
		revenueWithPromo,
		revenueWithoutPromo,
		topPromos,
		currency,
	};

	// --- Margin by category (revenue - cost) ---
	const subsWithCost = await db.query.niscClientSubscription.findMany({
		where: and(
			eq(niscClientSubscription.status, ACTIVE),
			isNull(niscClientSubscription.upgradedToSubscriptionId),
			isNull(niscClientSubscription.downgradedToSubscriptionId),
		),
		columns: {
			agreedPrice: true,
			billingCycle: true,
			pricingModel: true,
			agreedCost: true,
		},
		with: { product: { columns: { category: true } } },
	});
	const marginByCatMap = new Map<
		NiscProductCategory,
		{ revenue: number; cost: number; count: number }
	>();
	for (const sub of subsWithCost) {
		const mrr = monthlyValue(sub.agreedPrice, sub.billingCycle);
		const cost = sub.agreedCost
			? monthlyValue(sub.agreedCost, sub.billingCycle)
			: 0;
		const cat = sub.product.category as NiscProductCategory;
		const e = marginByCatMap.get(cat) ?? { revenue: 0, cost: 0, count: 0 };
		marginByCatMap.set(cat, {
			revenue: e.revenue + mrr,
			cost: e.cost + cost,
			count: e.count + 1,
		});
	}
	const marginByCategory = (["CLOUD", "MARKETING", "CONSULTING", "CUSTOM", "AI"] as const).map(
		(cat) => {
			const e = marginByCatMap.get(cat) ?? {
				revenue: 0,
				cost: 0,
				count: 0,
			};
			const marginPercent =
				e.revenue > 0 ? ((e.revenue - e.cost) / e.revenue) * 100 : 0;
			return {
				category: cat,
				revenue: e.revenue,
				cost: e.cost,
				marginPercent,
				subscriptionCount: e.count,
			};
		},
	);

	// --- Multi-product customers ---
	const productsPerTeam = new Map<string, Set<string>>();
	for (const sub of activeSubs) {
		const tid = sub.teamId ?? "__NO_TEAM__";
		if (!productsPerTeam.has(tid))
			productsPerTeam.set(tid, new Set());
		productsPerTeam.get(tid)!.add(sub.productId);
	}
	let multiProductCount = 0;
	let singleProductCount = 0;
	for (const [, set] of productsPerTeam) {
		if (set.size > 1) multiProductCount += 1;
		else singleProductCount += 1;
	}
	const totalWithSubs = multiProductCount + singleProductCount;
	const multiProductCustomers = {
		multiProductCount,
		singleProductCount,
		totalWithSubs,
		multiProductPercent:
			totalWithSubs > 0 ? (multiProductCount / totalWithSubs) * 100 : 0,
	};

	// --- Top customers trend (MRR this month vs previous) ---
	const teamMrrNow = new Map<string, number>();
	for (const sub of activeSubs) {
		const tid = sub.teamId ?? "__NO_TEAM__";
		let mrr = 0;
		if (sub.pricingModel === FIXED && sub.agreedPrice)
			mrr = monthlyValue(sub.agreedPrice, sub.billingCycle);
		teamMrrNow.set(tid, (teamMrrNow.get(tid) ?? 0) + mrr);
	}
	const teamNames = new Map<string, string>();
	for (const sub of activeSubs) {
		if (sub.teamId && sub.team?.name)
			teamNames.set(sub.teamId, sub.team.name);
	}
	const topTeamsByMrr = Array.from(teamMrrNow.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10);
	const topCustomersTrend = topTeamsByMrr.map(([teamId, mrrCurrent]) => {
		const mrrPrevious = 0; // would need historical snapshot; use 0 for now
		const changeAmount = mrrCurrent - mrrPrevious;
		const changePercent =
			mrrPrevious > 0 ? (changeAmount / mrrPrevious) * 100 : 0;
		return {
			teamId,
			teamName: teamNames.get(teamId) ?? "No company",
			mrrCurrent,
			mrrPrevious,
			changePercent,
			changeAmount,
		};
	});

	// --- At-risk customers (no payment in 90 days but had/has subs) ---
	const cutoff90 = subMonths(now, 3);
	const lastPaymentByTeam = new Map<string, Date>();
	const paidInvoicesForRisk = await db
		.select({ teamId: invoice.teamId, paidAt: invoice.paidAt })
		.from(invoice)
		.where(
			and(
				eq(invoice.status, "PAID"),
				isNotNull(invoice.teamId),
				isNotNull(invoice.paidAt),
			),
		);
	for (const inv of paidInvoicesForRisk) {
		if (!inv.teamId || !inv.paidAt) continue;
		const existing = lastPaymentByTeam.get(inv.teamId);
		if (!existing || inv.paidAt > existing)
			lastPaymentByTeam.set(inv.teamId, inv.paidAt);
	}
	let atRiskCount = 0;
	for (const [tid, lastPaid] of lastPaymentByTeam) {
		if (lastPaid < cutoff90 && teamIdsFromSubs.has(tid)) atRiskCount += 1;
	}
	const atRiskCustomers = {
		count: atRiskCount,
		daysWithoutPayment: 90,
		description: "Teams with active subscriptions but no payment in 90+ days",
	};

	// --- Time comparison: MoM, YoY, annual run rate ---
	const paidThisMonthForCompare = paidThisMonth;
	const paidPrevMonthInvoices = await db
		.select({ amount: invoice.amount })
		.from(invoice)
		.where(
			and(
				eq(invoice.status, "PAID"),
				gte(invoice.paidAt, startOfPrevMonth),
				lte(invoice.paidAt, endOfPrevMonth),
			),
		);
	const paidPrevMonth = paidPrevMonthInvoices.reduce(
		(s, inv) => s + (Number.parseFloat(inv.amount ?? "0") || 0),
		0,
	);
	const sameMonthLastYear = subYears(startOfThisMonth, 1);
	const endSameMonthLastYear = endOfMonth(sameMonthLastYear);
	const paidYoYInvoices = await db
		.select({ amount: invoice.amount })
		.from(invoice)
		.where(
			and(
				eq(invoice.status, "PAID"),
				gte(invoice.paidAt, sameMonthLastYear),
				lte(invoice.paidAt, endSameMonthLastYear),
			),
		);
	const paidYoY = paidYoYInvoices.reduce(
		(s, inv) => s + (Number.parseFloat(inv.amount ?? "0") || 0),
		0,
	);
	const timeComparison = {
		mrrMonthOverMonthPercent: mrrChangePercent,
		paidRevenueMonthOverMonthPercent:
			paidPrevMonth > 0
				? ((paidThisMonthForCompare - paidPrevMonth) / paidPrevMonth) * 100
				: 0,
		paidRevenueYearOverYearPercent:
			paidYoY > 0
				? ((paidThisMonthForCompare - paidYoY) / paidYoY) * 100
				: null,
		annualRunRate: mrrTotal * 12,
		currency,
	};

	return {
		executive: {
			mrr: mrrTotal,
			mrrPreviousMonth: previousMonthMrr,
			mrrChangePercent,
			mrrChangeAmount,
			currency,
		},
		mrrByCategory: (["CLOUD", "MARKETING", "CONSULTING", "CUSTOM", "AI"] as const).map(
			(cat) => {
				const e = mrrByCategoryMap.get(cat) ?? { mrr: 0, count: 0 };
				return {
					category: cat,
					label: CATEGORY_LABELS[cat],
					mrr: e.mrr,
					subscriptionCount: e.count,
				};
			},
		),
		mrrMovement: {
			newMrr,
			lostMrr,
			existingMrr: Math.max(0, mrrTotal - newMrr),
			netChange: mrrChangeAmount,
			currency,
		},
		revenueTrend,
		customer: {
			arpc,
			customerCount,
			currency,
		},
		revenueByTeam,
		commission: {
			commissionSubscriptionCount,
			estimatedFeesAmount,
			currency,
			hasBaseData,
		},
		activeSubscriptions: {
			webHosting,
			emailHosting,
			byCategory,
			totalActive: activeSubs.length,
		},
		domainRenewalRate: {
			renewedCount,
			dueCount,
			ratePercent,
			periodLabel: `${startOfThisMonth.toLocaleDateString("en-CA", { month: "short", year: "numeric" })}`,
		},
		invoicing: {
			invoicedThisMonth,
			paidThisMonth,
			overdueCount: overdueInvoices,
			outstandingAmount,
			currency,
		},
		revenueByProduct,
		revenueByPlan,
		billingMix,
		averageDealSize: { mean, median, currency },
		revenueConcentration,
		churnRate,
		subscriptionTenure,
		upgradesDowngrades,
		autoRenewRate,
		renewalsDue,
		expiringSoon,
		paymentVelocity,
		overdueAging,
		invoiceStatusMix,
		taxAndCredits,
		revenueByPaymentMethod,
		newCustomers,
		newSubscriptionsByProduct,
		orderPipeline,
		promoEffectiveness,
		marginByCategory,
		multiProductCustomers,
		topCustomersTrend,
		atRiskCustomers,
		timeComparison,
	};
}
