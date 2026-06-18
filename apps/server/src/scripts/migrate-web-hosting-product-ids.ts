/**
 * Migrate references from legacy Website Hosting product/plans to canonical nisc-* ids.
 *
 * Run from apps/server:
 *   bun run migrate:web-hosting-product-ids
 *
 * Preview:
 *   DRY_RUN=1 bun run migrate:web-hosting-product-ids
 */
import { and, count, eq, ilike, inArray, ne, or } from "@npanel/db";
import { db } from "@npanel/db";
import { niscOrderItem } from "@npanel/db/schema/nisc-orders";
import {
	niscClientSubscription,
	niscCommissionEntry,
	niscProduct,
	niscProductAddOn,
	niscProductPlan,
	niscProductPlanUsage,
	niscProductPromo,
} from "@npanel/db/schema/products";
import {
	NISC_WEB_HOSTING_PLAN_IDS,
	NISC_WEB_HOSTING_PRODUCT_ID,
} from "@npanel/api/lib/web-hosting-billing";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

const CANONICAL_PLAN_BY_NAME: Record<string, string> = {
	starter: NISC_WEB_HOSTING_PLAN_IDS.starter,
	basic: NISC_WEB_HOSTING_PLAN_IDS.basic,
	deluxe: NISC_WEB_HOSTING_PLAN_IDS.deluxe,
	ultimate: NISC_WEB_HOSTING_PLAN_IDS.ultimate,
};

function webHostingProductMatch() {
	return or(
		ilike(niscProduct.name, "%web hosting%"),
		ilike(niscProduct.name, "%website hosting%"),
		eq(niscProduct.serviceType, "web_hosting"),
	);
}

function normalizePlanName(name: string): string {
	return name.trim().toLowerCase();
}

async function buildLegacyPlanIdMap(): Promise<Map<string, string>> {
	const legacyProducts = await db
		.select({ id: niscProduct.id })
		.from(niscProduct)
		.where(and(ne(niscProduct.id, NISC_WEB_HOSTING_PRODUCT_ID), webHostingProductMatch()));

	const legacyProductIds = legacyProducts.map((p) => p.id);
	if (legacyProductIds.length === 0) return new Map();

	const legacyPlans = await db
		.select({ id: niscProductPlan.id, name: niscProductPlan.name })
		.from(niscProductPlan)
		.where(inArray(niscProductPlan.productId, legacyProductIds));

	const map = new Map<string, string>();
	for (const plan of legacyPlans) {
		const canonicalPlanId = CANONICAL_PLAN_BY_NAME[normalizePlanName(plan.name)];
		if (canonicalPlanId) {
			map.set(plan.id, canonicalPlanId);
		} else {
			console.warn(`  ! No canonical plan for legacy plan "${plan.name}" (${plan.id})`);
		}
	}
	return map;
}

async function main() {
	console.log(DRY_RUN ? "DRY RUN — no writes\n" : "Migrating Website Hosting references…\n");

	const legacyProducts = await db
		.select({ id: niscProduct.id, name: niscProduct.name, isActive: niscProduct.isActive })
		.from(niscProduct)
		.where(and(ne(niscProduct.id, NISC_WEB_HOSTING_PRODUCT_ID), webHostingProductMatch()));

	if (legacyProducts.length === 0) {
		console.log("No legacy Website Hosting products found.");
		return;
	}

	const legacyProductIds = legacyProducts.map((p) => p.id);
	const planIdMap = await buildLegacyPlanIdMap();
	const legacyPlanIds = [...planIdMap.keys()];

	console.log(`Canonical product: ${NISC_WEB_HOSTING_PRODUCT_ID}`);
	console.log("Legacy products:");
	for (const p of legacyProducts) {
		console.log(`  ${p.id}  "${p.name}"  ${p.isActive ? "active" : "inactive"}`);
	}
	if (planIdMap.size > 0) {
		console.log("\nPlan mappings:");
		for (const [legacyId, canonicalId] of planIdMap) {
			console.log(`  ${legacyId} → ${canonicalId}`);
		}
	}

	const counts = {
		subscriptions: Number(
			(
				await db
					.select({ n: count() })
					.from(niscClientSubscription)
					.where(inArray(niscClientSubscription.productId, legacyProductIds))
			)[0]?.n ?? 0,
		),
		orderItems: Number(
			(
				await db
					.select({ n: count() })
					.from(niscOrderItem)
					.where(inArray(niscOrderItem.productId, legacyProductIds))
			)[0]?.n ?? 0,
		),
		orderItemsByPlan: legacyPlanIds.length
			? Number(
					(
						await db
							.select({ n: count() })
							.from(niscOrderItem)
							.where(inArray(niscOrderItem.productPlanId, legacyPlanIds))
					)[0]?.n ?? 0,
				)
			: 0,
		subscriptionsByPlan: legacyPlanIds.length
			? Number(
					(
						await db
							.select({ n: count() })
							.from(niscClientSubscription)
							.where(inArray(niscClientSubscription.productPlanId, legacyPlanIds))
					)[0]?.n ?? 0,
				)
			: 0,
		planUsage: legacyPlanIds.length
			? Number(
					(
						await db
							.select({ n: count() })
							.from(niscProductPlanUsage)
							.where(inArray(niscProductPlanUsage.productPlanId, legacyPlanIds))
					)[0]?.n ?? 0,
				)
			: 0,
		promos: Number(
			(
				await db
					.select({ n: count() })
					.from(niscProductPromo)
					.where(inArray(niscProductPromo.productId, legacyProductIds))
			)[0]?.n ?? 0,
		),
		commissions: legacyPlanIds.length
			? Number(
					(
						await db
							.select({ n: count() })
							.from(niscCommissionEntry)
							.where(inArray(niscCommissionEntry.productPlanId, legacyPlanIds))
					)[0]?.n ?? 0,
				)
			: 0,
	};

	console.log("\nRows to update:");
	console.log(`  subscriptions (product_id): ${counts.subscriptions}`);
	console.log(`  subscriptions (product_plan_id): ${counts.subscriptionsByPlan}`);
	console.log(`  order items (product_id): ${counts.orderItems}`);
	console.log(`  order items (product_plan_id): ${counts.orderItemsByPlan}`);
	console.log(`  plan usage (product_plan_id): ${counts.planUsage}`);
	console.log(`  promos (product_id): ${counts.promos}`);
	console.log(`  commission entries (product_plan_id): ${counts.commissions}`);

	const total =
		counts.subscriptions +
		counts.orderItems +
		counts.orderItemsByPlan +
		counts.subscriptionsByPlan +
		counts.planUsage +
		counts.promos +
		counts.commissions;

	if (total === 0) {
		console.log("\nNo referencing rows on legacy ids.");
		return;
	}

	if (DRY_RUN) {
		console.log(`\nDRY RUN complete. ${total} row update(s) would run.`);
		return;
	}

	const now = new Date();
	let updated = 0;

	for (const legacyProductId of legacyProductIds) {
		const subs = await db
			.update(niscClientSubscription)
			.set({ productId: NISC_WEB_HOSTING_PRODUCT_ID, updatedAt: now })
			.where(eq(niscClientSubscription.productId, legacyProductId))
			.returning({ id: niscClientSubscription.id });
		if (subs.length) {
			console.log(`  ✓ subscriptions product_id (${legacyProductId}): ${subs.length}`);
			updated += subs.length;
		}

		const orders = await db
			.update(niscOrderItem)
			.set({ productId: NISC_WEB_HOSTING_PRODUCT_ID, updatedAt: now })
			.where(eq(niscOrderItem.productId, legacyProductId))
			.returning({ id: niscOrderItem.id });
		if (orders.length) {
			console.log(`  ✓ order items product_id (${legacyProductId}): ${orders.length}`);
			updated += orders.length;
		}

		const promos = await db
			.update(niscProductPromo)
			.set({ productId: NISC_WEB_HOSTING_PRODUCT_ID, updatedAt: now })
			.where(eq(niscProductPromo.productId, legacyProductId))
			.returning({ id: niscProductPromo.id });
		if (promos.length) {
			console.log(`  ✓ promos product_id (${legacyProductId}): ${promos.length}`);
			updated += promos.length;
		}

		const addonsProduct = await db
			.update(niscProductAddOn)
			.set({ productId: NISC_WEB_HOSTING_PRODUCT_ID, updatedAt: now })
			.where(eq(niscProductAddOn.productId, legacyProductId))
			.returning({ id: niscProductAddOn.id });
		if (addonsProduct.length) updated += addonsProduct.length;

		const addonsBase = await db
			.update(niscProductAddOn)
			.set({ baseProductId: NISC_WEB_HOSTING_PRODUCT_ID, updatedAt: now })
			.where(eq(niscProductAddOn.baseProductId, legacyProductId))
			.returning({ id: niscProductAddOn.id });
		if (addonsBase.length) updated += addonsBase.length;
	}

	for (const [legacyPlanId, canonicalPlanId] of planIdMap) {
		const subs = await db
			.update(niscClientSubscription)
			.set({ productPlanId: canonicalPlanId, updatedAt: now })
			.where(eq(niscClientSubscription.productPlanId, legacyPlanId))
			.returning({ id: niscClientSubscription.id });
		if (subs.length) {
			console.log(`  ✓ subscriptions plan ${legacyPlanId}: ${subs.length}`);
			updated += subs.length;
		}

		const orders = await db
			.update(niscOrderItem)
			.set({ productPlanId: canonicalPlanId, updatedAt: now })
			.where(eq(niscOrderItem.productPlanId, legacyPlanId))
			.returning({ id: niscOrderItem.id });
		if (orders.length) {
			console.log(`  ✓ order items plan ${legacyPlanId}: ${orders.length}`);
			updated += orders.length;
		}

		const usage = await db
			.update(niscProductPlanUsage)
			.set({ productPlanId: canonicalPlanId, updatedAt: now })
			.where(eq(niscProductPlanUsage.productPlanId, legacyPlanId))
			.returning({ id: niscProductPlanUsage.id });
		if (usage.length) updated += usage.length;

		const promos = await db
			.update(niscProductPromo)
			.set({ productPlanId: canonicalPlanId, updatedAt: now })
			.where(eq(niscProductPromo.productPlanId, legacyPlanId))
			.returning({ id: niscProductPromo.id });
		if (promos.length) updated += promos.length;

		const commissions = await db
			.update(niscCommissionEntry)
			.set({ productPlanId: canonicalPlanId, updatedAt: now })
			.where(eq(niscCommissionEntry.productPlanId, legacyPlanId))
			.returning({ id: niscCommissionEntry.id });
		if (commissions.length) updated += commissions.length;
	}

	await invalidateProductsCache();
	console.log(`\nDone. Updated ${updated} row(s). Product cache invalidated.`);
}

main()
	.catch((err) => {
		console.error("Migration failed:", err);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
