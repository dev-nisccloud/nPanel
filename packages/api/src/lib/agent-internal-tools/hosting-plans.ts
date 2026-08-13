/**
 * Hosting plan fetching for Zeepo AI.
 *
 * Fetches web, email, and WordPress hosting plans from the Nisc Cloud product
 * catalogue - the same data powering the customer-facing pricing tables.
 * Results are returned in a shape that chat can render as a pricing card.
 */

import { and, eq, ilike, or } from "@npanel/db";
import { db } from "@npanel/db";
import { niscProduct, niscProductPlan } from "@npanel/db/schema/products";

export interface HostingPlanFeatureRow {
	key: string;
	label: string;
}

export interface HostingPlanEntry {
	id: string;
	name: string;
	niscPrice: string | null;
	niscCurrency: string;
	billingCycle: string;
	isPopular: boolean;
	isRecommended: boolean;
	productId: string;
	productName: string;
	featureValues: Array<{ available: boolean; valueOverride: string | null }>;
}

export type HostingPlansToolName =
	| "get_web_hosting_plans"
	| "get_email_hosting_plans"
	| "get_wordpress_hosting_plans";

export interface HostingPlansResult {
	_tool: HostingPlansToolName;
	productFeatures: HostingPlanFeatureRow[];
	plans: HostingPlanEntry[];
	checkedAt: string;
}

async function fetchHostingPlans(
	toolName: HostingPlansToolName,
	nameFilters: string[],
	serviceType?: string,
): Promise<HostingPlansResult> {
	const nameOr =
		nameFilters.length === 1
			? ilike(niscProduct.name, nameFilters[0]!)
			: or(...nameFilters.map((f) => ilike(niscProduct.name, f)));
	const whereCondition = serviceType
		? and(
				eq(niscProduct.isActive, true),
				or(nameOr, eq(niscProduct.serviceType, serviceType)),
			)
		: and(eq(niscProduct.isActive, true), nameOr);

	const products = await db.query.niscProduct.findMany({
		where: whereCondition,
		orderBy: (p, { asc: a, desc: d }) => [a(p.sortOrder), d(p.createdAt)],
		with: {
			plans: {
				where: and(
					eq(niscProductPlan.isActive, true),
					eq(niscProductPlan.pricingModel, "FIXED"),
				),
				orderBy: (plan, { asc: a }) => [a(plan.sortOrder), a(plan.createdAt)],
			},
		},
	});

	// Build master feature list preserving order from the first product.
	const seenKeys = new Set<string>();
	const productFeatures: HostingPlanFeatureRow[] = [];
	for (const p of products) {
		const features = (p.features as Array<{ key: string; label: string }>) ?? [];
		for (const f of features) {
			if (!seenKeys.has(f.key)) {
				seenKeys.add(f.key);
				productFeatures.push(f);
			}
		}
	}

	const plans: HostingPlanEntry[] = [];
	for (const product of products) {
		for (const plan of (product as any).plans ?? []) {
			const planFeats =
				(plan.planFeatures as Array<{
					key: string;
					available: boolean;
					valueOverride?: string | null;
				}>) ?? [];
			const planFeatsByKey = new Map(planFeats.map((f) => [f.key, f]));

			const featureValues = productFeatures.map((pf) => {
				const entry = planFeatsByKey.get(pf.key);
				return {
					available: !!entry?.available,
					valueOverride:
						entry?.valueOverride != null && entry.valueOverride !== ""
							? String(entry.valueOverride)
							: null,
				};
			});

			plans.push({
				id: plan.id,
				name: plan.name,
				niscPrice: plan.price ?? null,
				niscCurrency: plan.currency ?? "KES",
				billingCycle: plan.billingCycle ?? "MONTHLY",
				isPopular: plan.isPopular ?? false,
				isRecommended: plan.isRecommended ?? false,
				productId: product.id,
				productName: product.name,
				featureValues,
			});
		}
	}

	return {
		_tool: toolName,
		productFeatures,
		plans,
		checkedAt: new Date().toISOString(),
	};
}

/** Fetch web/website hosting plans from the Nisc Cloud catalogue. */
export async function agentGetWebHostingPlans(): Promise<HostingPlansResult> {
	return fetchHostingPlans("get_web_hosting_plans", [
		"%web hosting%",
		"%website hosting%",
	]);
}

/** Fetch email hosting plans from the Nisc Cloud catalogue. */
export async function agentGetEmailHostingPlans(): Promise<HostingPlansResult> {
	return fetchHostingPlans("get_email_hosting_plans", ["%email hosting%"]);
}

/** Fetch WordPress hosting plans from the Nisc Cloud catalogue. */
export async function agentGetWordPressHostingPlans(): Promise<HostingPlansResult> {
	return fetchHostingPlans("get_wordpress_hosting_plans", [
		"%wordpress hosting%",
		"%wordpress managed%",
	], "wordpress_hosting");
}
