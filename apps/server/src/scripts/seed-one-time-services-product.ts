/**
 * Idempotent seed for the catch-all one-time (non-renewable) services product.
 *
 * Run from apps/server:
 *   bun run seed:one-time-services
 */
import { invalidateProductsCache } from "@npanel/api/lib/products-cache";
import { ensureOneTimeServicesProduct } from "@npanel/api/lib/one-time-services";

async function main() {
	console.log("Seeding one-time services product…");
	const id = await ensureOneTimeServicesProduct();
	await invalidateProductsCache();
	console.log(`  ✓ Product ${id}`);
	console.log("Done. Product cache invalidated.");
}

main()
	.catch((err) => {
		console.error("Seed failed:", err);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
