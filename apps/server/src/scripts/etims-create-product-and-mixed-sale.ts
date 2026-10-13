/**
 * Register a finished product on KRA, set remaining quantity, then send a
 * sale mixing that product with an existing service.
 *
 * From apps/server:
 *   bun run etims:mixed-sale
 */
import { db } from "@npanel/db";
import { eTimsCode, eTimsItem, eTimsItemClassification, eTimsStockMovement } from "@npanel/db/schema/etims";
import { and, desc, eq } from "drizzle-orm";
import {
	getEtimsContext,
	saveTrnsSalesOnKra,
	withClassicOscuFallback,
} from "@npanel/api/lib/etims-config";
import type { EtimsOscuClient, EtimsOscuHeaders } from "@npanel/api/lib/etims-client";

const LAST_REQ_DT = "20180101000000";
const PRODUCT_NAME = "Office Laptop";
const PRODUCT_PRICE_INCL = 11600;
const STOCK_QTY = 10;
const SALE_QTY = 1;
const SERVICE_FALLBACK_INCL = 1160;
const AUDITOR = { regrId: "Admin", regrNm: "Admin", modrId: "Admin", modrNm: "Admin" };

type KraItem = {
	itemCd: string;
	itemClsCd: string;
	itemTyCd: string;
	itemNm: string;
	orgnNatCd: string;
	pkgUnitCd: string;
	qtyUnitCd: string;
	taxTyCd: string;
	dftPrc: number;
	useYn: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value as Record<string, unknown>;
}

function round2(n: number) {
	return Math.round((Number(n) || 0) * 100) / 100;
}

function taxRatePct(taxTyCd: string) {
	if (taxTyCd === "B") return 16;
	if (taxTyCd === "E") return 8;
	return 0;
}

function nairobiParts(d = new Date()) {
	const list = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Africa/Nairobi",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).formatToParts(d);
	const g = (t: string) => list.find((p) => p.type === t)?.value ?? "00";
	const hh = g("hour") === "24" ? "00" : g("hour");
	return { y: g("year"), m: g("month"), d: g("day"), hh, mm: g("minute"), ss: g("second") };
}

function kraDate8() {
	const p = nairobiParts();
	return `${p.y}${p.m}${p.d}`;
}

function kraDateTime14() {
	const p = nairobiParts(new Date(Date.now() - 5 * 60 * 1000));
	return `${p.y}${p.m}${p.d}${p.hh}${p.mm}${p.ss}`;
}

function lineAmounts(inclusiveUnitPrice: number, qty: number, taxTyCd: string) {
	const prc = round2(inclusiveUnitPrice);
	const splyAmt = round2(prc * qty);
	const rate = taxRatePct(taxTyCd) / 100;
	const taxblAmt = rate > 0 ? round2(splyAmt / (1 + rate)) : splyAmt;
	const taxAmt = round2(splyAmt - taxblAmt);
	return { prc, qty, splyAmt, dcRt: 0, dcAmt: 0, taxblAmt, taxAmt, totAmt: splyAmt };
}

function emptyBands() {
	return {
		taxblAmtA: 0, taxblAmtB: 0, taxblAmtC: 0, taxblAmtD: 0, taxblAmtE: 0,
		taxRtA: 0, taxRtB: 16, taxRtC: 0, taxRtD: 0, taxRtE: 8,
		taxAmtA: 0, taxAmtB: 0, taxAmtC: 0, taxAmtD: 0, taxAmtE: 0,
		totTaxblAmt: 0, totTaxAmt: 0, totAmt: 0,
	};
}

function aggregateBands(lines: Array<{ taxTyCd: string; taxblAmt: number; taxAmt: number; totAmt: number }>) {
	const bands = emptyBands();
	for (const line of lines) {
		const key = String(line.taxTyCd || "B").toUpperCase();
		if (key === "A" || key === "B" || key === "C" || key === "D" || key === "E") {
			bands[`taxblAmt${key}` as const] = round2(bands[`taxblAmt${key}` as const] + line.taxblAmt);
			bands[`taxAmt${key}` as const] = round2(bands[`taxAmt${key}` as const] + line.taxAmt);
		}
		bands.totTaxblAmt = round2(bands.totTaxblAmt + line.taxblAmt);
		bands.totTaxAmt = round2(bands.totTaxAmt + line.taxAmt);
		bands.totAmt = round2(bands.totAmt + line.totAmt);
	}
	return bands;
}

function unwrapList(root: unknown, ...keys: string[]): Record<string, unknown>[] {
	const r = asRecord(root);
	if (!r) return [];
	const payload =
		asRecord(asRecord(asRecord(r.data)?.responseBody)?.data)
		?? asRecord(r.data)
		?? asRecord(asRecord(r.responseBody)?.data)
		?? r;
	const data = asRecord(payload?.data) ?? payload;
	if (!data) return [];
	for (const key of keys) {
		const list = data[key];
		if (Array.isArray(list)) return list.filter((row) => asRecord(row)) as Record<string, unknown>[];
	}
	return [];
}

function toItem(row: Record<string, unknown>): KraItem {
	return {
		itemCd: String(row.itemCd ?? "").trim(),
		itemClsCd: String(row.itemClsCd ?? "").trim(),
		itemTyCd: String(row.itemTyCd ?? "").trim(),
		itemNm: String(row.itemNm ?? "").trim(),
		orgnNatCd: String(row.orgnNatCd ?? "KE").trim() || "KE",
		pkgUnitCd: String(row.pkgUnitCd ?? "BX").trim() || "BX",
		qtyUnitCd: String(row.qtyUnitCd ?? "NO").trim() || "NO",
		taxTyCd: String(row.taxTyCd ?? "B").trim() || "B",
		dftPrc: Number(row.dftPrc ?? 0) || 0,
		useYn: String(row.useYn ?? "Y"),
	};
}

function isService(item: KraItem) {
	return item.itemTyCd === "3" || /^[A-Z]{2}3/.test(item.itemCd);
}

function nextItemCd(list: KraItem[], prefix: string) {
	let maxSeq = 0;
	for (const item of list) {
		if (!item.itemCd.startsWith(prefix)) continue;
		const seq = Number.parseInt(item.itemCd.slice(prefix.length), 10);
		if (Number.isFinite(seq)) maxSeq = Math.max(maxSeq, seq);
	}
	return `${prefix}${String(maxSeq + 1).padStart(7, "0")}`;
}

function parseExpectedSeq(message: string): string | null {
	const m = message.match(/ending with[:\s]*\*+(\d+)/i) ?? message.match(/(\d{7})\s*(?:\.|$)/);
	return m?.[1] ?? null;
}

function parseExpectedInvcNo(message: string): number | null {
	const m = message.match(/Expected:\s*(\d+)\s+but\s+found/i);
	return m ? Number(m[1]) : null;
}

function needsStockIoSeed(message: string) {
	return /stock io is empty/i.test(message)
		|| /does not exist in your inventory/i.test(message)
		|| /item management package/i.test(message);
}

async function listItems(client: EtimsOscuClient, oscu: EtimsOscuHeaders, isSandbox: boolean) {
	const result = await withClassicOscuFallback(
		client,
		isSandbox,
		(c) => c.selectItemList(oscu, LAST_REQ_DT),
		"selectItemList",
	);
	return unwrapList(result, "itemList", "items").map(toItem).filter((item) => item.itemCd);
}

async function persistItem(item: KraItem, rsdQty?: number) {
	const now = new Date();
	await db.insert(eTimsItem).values({
		id: crypto.randomUUID(),
		localItemId: null,
		itemCd: item.itemCd,
		itemClsCd: item.itemClsCd,
		itemNm: item.itemNm,
		taxTyCd: item.taxTyCd,
		pkgUnitCd: item.pkgUnitCd,
		unitPrice: String(item.dftPrc),
		originCountryCd: item.orgnNatCd,
		quantityUnit: item.qtyUnitCd,
		packagingUnit: item.pkgUnitCd,
		rsdQty: rsdQty == null ? null : String(rsdQty),
		createdAt: now,
		updatedAt: now,
	}).onConflictDoUpdate({
		target: eTimsItem.itemCd,
		set: {
			itemClsCd: item.itemClsCd,
			itemNm: item.itemNm,
			taxTyCd: item.taxTyCd,
			pkgUnitCd: item.pkgUnitCd,
			unitPrice: String(item.dftPrc),
			originCountryCd: item.orgnNatCd,
			quantityUnit: item.qtyUnitCd,
			packagingUnit: item.pkgUnitCd,
			...(rsdQty == null ? {} : { rsdQty: String(rsdQty) }),
			updatedAt: now,
		},
	});
}

const PKG_PREFERENCE = ["NT", "OU", "NE", "CT", "PK", "BG", "BX"];
const QTY_PREFERENCE = ["NO", "EA", "U", "BA"];

async function activeCodes(cdCls: string): Promise<string[]> {
	const rows = await db.select({ cd: eTimsCode.cd }).from(eTimsCode).where(
		and(eq(eTimsCode.cdCls, cdCls), eq(eTimsCode.useYn, "Y")),
	);
	return rows.map((row) => row.cd.trim().toUpperCase()).filter(Boolean);
}

function preferCode(available: string[], preference: readonly string[], fallback?: string) {
	for (const code of preference) {
		if (available.includes(code)) return code;
	}
	return available[0] ?? fallback;
}

function twoChar(code: string, fallback: string) {
	const unit = code.trim().toUpperCase();
	if (unit.length >= 2) return unit.slice(0, 2);
	if (unit.length === 1) return `${unit}${unit}`;
	return fallback;
}

async function pickGoodsUnits(list: KraItem[]): Promise<{ pkgUnitCd: string; qtyUnitCd: string }> {
	const pkgCodes = await activeCodes("17");
	const qtyCodes = await activeCodes("10");
	const goods = list.filter((item) => item.useYn !== "N" && !isService(item));
	const fromCatalog = goods.find((item) => {
		const pkg = item.pkgUnitCd.trim().toUpperCase();
		const qty = item.qtyUnitCd.trim().toUpperCase();
		return pkg.length >= 2
			&& qty.length >= 2
			&& (pkgCodes.length === 0 || pkgCodes.includes(pkg))
			&& (qtyCodes.length === 0 || qtyCodes.includes(qty) || qtyCodes.includes(qty.slice(0, 2)));
	});
	if (fromCatalog) {
		return {
			pkgUnitCd: twoChar(fromCatalog.pkgUnitCd, "NT"),
			qtyUnitCd: twoChar(fromCatalog.qtyUnitCd, "NO"),
		};
	}
	return {
		pkgUnitCd: twoChar(preferCode(pkgCodes, PKG_PREFERENCE, "NT") ?? "NT", "NT"),
		qtyUnitCd: twoChar(preferCode(qtyCodes, QTY_PREFERENCE, "NO") ?? "NO", "NO"),
	};
}

async function pickClassification(): Promise<{ itemClsCd: string; taxTyCd: string }> {
	const rows = await db.select().from(eTimsItemClassification).orderBy(desc(eTimsItemClassification.itemClsLvl));
	const usable = rows.filter((row) =>
		row.useYn !== "N"
		&& /^\d{8,10}$/.test(row.itemClsCd)
		&& (row.taxTyCd === "B" || !row.taxTyCd)
	);
	const scored = usable
		.map((row) => {
			const name = `${row.itemClsNm} ${row.itemClsCd}`.toLowerCase();
			const score =
				(name.includes("laptop") ? 8 : 0)
				+ (name.includes("computer") ? 6 : 0)
				+ (name.includes("notebook") ? 6 : 0)
				+ (name.includes("electronic") ? 3 : 0)
				+ (row.itemClsCd.length === 10 ? 2 : 0)
				+ (row.taxTyCd === "B" ? 1 : 0);
			return { row, score };
		})
		.sort((a, b) => b.score - a.score || b.row.itemClsCd.length - a.row.itemClsCd.length);
	const hit = scored[0]?.row;
	if (hit) return { itemClsCd: hit.itemClsCd, taxTyCd: hit.taxTyCd === "A" || hit.taxTyCd === "C" || hit.taxTyCd === "D" ? hit.taxTyCd : "B" };
	return { itemClsCd: "4321150308", taxTyCd: "B" };
}

function saveItemBody(item: KraItem) {
	const price = item.dftPrc > 0 ? item.dftPrc : PRODUCT_PRICE_INCL;
	return {
		itemCd: item.itemCd,
		itemClsCd: item.itemClsCd,
		itemTyCd: item.itemTyCd,
		itemNm: item.itemNm,
		itemStdNm: item.itemNm,
		orgnNatCd: item.orgnNatCd,
		pkgUnitCd: item.pkgUnitCd,
		qtyUnitCd: item.qtyUnitCd,
		taxTyCd: item.taxTyCd,
		btchNo: null,
		bcd: null,
		dftPrc: price,
		grpPrcL1: price,
		grpPrcL2: price,
		grpPrcL3: price,
		grpPrcL4: price,
		grpPrcL5: 0,
		addInfo: null,
		sftyQty: 0,
		isrcAplcbYn: "N",
		useYn: "Y",
		...AUDITOR,
	};
}

async function saveItem(
	client: EtimsOscuClient,
	oscu: EtimsOscuHeaders,
	isSandbox: boolean,
	item: KraItem,
) {
	let current = { ...item };
	for (let attempt = 0; attempt < 6; attempt++) {
		try {
			await withClassicOscuFallback(
				client,
				isSandbox,
				(c) => c.saveItem(oscu, saveItemBody(current)),
				"saveItem",
			);
			return current;
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			const expected = parseExpectedSeq(message);
			if (expected && current.itemCd.length >= 7) {
				const nextCd = `${current.itemCd.slice(0, -7)}${expected.padStart(7, "0")}`;
				if (nextCd !== current.itemCd) {
					console.log(`  itemCd rejected → retrying as ${nextCd}`);
					current = { ...current, itemCd: nextCd };
					continue;
				}
			}
			if (/pkgUnitCd/i.test(message) && current.pkgUnitCd !== "NT") {
				const nextPkg = "NT";
				const prefix = `${current.orgnNatCd}${current.itemTyCd}${nextPkg}${current.qtyUnitCd}`;
				const nextCd = `${prefix}${current.itemCd.slice(-7)}`;
				console.log(`  pkgUnitCd ${current.pkgUnitCd} rejected → ${nextPkg} (${nextCd})`);
				current = { ...current, pkgUnitCd: nextPkg, itemCd: nextCd };
				continue;
			}
			throw error;
		}
	}
	throw new Error("Could not allocate a KRA item code");
}

function adjustmentIo(item: KraItem, qty: number) {
	const amts = lineAmounts(item.dftPrc > 0 ? item.dftPrc : PRODUCT_PRICE_INCL, qty, item.taxTyCd);
	return {
		sarNo: 1,
		orgSarNo: 0,
		regTyCd: "M",
		sarTyCd: "06",
		ocrnDt: kraDate8(),
		totItemCnt: 1,
		totTaxblAmt: amts.taxblAmt,
		totTaxAmt: amts.taxAmt,
		totAmt: amts.totAmt,
		remark: "Opening quantity",
		...AUDITOR,
		itemList: [{
			itemSeq: 1,
			itemCd: item.itemCd,
			itemClsCd: item.itemClsCd,
			itemNm: item.itemNm,
			pkgUnitCd: item.pkgUnitCd,
			pkg: 1,
			qtyUnitCd: item.qtyUnitCd,
			qty,
			prc: amts.prc,
			splyAmt: amts.splyAmt,
			totDcAmt: 0,
			taxblAmt: amts.taxblAmt,
			taxTyCd: item.taxTyCd,
			taxAmt: amts.taxAmt,
			totAmt: amts.totAmt,
		}],
	};
}

async function saveStock(
	client: EtimsOscuClient,
	oscu: EtimsOscuHeaders,
	isSandbox: boolean,
	item: KraItem,
	rsdQty: number,
) {
	const saveMaster = (c: EtimsOscuClient) =>
		c.saveStockMaster(oscu, { itemCd: item.itemCd, rsdQty, ...AUDITOR });
	try {
		await withClassicOscuFallback(client, isSandbox, saveMaster, "saveStockMaster");
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		if (!needsStockIoSeed(message)) throw error;
		console.log("  Stock master needs I/O first — seeding adjustment in");
		let body = adjustmentIo(item, Math.max(rsdQty, 1));
		for (let attempt = 0; attempt < 6; attempt++) {
			try {
				await withClassicOscuFallback(
					client,
					isSandbox,
					(c) => c.insertStockIO(oscu, body),
					"insertStockIO",
				);
				await db.insert(eTimsStockMovement).values({
					id: crypto.randomUUID(),
					itemCd: item.itemCd,
					itemNm: item.itemNm,
					sarTyCd: body.sarTyCd,
					sarNo: body.sarNo,
					qty: String(rsdQty),
					ocrnDt: body.ocrnDt,
					remark: body.remark,
					createdAt: new Date(),
				});
				break;
			} catch (ioErr: unknown) {
				const ioMsg = ioErr instanceof Error ? ioErr.message : String(ioErr);
				const expected = parseExpectedInvcNo(ioMsg);
				if (expected != null && expected !== body.sarNo) {
					console.log(`  sarNo ${body.sarNo} rejected → ${expected}`);
					body = { ...body, sarNo: expected };
					continue;
				}
				throw ioErr;
			}
		}
		await withClassicOscuFallback(client, isSandbox, saveMaster, "saveStockMaster");
	}
}

function saleLine(item: KraItem, qty: number, inclusive: number, seq: number) {
	const amts = lineAmounts(inclusive, qty, item.taxTyCd);
	return {
		itemSeq: seq,
		itemCd: item.itemCd,
		itemClsCd: item.itemClsCd,
		itemNm: item.itemNm,
		pkgUnitCd: item.pkgUnitCd,
		pkg: 1,
		qtyUnitCd: item.qtyUnitCd,
		qty: amts.qty,
		prc: amts.prc,
		splyAmt: amts.splyAmt,
		dcRt: 0,
		dcAmt: 0,
		taxTyCd: item.taxTyCd,
		taxblAmt: amts.taxblAmt,
		taxAmt: amts.taxAmt,
		totAmt: amts.totAmt,
	};
}

async function sendMixedSale(
	client: EtimsOscuClient,
	oscu: EtimsOscuHeaders,
	isSandbox: boolean,
	product: KraItem,
	service: KraItem,
) {
	const salesResult = await withClassicOscuFallback(
		client,
		isSandbox,
		(c) => c.selectTrnsSalesList(oscu, LAST_REQ_DT),
		"selectTrnsSalesList",
	);
	const sales = unwrapList(salesResult, "salesList", "saleList", "itemList");
	let invcNo = 1;
	for (const row of sales) {
		const n = Number(row.invcNo);
		if (Number.isFinite(n) && n >= invcNo) invcNo = n + 1;
	}

	const productIncl = product.dftPrc > 0 ? product.dftPrc : PRODUCT_PRICE_INCL;
	const serviceIncl = service.dftPrc > 0 ? service.dftPrc : SERVICE_FALLBACK_INCL;
	const itemList = [
		saleLine(product, SALE_QTY, productIncl, 1),
		saleLine(service, SALE_QTY, serviceIncl, 2),
	];
	const bands = aggregateBands(itemList);
	const salesDt = kraDate8();
	const cfmDt = kraDateTime14();

	for (let attempt = 0; attempt < 6; attempt++) {
		const payload = {
			trdInvcNo: `MIX${Date.now().toString().slice(-10)}`,
			invcNo,
			orgInvcNo: 0,
			custTin: null,
			custNm: null,
			salesTyCd: "N",
			rcptTyCd: "S",
			pmtTyCd: "01",
			salesSttsCd: "02",
			cfmDt,
			salesDt,
			stockRlsDt: cfmDt,
			totItemCnt: itemList.length,
			...bands,
			prchrAcptcYn: "N",
			remark: "Mixed product and service sale",
			...AUDITOR,
			receipt: {
				custTin: null,
				custMblNo: null,
				rcptPbctDt: cfmDt,
				trdeNm: null,
				adrs: null,
				prchrAcptcYn: "N",
			},
			itemList,
		};
		try {
			await saveTrnsSalesOnKra(client, oscu, isSandbox, payload);
			return { invcNo, totAmt: bands.totAmt };
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			const expected = parseExpectedInvcNo(message);
			if (expected && expected !== invcNo) {
				console.log(`  invcNo ${invcNo} rejected → ${expected}`);
				invcNo = expected;
				continue;
			}
			throw error;
		}
	}
	throw new Error("Could not allocate a KRA invoice number");
}

async function main() {
	const { client, oscu, isSandbox } = await getEtimsContext();
	console.log(`TIN ${oscu.tin}  branch ${oscu.bhfId}  ${isSandbox ? "sandbox" : "production"}`);

	let items = await listItems(client, oscu, isSandbox);
	console.log(`KRA catalog: ${items.length} items`);

	const existingProduct = items.find((item) =>
		item.useYn !== "N" && item.itemNm.toLowerCase() === PRODUCT_NAME.toLowerCase() && !isService(item),
	);

	let product: KraItem;
	if (existingProduct) {
		product = existingProduct;
		console.log(`Reusing product ${product.itemCd} (${product.itemNm})`);
	} else {
		const cls = await pickClassification();
		const units = await pickGoodsUnits(items);
		const prefix = `KE2${units.pkgUnitCd}${units.qtyUnitCd}`;
		product = {
			itemCd: nextItemCd(items, prefix),
			itemClsCd: cls.itemClsCd,
			itemTyCd: "2",
			itemNm: PRODUCT_NAME,
			orgnNatCd: "KE",
			pkgUnitCd: units.pkgUnitCd,
			qtyUnitCd: units.qtyUnitCd,
			taxTyCd: cls.taxTyCd,
			dftPrc: PRODUCT_PRICE_INCL,
			useYn: "Y",
		};
		console.log(`Saving product ${product.itemCd} cls=${product.itemClsCd} tax=${product.taxTyCd} pkg=${product.pkgUnitCd} qty=${product.qtyUnitCd}`);
		product = await saveItem(client, oscu, isSandbox, product);
		await persistItem(product);
		items = [...items, product];
		console.log(`Saved product ${product.itemCd}`);
	}

	console.log(`Setting on-hand quantity ${STOCK_QTY} for ${product.itemCd}`);
	await saveStock(client, oscu, isSandbox, product, STOCK_QTY);
	await persistItem(product, STOCK_QTY);
	await db.update(eTimsItem).set({ rsdQty: String(STOCK_QTY), updatedAt: new Date() }).where(eq(eTimsItem.itemCd, product.itemCd));
	console.log("Stock master saved");

	let service = items.find((item) => item.useYn !== "N" && isService(item));
	if (!service) {
		const prefix = "KE3OUNO";
		let created: KraItem = {
			itemCd: nextItemCd(items, prefix),
			itemClsCd: product.itemClsCd,
			itemTyCd: "3",
			itemNm: "IT Support",
			orgnNatCd: "KE",
			pkgUnitCd: "OU",
			qtyUnitCd: "NO",
			taxTyCd: "B",
			dftPrc: SERVICE_FALLBACK_INCL,
			useYn: "Y",
		};
		console.log(`No service on KRA — saving ${created.itemCd}`);
		created = await saveItem(client, oscu, isSandbox, created);
		await persistItem(created);
		service = created;
	}
	console.log(`Mixing with service ${service.itemCd} (${service.itemNm})`);

	const sale = await sendMixedSale(client, oscu, isSandbox, product, service);
	console.log(`Mixed sale sent  invcNo=${sale.invcNo}  total=${sale.totAmt.toFixed(2)} KES`);
	console.log(`Product ${product.itemCd} + service ${service.itemCd}`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
