/**
 * Migrate WordPress Hosting references from legacy _v1 ids to canonical nisc_wordpress_hosting ids.
 *
 * Run from apps/server:
 *   bun run migrate:wordpress-hosting-product-ids
 *
 * Preview:
 *   DRY_RUN=1 bun run migrate:wordpress-hosting-product-ids
 */
import { count, eq, inArray } from "@npanel/db";
import { db } from "@npanel/db";
import { niscOrderItem } from "@npanel/db/schema/nisc-orders";
import {
	niscClientSubscription,
	niscCommissionEntry,
	niscProductAddOn,
	niscProductPlanUsage,
	niscProductPromo,
} from "@npanel/db/schema/products";
import {
	LEGACY_WORDPRESS_HOSTING_PLAN_IDS,
	LEGACY_WORDPRESS_HOSTING_PRODUCT_ID,
	NISC_WORDPRESS_HOSTING_PLAN_IDS,
	NISC_WORDPRESS_HOSTING_PRODUCT_ID,
} from "@npanel/api/lib/wordpress-hosting-billing";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

const LEGACY_PRODUCT_IDS = [LEGACY_WORDPRESS_HOSTING_PRODUCT_ID];

const PLAN_ID_MAP = new Map<string, string>([
	[LEGACY_WORDPRESS_HOSTING_PLAN_IDS.starter, NISC_WORDPRESS_HOSTING_PLAN_IDS.starter],
	[LEGACY_WORDPRESS_HOSTING_PLAN_IDS.business, NISC_WORDPRESS_HOSTING_PLAN_IDS.business],
	[LEGACY_WORDPRESS_HOSTING_PLAN_IDS.pro, NISC_WORDPRESS_HOSTING_PLAN_IDS.pro],
]);

const LEGACY_PLAN_IDS = [...PLAN_ID_MAP.keys()];

async function main() {
	console.log(DRY_RUN ? "DRY RUN  no writes\n" : "Migrating WordPress Hosting references…\n");

	console.log(`Product: ${LEGACY_WORDPRESS_HOSTING_PRODUCT_ID} → ${NISC_WORDPRESS_HOSTING_PRODUCT_ID}`);
	for (const [legacy, canonical] of PLAN_ID_MAP) {
		console.log(`Plan: ${legacy} → ${canonical}`);
	}

	const counts = {
		subscriptions: Number(
			(
				await db
					.select({ n: count() })
					.from(niscClientSubscription)
					.where(inArray(niscClientSubscription.productId, LEGACY_PRODUCT_IDS))
			)[0]?.n ?? 0,
		),
		orderItems: Number(
			(
				await db
					.select({ n: count() })
					.from(niscOrderItem)
					.where(inArray(niscOrderItem.productId, LEGACY_PRODUCT_IDS))
			)[0]?.n ?? 0,
		),
		subscriptionsByPlan: LEGACY_PLAN_IDS.length
			? Number(
					(
						await db
							.select({ n: count() })
							.from(niscClientSubscription)
							.where(inArray(niscClientSubscription.productPlanId, LEGACY_PLAN_IDS))
					)[0]?.n ?? 0,
				)
			: 0,
		orderItemsByPlan: LEGACY_PLAN_IDS.length
			? Number(
					(
						await db
							.select({ n: count() })
							.from(niscOrderItem)
							.where(inArray(niscOrderItem.productPlanId, LEGACY_PLAN_IDS))
					)[0]?.n ?? 0,
				)
			: 0,
	};

	console.log("\nRows to update:");
	console.log(`  subscriptions (product_id): ${counts.subscriptions}`);
	console.log(`  subscriptions (product_plan_id): ${counts.subscriptionsByPlan}`);
	console.log(`  order items (product_id): ${counts.orderItems}`);
	console.log(`  order items (product_plan_id): ${counts.orderItemsByPlan}`);

	const total =
		counts.subscriptions + counts.orderItems + counts.subscriptionsByPlan + counts.orderItemsByPlan;

	if (total === 0) {
		console.log("\nNo legacy references found.");
		return;
	}

	if (DRY_RUN) {
		console.log(`\nDRY RUN complete. ${total} row update(s) would run.`);
		return;
	}

	const now = new Date();
	let updated = 0;

	for (const legacyProductId of LEGACY_PRODUCT_IDS) {
		const subs = await db
			.update(niscClientSubscription)
			.set({ productId: NISC_WORDPRESS_HOSTING_PRODUCT_ID, updatedAt: now })
			.where(eq(niscClientSubscription.productId, legacyProductId))
			.returning({ id: niscClientSubscription.id });
		updated += subs.length;

		const orders = await db
			.update(niscOrderItem)
			.set({ productId: NISC_WORDPRESS_HOSTING_PRODUCT_ID, updatedAt: now })
			.where(eq(niscOrderItem.productId, legacyProductId))
			.returning({ id: niscOrderItem.id });
		updated += orders.length;

		const promos = await db
			.update(niscProductPromo)
			.set({ productId: NISC_WORDPRESS_HOSTING_PRODUCT_ID, updatedAt: now })
			.where(eq(niscProductPromo.productId, legacyProductId))
			.returning({ id: niscProductPromo.id });
		updated += promos.length;

		const addonsProduct = await db
			.update(niscProductAddOn)
			.set({ productId: NISC_WORDPRESS_HOSTING_PRODUCT_ID, updatedAt: now })
			.where(eq(niscProductAddOn.productId, legacyProductId))
			.returning({ id: niscProductAddOn.id });
		updated += addonsProduct.length;

		const addonsBase = await db
			.update(niscProductAddOn)
			.set({ baseProductId: NISC_WORDPRESS_HOSTING_PRODUCT_ID, updatedAt: now })
			.where(eq(niscProductAddOn.baseProductId, legacyProductId))
			.returning({ id: niscProductAddOn.id });
		updated += addonsBase.length;
	}

	for (const [legacyPlanId, canonicalPlanId] of PLAN_ID_MAP) {
		const subs = await db
			.update(niscClientSubscription)
			.set({ productPlanId: canonicalPlanId, updatedAt: now })
			.where(eq(niscClientSubscription.productPlanId, legacyPlanId))
			.returning({ id: niscClientSubscription.id });
		updated += subs.length;

		const orders = await db
			.update(niscOrderItem)
			.set({ productPlanId: canonicalPlanId, updatedAt: now })
			.where(eq(niscOrderItem.productPlanId, legacyPlanId))
			.returning({ id: niscOrderItem.id });
		updated += orders.length;

		const usage = await db
			.update(niscProductPlanUsage)
			.set({ productPlanId: canonicalPlanId, updatedAt: now })
			.where(eq(niscProductPlanUsage.productPlanId, legacyPlanId))
			.returning({ id: niscProductPlanUsage.id });
		updated += usage.length;

		const promos = await db
			.update(niscProductPromo)
			.set({ productPlanId: canonicalPlanId, updatedAt: now })
			.where(eq(niscProductPromo.productPlanId, legacyPlanId))
			.returning({ id: niscProductPromo.id });
		updated += promos.length;

		const commissions = await db
			.update(niscCommissionEntry)
			.set({ productPlanId: canonicalPlanId, updatedAt: now })
			.where(eq(niscCommissionEntry.productPlanId, legacyPlanId))
			.returning({ id: niscCommissionEntry.id });
		updated += commissions.length;
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
