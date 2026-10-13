/**
 * Pull live KRA standard codes into `etims_code`.
 * The agency Codes page and register item sheet only read this table.
 *
 * From apps/server (initialized eTIMS device in that env's database):
 *
 *   bun run etims:sync-codes
 *   bun run etims:sync-codes -- --reset
 *   bun run etims:sync-codes -- --from=20180101000000
 *
 * Production DB (apps/server/.env.production):
 *
 *   bun run etims:sync-codes:prod
 *   bun run etims:sync-codes:prod -- --reset
 *
 * Catalog pull uses classic OSCU (`/selectCodeList`).
 */
import { createEtimsClient } from "@npanel/api/lib/etims-client";
import { buildClientConfigFromEnv, getEtimsContext } from "@npanel/api/lib/etims-config";
import { syncEtimsCodeList } from "@npanel/api/lib/etims-code-store";

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

function codesClient(isSandbox: boolean) {
	const envConfig = buildClientConfigFromEnv(isSandbox);
	return createEtimsClient({
		...envConfig,
		baseUrl: isSandbox ? CLASSIC_SANDBOX_BASE : CLASSIC_PROD_BASE,
		memoryTokenOnly: true,
	});
}

async function main() {
	const reset = hasFlag("reset") || !hasFlag("incremental");
	const lastReqDt = argValue("from");

	if (lastReqDt && !/^\d{14}$/.test(lastReqDt)) {
		throw new Error(`--from must be YYYYMMDDHHmmss, got "${lastReqDt}"`);
	}

	console.log("Connecting to KRA with the initialized eTIMS device…");
	console.log(`Target DB: ${dbTarget()}`);
	const { oscu, isSandbox } = await getEtimsContext();
	const client = codesClient(isSandbox);
	console.log(`TIN ${oscu.tin}  branch ${oscu.bhfId}  ${isSandbox ? "sandbox" : "production"}`);
	console.log(`Catalog host: ${isSandbox ? CLASSIC_SANDBOX_BASE : CLASSIC_PROD_BASE}`);
	if (reset) console.log("Reset: replacing etims_code with this KRA pull.");
	if (lastReqDt) console.log(`Incremental from ${lastReqDt}`);

	const result = await syncEtimsCodeList(client, oscu, {
		reset,
		lastReqDt,
	});

	if (!result.meta || result.totalSynced === 0) {
		throw new Error(
			"KRA returned no standard codes. Check device init, sandbox session, and ETIMS_* env vars.",
		);
	}

	console.log("Done.");
	console.log(`Stored ${result.totalSynced} codes (${result.rowsFetched} rows this run).`);
	console.log("Classes:", result.meta.classCounts.map((c) => `${c.cdCls}:${c.count}`).join(" "));
	console.log(`Last synced at ${result.meta.syncedAt}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		const message = error instanceof Error ? error.message : String(error);
		console.error(message);
		process.exit(1);
	});
