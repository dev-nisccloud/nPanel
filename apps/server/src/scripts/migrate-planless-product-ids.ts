/**
 * Migrate references from legacy planless product ids to canonical nisc-* ids.
 *
 * Updates:
 *   - nisc_client_subscription.product_id
 *   - nisc_order_item.product_id
 *   - nisc_product_add_on.product_id / base_product_id
 *   - nisc_product_promo.product_id
 *
 * Safe to re-run: rows already on canonical ids are skipped.
 *
 * Run from apps/server:
 *   bun run migrate:planless-product-ids
 *
 * Preview only:
 *   DRY_RUN=1 bun run migrate:planless-product-ids
 */
import { count, eq, inArray } from "@npanel/db";
import { db } from "@npanel/db";
import { niscOrderItem } from "@npanel/db/schema/nisc-orders";
import {
	niscClientSubscription,
	niscProduct,
	niscProductAddOn,
	niscProductPromo,
} from "@npanel/db/schema/products";
import {
	getPlanlessLegacyToCanonicalIdMap,
	listPlanlessLegacyProductMigrationTargets,
} from "@npanel/api/lib/planless-product-resolver";
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

type TableUpdate = {
	label: string;
	count: (legacyIds: string[]) => Promise<number>;
	update: (legacyId: string, canonicalId: string, now: Date) => Promise<number>;
};

const TABLE_UPDATES: TableUpdate[] = [
	{
		label: "nisc_client_subscription.product_id",
		count: async (legacyIds) => {
			const [row] = await db
				.select({ n: count() })
				.from(niscClientSubscription)
				.where(inArray(niscClientSubscription.productId, legacyIds));
			return Number(row?.n ?? 0);
		},
		update: async (legacyId, canonicalId, now) => {
			const rows = await db
				.update(niscClientSubscription)
				.set({ productId: canonicalId, updatedAt: now })
				.where(eq(niscClientSubscription.productId, legacyId))
				.returning({ id: niscClientSubscription.id });
			return rows.length;
		},
	},
	{
		label: "nisc_order_item.product_id",
		count: async (legacyIds) => {
			const [row] = await db
				.select({ n: count() })
				.from(niscOrderItem)
				.where(inArray(niscOrderItem.productId, legacyIds));
			return Number(row?.n ?? 0);
		},
		update: async (legacyId, canonicalId, now) => {
			const rows = await db
				.update(niscOrderItem)
				.set({ productId: canonicalId, updatedAt: now })
				.where(eq(niscOrderItem.productId, legacyId))
				.returning({ id: niscOrderItem.id });
			return rows.length;
		},
	},
	{
		label: "nisc_product_add_on.product_id",
		count: async (legacyIds) => {
			const [row] = await db
				.select({ n: count() })
				.from(niscProductAddOn)
				.where(inArray(niscProductAddOn.productId, legacyIds));
			return Number(row?.n ?? 0);
		},
		update: async (legacyId, canonicalId, now) => {
			const rows = await db
				.update(niscProductAddOn)
				.set({ productId: canonicalId, updatedAt: now })
				.where(eq(niscProductAddOn.productId, legacyId))
				.returning({ id: niscProductAddOn.id });
			return rows.length;
		},
	},
	{
		label: "nisc_product_add_on.base_product_id",
		count: async (legacyIds) => {
			const [row] = await db
				.select({ n: count() })
				.from(niscProductAddOn)
				.where(inArray(niscProductAddOn.baseProductId, legacyIds));
			return Number(row?.n ?? 0);
		},
		update: async (legacyId, canonicalId, now) => {
			const rows = await db
				.update(niscProductAddOn)
				.set({ baseProductId: canonicalId, updatedAt: now })
				.where(eq(niscProductAddOn.baseProductId, legacyId))
				.returning({ id: niscProductAddOn.id });
			return rows.length;
		},
	},
	{
		label: "nisc_product_promo.product_id",
		count: async (legacyIds) => {
			const [row] = await db
				.select({ n: count() })
				.from(niscProductPromo)
				.where(inArray(niscProductPromo.productId, legacyIds));
			return Number(row?.n ?? 0);
		},
		update: async (legacyId, canonicalId, now) => {
			const rows = await db
				.update(niscProductPromo)
				.set({ productId: canonicalId, updatedAt: now })
				.where(eq(niscProductPromo.productId, legacyId))
				.returning({ id: niscProductPromo.id });
			return rows.length;
		},
	},
];

async function main() {
	console.log(DRY_RUN ? "DRY RUN  no writes\n" : "Migrating planless product references…\n");

	const targets = await listPlanlessLegacyProductMigrationTargets();
	const idMap = await getPlanlessLegacyToCanonicalIdMap();
	const legacyIds = [...idMap.keys()];

	if (legacyIds.length === 0) {
		console.log("No legacy planless products found. Nothing to migrate.");
		for (const target of targets) {
			const [canonical] = await db
				.select({ id: niscProduct.id, isActive: niscProduct.isActive })
				.from(niscProduct)
				.where(eq(niscProduct.id, target.canonicalId))
				.limit(1);
			console.log(
				`  ${target.canonicalName} (${target.canonicalId}): ${
					canonical ? (canonical.isActive ? "active" : "inactive") : "missing"
				}`,
			);
		}
		return;
	}

	console.log("Legacy → canonical mappings:");
	for (const target of targets) {
		console.log(
			`\n${target.canonicalName} → ${target.canonicalId} (${target.canonicalActive ? "active" : "inactive"})`,
		);
		if (target.legacyProducts.length === 0) {
			console.log("  (no legacy products matched)");
			continue;
		}
		for (const legacy of target.legacyProducts) {
			console.log(
				`  ${legacy.id}  "${legacy.name}"  [${legacy.serviceType}]  ${legacy.isActive ? "active" : "inactive"}`,
			);
		}
	}

	console.log("\nRows to update:");
	let totalPending = 0;
	for (const table of TABLE_UPDATES) {
		const n = await table.count(legacyIds);
		totalPending += n;
		console.log(`  ${table.label}: ${n}`);
	}

	if (totalPending === 0) {
		console.log("\nNo referencing rows use legacy ids. Done.");
		return;
	}

	if (DRY_RUN) {
		console.log(`\nDRY RUN complete. ${totalPending} row(s) would be updated.`);
		return;
	}

	const now = new Date();
	let totalUpdated = 0;

	for (const [legacyId, canonicalId] of idMap) {
		console.log(`\n${legacyId} → ${canonicalId}`);
		for (const table of TABLE_UPDATES) {
			const updated = await table.update(legacyId, canonicalId, now);
			if (updated > 0) {
				console.log(`  ✓ ${table.label}: ${updated}`);
				totalUpdated += updated;
			}
		}
	}

	await invalidateProductsCache();
	console.log(`\nDone. Updated ${totalUpdated} row(s). Product cache invalidated.`);
}

main()
	.catch((err) => {
		console.error("Migration failed:", err);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
