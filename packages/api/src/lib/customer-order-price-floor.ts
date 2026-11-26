/**
 * Server-side price floor for customer checkouts in nPanel.
 *
 * nPanel's buy-now dialogs send line prices from the browser. Before an order is created from a
 * payment, every line a customer sends is compared with the catalogue (plan price, live domain
 * price, Hivelocity base price or the subscription's agreed renewal price). The order is rejected
 * when the browser total is below the catalogue total. Lines that have no catalogue price (custom
 * services, server upgrades) are reported as unchecked so staff can review them in logs.
 */

import { TRPCError } from "@trpc/server";
import { db, eq, inArray } from "@npanel/db";
import { niscClientSubscription, niscProduct, niscProductPlan } from "@npanel/db/schema/products";
import { parseDomainBundleMetadata } from "./domain-bundle-order";
import { calculateRenewalPrice } from "./subscription-renewal-pricing";
import {
	billingCycleToMonths,
	billingCycleToYears,
	isOneTimePlanCycle,
	resolveDomainRetailPriceKes,
	resolveDomainTransferUpsellPriceKes,
	resolveHivelocityBasePricing,
	resolveNiscPlanQuote,
	type StorefrontBillingCycle,
} from "./storefront-cart-pricing";
import {
	HIVELOCITY_SERVICE_TYPES,
	hivelocityItemMetadataSchema,
} from "../routers/nisc-service-orders-schemas";

const HIVELOCITY_TYPES = new Set<string>(HIVELOCITY_SERVICE_TYPES);
/** Absorbs rounding between the browser and the server (KES whole numbers, 12-month maths). */
const TOLERANCE_RATIO = 0.98;
const TOLERANCE_ABS = 2;
/** Bundles may carry a small multi-domain discount in the browser. */
const BUNDLE_FLOOR_RATIO = 0.9;

type FloorItem = {
	productId: string;
	productPlanId?: string | null;
	billingCycle?: string;
	primaryDomain?: string;
	description?: string;
	itemSubtotal: string;
	itemPrice: string;
	metadata?: Record<string, unknown> | null;
};

export type PriceFloorResult = {
	clientSubtotal: number;
	floorSubtotal: number;
	unchecked: string[];
};

function toStorefrontCycle(cycle: string | undefined): StorefrontBillingCycle {
	switch ((cycle ?? "MONTHLY").toUpperCase()) {
		case "YEARLY":
		case "BIENNIALLY":
		case "TRIENNIALLY":
		case "QUADRENNIALLY":
			return cycle!.toUpperCase() as StorefrontBillingCycle;
		default:
			return "MONTHLY";
	}
}

function planFloor(
	quote: { monthly: number; yearly: number },
	cycle: string | undefined,
	oneTime: boolean,
): number | null {
	if (oneTime) return quote.monthly;
	const months = billingCycleToMonths(cycle ?? "MONTHLY");
	if (!months) return null;
	if (months >= 12 && months % 12 === 0) return quote.yearly * (months / 12);
	return quote.monthly * months;
}

async function floorForItem(
	item: FloorItem,
	serviceType: string,
	planBillingCycle: string | null | undefined,
	label: string,
): Promise<{ floor: number; unchecked?: string }> {
	const meta = item.metadata ?? {};

	// Renewal of an existing subscription: the agreed price on record is the floor.
	const existingSubscriptionId =
		typeof meta.existingSubscriptionId === "string" ? meta.existingSubscriptionId : null;
	if (existingSubscriptionId) {
		const [sub] = await db
			.select({
				agreedPrice: niscClientSubscription.agreedPrice,
				billingCycle: niscClientSubscription.billingCycle,
			})
			.from(niscClientSubscription)
			.where(eq(niscClientSubscription.id, existingSubscriptionId))
			.limit(1);
		const target =
			(typeof meta.renewalBillingCycle === "string" ? meta.renewalBillingCycle : null) ??
			item.billingCycle ??
			sub?.billingCycle ??
			null;
		const price = sub ? Number.parseFloat(calculateRenewalPrice(sub.agreedPrice, sub.billingCycle, target)) : 0;
		if (!Number.isFinite(price) || price <= 0) return { floor: 0, unchecked: `${label}: renewal without agreed price` };
		return { floor: price };
	}

	// Servers: base plan price only. OS and add-ons are not floored.
	if (HIVELOCITY_TYPES.has(serviceType)) {
		const parsed = hivelocityItemMetadataSchema.safeParse(item.metadata);
		if (!parsed.success) return { floor: 0, unchecked: `${label}: server metadata invalid` };
		if (parsed.data.operation !== "provision") {
			return { floor: 0, unchecked: `${label}: server ${parsed.data.operation}` };
		}
		try {
			const base = await resolveHivelocityBasePricing(
				serviceType,
				parsed.data.hivelocityProductId,
				parsed.data.hivelocityLocationName,
			);
			const months = billingCycleToMonths(item.billingCycle ?? "MONTHLY") ?? 1;
			return { floor: base.monthly * months };
		} catch (error) {
			console.warn("[price-floor] Hivelocity base price unavailable:", error);
			return { floor: 0, unchecked: `${label}: server price unavailable` };
		}
	}

	// Domain bundles: one lead line carries the price for every domain.
	const bundle = parseDomainBundleMetadata(item.metadata);
	if (bundle) {
		if (!bundle.isBundleLeadItem) return { floor: 0 };
		try {
			const years = billingCycleToYears(item.billingCycle ?? "YEARLY");
			const prices = await Promise.all(bundle.domains.map((d) => resolveDomainRetailPriceKes(d)));
			return { floor: prices.reduce((sum, p) => sum + p, 0) * years * BUNDLE_FLOOR_RATIO };
		} catch (error) {
			console.warn("[price-floor] Bundle domain price unavailable:", error);
			return { floor: 0, unchecked: `${label}: bundle price unavailable` };
		}
	}

	const isDomainType =
		serviceType === "domains" ||
		serviceType === "domain_registration" ||
		serviceType === "domain_transfer";
	if (isDomainType && item.primaryDomain?.trim()) {
		const description = (item.description ?? "").toLowerCase();
		if (description.includes("renew")) return { floor: 0, unchecked: `${label}: domain renewal` };
		try {
			if (serviceType === "domain_transfer" || description === "transfer") {
				return { floor: await resolveDomainTransferUpsellPriceKes(item.primaryDomain) };
			}
			const years = billingCycleToYears(item.billingCycle ?? "YEARLY");
			return { floor: (await resolveDomainRetailPriceKes(item.primaryDomain)) * years };
		} catch (error) {
			console.warn("[price-floor] Domain price unavailable:", error);
			return { floor: 0, unchecked: `${label}: domain price unavailable` };
		}
	}

	if (item.productPlanId) {
		try {
			const quote = await resolveNiscPlanQuote(item.productPlanId, toStorefrontCycle(item.billingCycle));
			const floor = planFloor(quote, item.billingCycle, isOneTimePlanCycle(planBillingCycle));
			if (floor == null) return { floor: 0, unchecked: `${label}: unsupported billing cycle` };
			return { floor };
		} catch (error) {
			console.warn("[price-floor] Plan price unavailable:", error);
			return { floor: 0, unchecked: `${label}: plan price unavailable` };
		}
	}

	return { floor: 0, unchecked: `${label}: no catalogue price` };
}

/** Throws BAD_REQUEST when the browser-sent subtotal is below the catalogue floor. */
export async function assertCustomerOrderMeetsPriceFloor(
	items: FloorItem[],
	context: { userId: string; checkoutRequestId?: string; beforePayment?: boolean },
): Promise<PriceFloorResult> {
	const productIds = Array.from(new Set(items.map((i) => i.productId)));
	const products = productIds.length
		? await db
				.select({ id: niscProduct.id, serviceType: niscProduct.serviceType, name: niscProduct.name })
				.from(niscProduct)
				.where(inArray(niscProduct.id, productIds))
		: [];
	const productById = new Map(products.map((p) => [p.id, p]));

	const planIds = Array.from(
		new Set(items.map((i) => i.productPlanId).filter((id): id is string => Boolean(id))),
	);
	const planCycles = new Map<string, string | null>();
	if (planIds.length) {
		const rows = await db
			.select({ id: niscProductPlan.id, billingCycle: niscProductPlan.billingCycle })
			.from(niscProductPlan)
			.where(inArray(niscProductPlan.id, planIds));
		for (const row of rows) planCycles.set(row.id, row.billingCycle);
	}

	let floorSubtotal = 0;
	const unchecked: string[] = [];
	const lines: string[] = [];
	for (const item of items) {
		const product = productById.get(item.productId);
		const label = product?.name ?? item.productId;
		const result = await floorForItem(
			item,
			product?.serviceType ?? "",
			item.productPlanId ? planCycles.get(item.productPlanId) : null,
			label,
		);
		floorSubtotal += result.floor;
		if (result.unchecked) unchecked.push(result.unchecked);
		const sent = Number.parseFloat(item.itemSubtotal || item.itemPrice || "0") || 0;
		lines.push(
			`${label} sent=${sent} floor=${Math.round(result.floor)} cycle=${item.billingCycle ?? "-"} domain=${item.primaryDomain ?? "-"}`,
		);
	}

	const clientSubtotal = items.reduce(
		(sum, i) => sum + (Number.parseFloat(i.itemSubtotal || i.itemPrice || "0") || 0),
		0,
	);

	if (unchecked.length) {
		console.warn(
			`[price-floor] user ${context.userId}: ${unchecked.length} line(s) without a catalogue price: ${unchecked.join("; ")}`,
		);
	}

	if (clientSubtotal + TOLERANCE_ABS < floorSubtotal * TOLERANCE_RATIO) {
		console.error(
			`[price-floor] REJECTED user ${context.userId} payment ${context.checkoutRequestId ?? "unknown"}: browser subtotal ${clientSubtotal} below catalogue ${floorSubtotal}. ${lines.join(" | ")}`,
		);
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: context.beforePayment
				? "Prices have changed since this page loaded. Refresh the page and try again. You have not been charged."
				: "We couldn't match this order to our current prices. If the payment already went through, don't pay again. Contact support and we'll complete the order from that payment.",
		});
	}

	return { clientSubtotal, floorSubtotal, unchecked };
}
