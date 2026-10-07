/**
 * Fetch KRA item catalog and deactivate raw materials (itemTyCd 1 / itemCd type 1).
 * KRA has no item-delete API — this sets useYn=N via saveItem.
 *
 *   bun --no-env-file --env-file=./.env run src/scripts/etims-deactivate-raw-materials.ts
 */
import { createEtimsClient, type EtimsOscuClient, type EtimsOscuHeaders } from "@npanel/api/lib/etims-client";
import { buildClientConfigFromEnv, getEtimsContext } from "@npanel/api/lib/etims-config";

const CLASSIC_SANDBOX_BASE = "https://etims-api-sbx.kra.go.ke/etims-api";
const CLASSIC_PROD_BASE = "https://etims-api.kra.go.ke/etims-api";
const LAST_REQ_DT = "20180101000000";

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value as Record<string, unknown>;
}

function unwrapItemList(root: unknown): Record<string, unknown>[] {
	const r = asRecord(root);
	if (!r) return [];
	const payload =
		asRecord(asRecord(asRecord(r.data)?.responseBody)?.data) ??
		asRecord(r.data) ??
		asRecord(asRecord(r.responseBody)?.data) ??
		r;
	const data = asRecord(payload?.data) ?? payload;
	if (!data) return [];
	const list = data.itemList ?? data.items;
	return Array.isArray(list) ? list.filter((row) => asRecord(row)) as Record<string, unknown>[] : [];
}

function str(row: Record<string, unknown>, ...keys: string[]): string {
	for (const key of keys) {
		const value = row[key];
		if (typeof value === "string" && value.trim()) return value.trim();
		if (typeof value === "number" && Number.isFinite(value)) return String(value);
	}
	return "";
}

function num(row: Record<string, unknown>, key: string, fallback = 0): number {
	const n = Number(row[key] ?? fallback);
	return Number.isFinite(n) ? n : fallback;
}

function isRawMaterial(row: Record<string, unknown>): boolean {
	const type = str(row, "itemTyCd");
	if (type === "1") return true;
	const itemCd = str(row, "itemCd");
	return /^[A-Z]{2}1/.test(itemCd);
}

function typeLabel(row: Record<string, unknown>): string {
	const type = str(row, "itemTyCd");
	if (type === "1") return "raw material";
	if (type === "2") return "finished product";
	if (type === "3") return "service";
	const itemCd = str(row, "itemCd");
	if (/^[A-Z]{2}1/.test(itemCd)) return "raw material";
	if (/^[A-Z]{2}2/.test(itemCd)) return "finished product";
	if (/^[A-Z]{2}3/.test(itemCd)) return "service";
	return type || "unknown";
}

function mergeByItemCd(...lists: Record<string, unknown>[][]): Record<string, unknown>[] {
	const map = new Map<string, Record<string, unknown>>();
	for (const list of lists) {
		for (const row of list) {
			const itemCd = str(row, "itemCd");
			if (!itemCd) continue;
			map.set(itemCd, { ...(map.get(itemCd) ?? {}), ...row });
		}
	}
	return [...map.values()];
}

function deactivatePayload(row: Record<string, unknown>) {
	const itemNm = str(row, "itemNm") || "Item";
	const taxTyCd = str(row, "taxTyCd") === "E" ? "B" : str(row, "taxTyCd") || "B";
	return {
		itemCd: str(row, "itemCd"),
		itemClsCd: str(row, "itemClsCd") || "99000000",
		itemTyCd: str(row, "itemTyCd") || "1",
		itemNm,
		itemStdNm: str(row, "itemStdNm") || itemNm,
		orgnNatCd: str(row, "orgnNatCd") || "KE",
		pkgUnitCd: str(row, "pkgUnitCd") || "NT",
		qtyUnitCd: str(row, "qtyUnitCd") || "BA",
		taxTyCd,
		btchNo: str(row, "btchNo") || undefined,
		bcd: str(row, "bcd") || undefined,
		dftPrc: num(row, "dftPrc"),
		grpPrcL1: num(row, "grpPrcL1"),
		grpPrcL2: num(row, "grpPrcL2"),
		grpPrcL3: num(row, "grpPrcL3"),
		grpPrcL4: num(row, "grpPrcL4"),
		sftyQty: num(row, "sftyQty"),
		isrcAplcbYn: str(row, "isrcAplcbYn") || "N",
		useYn: "N",
		regrId: str(row, "regrId") || "Admin",
		regrNm: str(row, "regrNm") || "Admin",
		modrId: "Admin",
		modrNm: "Admin",
	};
}

function resultOk(result: unknown): boolean {
	const rec = asRecord(result);
	const cd = str(rec ?? {}, "resultCd");
	return !cd || cd === "000" || cd === "001";
}

async function saveOnHost(
	label: string,
	client: EtimsOscuClient,
	oscu: EtimsOscuHeaders,
	payload: Record<string, unknown>,
): Promise<string> {
	try {
		const result = await client.saveItem(oscu, payload);
		if (resultOk(result)) return `${label}: ok`;
		const rec = asRecord(result);
		return `${label}: ${str(rec ?? {}, "resultCd")} ${str(rec ?? {}, "resultMsg")}`;
	} catch (error) {
		return `${label}: ${error instanceof Error ? error.message : String(error)}`;
	}
}

async function fetchList(label: string, client: EtimsOscuClient, oscu: EtimsOscuHeaders) {
	try {
		const result = await client.selectItemList(oscu, LAST_REQ_DT);
		const list = unwrapItemList(result);
		console.log(`${label}: ${list.length} item(s)`);
		return list;
	} catch (error) {
		console.warn(`${label} list failed: ${error instanceof Error ? error.message : String(error)}`);
		return [];
	}
}

async function main() {
	const { client, oscu, isSandbox } = await getEtimsContext();
	const classic = createEtimsClient({
		...buildClientConfigFromEnv(isSandbox),
		baseUrl: isSandbox ? CLASSIC_SANDBOX_BASE : CLASSIC_PROD_BASE,
		memoryTokenOnly: true,
	});

	console.log(`TIN ${oscu.tin}  branch ${oscu.bhfId}  ${isSandbox ? "sandbox" : "production"}`);
	console.log("Fetching KRA item lists…");

	const gavaList = await fetchList("Gava", client, oscu);
	const classicList = await fetchList("Classic", classic, oscu);
	const items = mergeByItemCd(gavaList, classicList);

	const counts = { "raw material": 0, "finished product": 0, service: 0, unknown: 0 } as Record<string, number>;
	for (const item of items) {
		const label = typeLabel(item);
		counts[label] = (counts[label] ?? 0) + 1;
		console.log(`  ${str(item, "itemCd")}  type=${str(item, "itemTyCd") || "?"} (${label})  useYn=${str(item, "useYn") || "Y"}  ${str(item, "itemNm")}`);
	}
	console.log(
		`Totals: ${items.length} unique  raw=${counts["raw material"]}  finished=${counts["finished product"]}  service=${counts.service}  other=${counts.unknown}`,
	);

	const raw = items.filter(isRawMaterial);
	if (raw.length === 0) {
		console.log("No raw materials to deactivate.");
		return;
	}

	console.log(`Deactivating ${raw.length} raw material(s) with useYn=N (KRA has no item-delete API)…`);
	for (const item of raw) {
		const payload = deactivatePayload(item);
		const gava = await saveOnHost("gava", client, oscu, payload);
		const classicResult = await saveOnHost("classic", classic, oscu, payload);
		console.log(`  ${payload.itemCd}  ${gava}  |  ${classicResult}`);
	}
	console.log("Done. Services and finished products were left unchanged.");
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
