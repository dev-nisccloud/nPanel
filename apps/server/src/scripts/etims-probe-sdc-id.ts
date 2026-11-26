/**
 * Probe KRA initialize for the device CU ID (`sdcId`) and persist it.
 *
 *   bun --no-env-file --env-file=./.env run src/scripts/etims-probe-sdc-id.ts
 */
import { db, eq } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";
import { EtimsApiError } from "@npanel/api/lib/etims-client";
import {
	buildClientConfigFromEnv,
	createClassicOscuClient,
	getEtimsClient,
} from "@npanel/api/lib/etims-config";
import { extractSdcIdFromKraBody } from "@npanel/api/lib/etims-scu-print";

const KNOWN_CU_ID = "KRACU0400001023";

function summarize(raw: unknown): unknown {
	if (!raw || typeof raw !== "object") return raw;
	const rec = raw as Record<string, unknown>;
	const keys = Object.keys(rec);
	return {
		keys,
		resultCd: rec.resultCd ?? rec.resultCode,
		resultMsg: rec.resultMsg ?? rec.resultMessage,
		sdcId: extractSdcIdFromKraBody(raw),
		data: rec.data ?? rec.responseBody ?? null,
	};
}

async function probe(
	label: string,
	run: () => Promise<unknown>,
): Promise<{ label: string; sdcId: string | null; error?: string; summary: unknown }> {
	try {
		const result = await run();
		return { label, sdcId: extractSdcIdFromKraBody(result), summary: summarize(result) };
	} catch (error) {
		const response = error instanceof EtimsApiError ? error.response : null;
		return {
			label,
			sdcId: response ? extractSdcIdFromKraBody(response) : null,
			error: error instanceof Error ? error.message : String(error),
			summary: response ? summarize(response) : null,
		};
	}
}

async function main() {
	const [config] = await db.select().from(eTimsConfiguration).limit(1);
	if (!config) {
		throw new Error("No etims_configuration row.");
	}

	console.log("Stored config:", {
		id: config.id,
		kraPin: config.kraPin,
		branchId: config.branchId,
		deviceSerialNumber: config.deviceSerialNumber,
		isSandbox: config.isSandbox,
		isInitialized: config.isInitialized,
		sdcId: config.sdcId,
	});

	const payload = {
		tin: config.kraPin,
		bhfId: config.branchId,
		dvcSrlNo: config.deviceSerialNumber,
	};

	const gava = getEtimsClient(buildClientConfigFromEnv(config.isSandbox));
	const classic = createClassicOscuClient(config.isSandbox);

	const gavaHit = await probe("gava-initialize", () => gava.selectInitOsdcInfo(payload));
	const classicHit = await probe("classic-initialize", () => classic.selectInitOsdcInfo(payload));

	console.log("Gava initialize:", JSON.stringify(gavaHit, null, 2));
	console.log("Classic initialize:", JSON.stringify(classicHit, null, 2));

	const fromKra = gavaHit.sdcId || classicHit.sdcId || null;
	const sdcId = fromKra || KNOWN_CU_ID;
	if (fromKra && fromKra !== KNOWN_CU_ID) {
		console.warn(`KRA sdcId ${fromKra} differs from known CU ID ${KNOWN_CU_ID}`);
	}
	if (!fromKra) {
		console.warn(`KRA did not return sdcId. Saving known CU ID ${KNOWN_CU_ID}`);
	}

	await db
		.update(eTimsConfiguration)
		.set({ sdcId, updatedAt: new Date() })
		.where(eq(eTimsConfiguration.id, config.id));

	const [saved] = await db
		.select({ sdcId: eTimsConfiguration.sdcId })
		.from(eTimsConfiguration)
		.where(eq(eTimsConfiguration.id, config.id))
		.limit(1);

	console.log("Saved sdcId:", saved?.sdcId);
}

await main();
