/**
 * Persist the known device CU ID onto `etims_configuration`.
 *
 *   bun --no-env-file --env-file=./.env run src/scripts/etims-seed-sdc-id.ts
 *   bun --no-env-file --env-file=./.env.production run src/scripts/etims-seed-sdc-id.ts
 */
import { db, eq } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";

const KNOWN_CU_ID = "KRACU0400001023";

async function main() {
	const [config] = await db.select().from(eTimsConfiguration).limit(1);
	if (!config) {
		throw new Error("No etims_configuration row.");
	}

	console.log("Before:", {
		id: config.id,
		kraPin: config.kraPin,
		branchId: config.branchId,
		isInitialized: config.isInitialized,
		sdcId: config.sdcId,
	});

	await db
		.update(eTimsConfiguration)
		.set({ sdcId: KNOWN_CU_ID, updatedAt: new Date() })
		.where(eq(eTimsConfiguration.id, config.id));

	const [saved] = await db
		.select({
			id: eTimsConfiguration.id,
			sdcId: eTimsConfiguration.sdcId,
		})
		.from(eTimsConfiguration)
		.where(eq(eTimsConfiguration.id, config.id))
		.limit(1);

	console.log("Saved sdcId:", saved?.sdcId);
}

await main();
