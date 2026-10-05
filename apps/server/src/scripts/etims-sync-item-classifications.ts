/**
 * Pull live KRA item classification codes into `etims_item_classification`.
 * The agency UI only reads this table — it never calls KRA for classifications.
 *
 * From apps/server (initialized eTIMS device in that env's database):
 *
 *   bun run etims:sync-classifications
 *   bun run etims:sync-classifications -- --reset
 *   bun run etims:sync-classifications -- --from=20180101000000
 *   bun run etims:sync-classifications -- --max-pages=1
 *
 * Production DB (apps/server/.env.production):
 *
 *   bun run etims:sync-classifications:prod
 *   bun run etims:sync-classifications:prod -- --reset
 *   bun run etims:sync-classifications:prod -- --max-pages=1
 *
 * Catalog pull uses classic OSCU (`/selectItemClsList`). Gava Connect
 * `/selectItemClass` NPEs (TestSessionApiLog) when there is no active
 * Automated App Test session. OAuth still uses the Gava token URL from .env.
 */
import { createEtimsClient } from "@npanel/api/lib/etims-client";
import { buildClientConfigFromEnv, getEtimsContext } from "@npanel/api/lib/etims-config";
import { syncAllEtimsItemClassifications, syncEtimsItemClassificationsBatch } from "@npanel/api/lib/etims-item-classification-store";

const CLASSIC_SANDBOX_BASE = "https://etims-api-sbx.kra.go.ke/etims-api";
const CLASSIC_PROD_BASE = "https://etims-api.kra.go.ke/etims-api";

function argValue(name: string): string | undefined {
	const prefix = `--${name}=`;
	const hit = process.argv.find((arg) => arg.startsWith(prefix));
	return hit?.slice(prefix.length);
}

function hasFlag(name: string): boolean {
	return process.argv.includes(`--${name}`);
}

function dbTarget(): string {
	const raw = process.env.DATABASE_URL?.trim();
	if (!raw) return "(DATABASE_URL unset)";
	try {
		const url = new URL(raw.replace(/^postgresql:\/\//, "postgres://"));
		return `${url.host}${url.pathname}`;
	} catch {
		return "(unparseable DATABASE_URL)";
	}
}

function classificationClient(isSandbox: boolean) {
	const envConfig = buildClientConfigFromEnv(isSandbox);
	return createEtimsClient({
		...envConfig,
		baseUrl: isSandbox ? CLASSIC_SANDBOX_BASE : CLASSIC_PROD_BASE,
		memoryTokenOnly: true,
	});
}

async function main() {
	const reset = hasFlag("reset");
	const lastReqDt = argValue("from");
	const sleepMs = Number(argValue("sleep-ms") ?? "200");
	const maxPagesRaw = argValue("max-pages");
	const maxPages = maxPagesRaw ? Number(maxPagesRaw) : undefined;

	if (lastReqDt && !/^\d{14}$/.test(lastReqDt)) {
		throw new Error(`--from must be YYYYMMDDHHmmss, got "${lastReqDt}"`);
	}
	if (maxPages != null && (!Number.isFinite(maxPages) || maxPages < 1)) {
		throw new Error(`--max-pages must be a positive number, got "${maxPagesRaw}"`);
	}

	console.log("Connecting to KRA with the initialized eTIMS device…");
	console.log(`Target DB: ${dbTarget()}`);
	const { oscu, isSandbox } = await getEtimsContext();
	const client = classificationClient(isSandbox);
	console.log(`TIN ${oscu.tin}  branch ${oscu.bhfId}  ${isSandbox ? "sandbox" : "production"}`);
	console.log(`Catalog host: ${isSandbox ? CLASSIC_SANDBOX_BASE : CLASSIC_PROD_BASE}`);
	if (reset) console.log("Reset: truncating etims_item_classification first.");
	if (lastReqDt) console.log(`Incremental from ${lastReqDt}`);
	if (maxPages) console.log(`Limited to ${maxPages} page(s).`);

	const result = maxPages
		? await syncEtimsItemClassificationsBatch(client, oscu, {
			reset,
			lastReqDt,
			maxPages,
		})
		: await syncAllEtimsItemClassifications(client, oscu, {
			reset,
			lastReqDt,
			sleepMs: Number.isFinite(sleepMs) ? sleepMs : 200,
			onProgress: (progress) => {
				console.log(
					`pages=${progress.pagesFetched} fetched=${progress.rowsFetched} stored=${progress.totalSynced} lastReqDt=${progress.nextLastReqDt}${progress.hasMore ? " …" : ""}`,
				);
			},
		});

	if (!result.meta || result.totalSynced === 0) {
		throw new Error(
			"KRA returned no classification codes. Check device init, sandbox session, and ETIMS_* env vars.",
		);
	}

	console.log("Done.");
	console.log(`Stored ${result.totalSynced} codes (${result.pagesFetched} KRA pages, ${result.rowsFetched} rows this run).`);
	console.log("Level counts:", result.meta.levelCounts);
	console.log(`Last synced at ${result.meta.syncedAt}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		const message = error instanceof Error ? error.message : String(error);
		console.error(message);
		process.exit(1);
	});
