/** Shared KRA OSCU helpers for agency eTIMS forms (service sales/purchases, not stock). */

import { format, formatDistanceToNowStrict } from "date-fns";

export const LAST_REQ_DT = "20180101000000";

export const PAYMENT_TYPES = [
	{ code: "01", label: "Cash" },
	{ code: "02", label: "Credit" },
	{ code: "03", label: "Cash/Credit" },
	{ code: "04", label: "Bank cheque" },
	{ code: "05", label: "Debit/Credit card" },
	{ code: "06", label: "Mobile money" },
	{ code: "07", label: "Other" },
] as const;

export const TAX_TYPES = [
	{ code: "A", label: "A — Exempt", rate: 0 },
	{ code: "B", label: "B — 16% VAT", rate: 16 },
	{ code: "C", label: "C — 0%", rate: 0 },
	{ code: "D", label: "D — Non-VAT", rate: 0 },
	{ code: "E", label: "E — 8% VAT", rate: 8 },
] as const;

export type TaxTypeCode = (typeof TAX_TYPES)[number]["code"];

export const ITEM_TYPES = [
	{ code: "1", label: "Raw material" },
	{ code: "2", label: "Finished product" },
	{ code: "3", label: "Service" },
] as const;

/** `/selectCodeList` `cdCls` values from OSCU spec. */
export const KRA_CODE_CLASS = {
	TAX_TYPE: "04",
	COUNTRY: "05",
	PAYMENT: "07",
	QTY_UNIT: "10",
	TXN_STATUS: "11",
	STOCK_IO: "12",
	SALES_TYPE: "14",
	TAXPAYER_STATUS: "15",
	PACKAGING: "17",
	PRODUCT_TYPE: "24",
	IMPORT_STATUS: "26",
	REGISTRATION_TYPE: "31",
	CREDIT_NOTE_REASON: "32",
	CURRENCY: "33",
	SALES_RECEIPT_TYPE: "37",
	PURCHASE_RECEIPT_TYPE: "38",
} as const;

export const KRA_CODE_CLASS_LABEL: Record<string, string> = {
	"04": "Tax types",
	"05": "Countries",
	"07": "Payment",
	"10": "Quantity units",
	"11": "Transaction status",
	"12": "Stock I/O",
	"14": "Sales type",
	"15": "Taxpayer status",
	"17": "Packaging",
	"24": "Product type",
	"26": "Import status",
	"31": "Registration type",
	"32": "Credit note reason",
	"33": "Currency",
	"37": "Sales receipt",
	"38": "Purchase receipt",
};

export type KraCodeOption = { code: string; label: string };

export const PACKAGING_UNITS: KraCodeOption[] = [
	{ code: "AM", label: "Ampoule" },
	{ code: "BA", label: "Barrel" },
	{ code: "BG", label: "Bag" },
	{ code: "BO", label: "Bottle" },
	{ code: "BX", label: "Box" },
	{ code: "CA", label: "Can" },
	{ code: "CR", label: "Crate" },
	{ code: "CT", label: "Carton" },
	{ code: "DR", label: "Drum" },
	{ code: "NE", label: "Unpacked" },
	{ code: "NT", label: "Net" },
	{ code: "OU", label: "Non-exterior" },
	{ code: "PK", label: "Package" },
	{ code: "RO", label: "Roll" },
];

/** Goods default to Box, not Net — `NT` is often unused on live `/selectCodeList` and KRA returns 913. */
export const GOODS_PKG_PREFERENCE = ["BG", "NT", "NE", "OU", "BX", "CT", "PK"] as const;
export const SERVICE_PKG_PREFERENCE = ["OU", "NE", "BX"] as const;
export const GOODS_QTY_PREFERENCE = ["NO", "EA", "KG"] as const;
export const SERVICE_QTY_PREFERENCE = ["NO", "HR", "EA"] as const;

export const QTY_UNITS = [
	{ code: "NO", label: "Number" },
	{ code: "BA", label: "Barrel" },
	{ code: "KG", label: "Kilogram" },
	{ code: "G", label: "Gram" },
	{ code: "L", label: "Litre" },
	{ code: "ML", label: "Millilitre" },
	{ code: "M", label: "Metre" },
	{ code: "M2", label: "Square metre" },
	{ code: "M3", label: "Cubic metre" },
	{ code: "SET", label: "Set" },
	{ code: "DZ", label: "Dozen" },
	{ code: "BX", label: "Box" },
	{ code: "PA", label: "Packet" },
	{ code: "PR", label: "Pair" },
	{ code: "HR", label: "Hour" },
	{ code: "U", label: "Pieces" },
	{ code: "EA", label: "Each" },
] as const;

export const COUNTRY_CODES = [
	{ code: "KE", label: "Kenya" },
	{ code: "UG", label: "Uganda" },
	{ code: "TZ", label: "Tanzania" },
	{ code: "RW", label: "Rwanda" },
	{ code: "CN", label: "China" },
	{ code: "IN", label: "India" },
	{ code: "AE", label: "United Arab Emirates" },
	{ code: "US", label: "United States" },
	{ code: "GB", label: "United Kingdom" },
	{ code: "ZA", label: "South Africa" },
	{ code: "DE", label: "Germany" },
	{ code: "NL", label: "Netherlands" },
] as const;

export const STOCK_IO_TYPES = [
	{ code: "01", label: "Import (in)" },
	{ code: "02", label: "Purchase (in)" },
	{ code: "03", label: "Return (in)" },
	{ code: "04", label: "Stock movement (in)" },
	{ code: "05", label: "Processing (in)" },
	{ code: "06", label: "Adjustment (in)" },
	{ code: "11", label: "Sale (out)" },
	{ code: "12", label: "Return (out)" },
	{ code: "13", label: "Stock movement (out)" },
	{ code: "14", label: "Processing (out)" },
	{ code: "15", label: "Discarding (out)" },
	{ code: "16", label: "Adjustment (out)" },
] as const;

export const IMPORT_ITEM_STATUSES = [
	{ code: "1", label: "Unsent" },
	{ code: "2", label: "Waiting" },
	{ code: "3", label: "Approved" },
	{ code: "4", label: "Cancelled" },
] as const;

export type EtimsTaxpayerRow = {
	tin: string;
	taxprNm: string;
	taxprSttsCd: string;
	locDesc: string;
	sctrNm: string;
	dstrtNm: string;
	prvncNm: string;
	bhfId: string;
	bhfNm: string;
	bsnsActv: string;
	mgrNm: string;
	mgrTelNo: string;
	mgrEmail: string;
};

function strField(rec: Record<string, unknown>, ...keys: string[]): string {
	for (const key of keys) {
		const value = rec[key];
		if (typeof value === "string" && value.trim()) return value.trim();
		if (typeof value === "number" && Number.isFinite(value)) return String(value);
	}
	return "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value as Record<string, unknown>;
}

function collectTaxpayerCandidates(value: unknown, out: Record<string, unknown>[], depth = 0) {
	if (depth > 8 || value == null) return;
	if (Array.isArray(value)) {
		for (const item of value) collectTaxpayerCandidates(item, out, depth + 1);
		return;
	}
	const rec = asRecord(value);
	if (!rec) return;
	if (
		strField(rec, "taxprNm", "taxpayerNm", "custmNm", "custNm", "bhfNm", "locDesc", "prvncNm", "dstrtNm", "sctrNm", "taxprSttsCd", "bsnsActv") ||
		strField(rec, "tin", "custmTin", "custTin")
	) {
		out.push(rec);
	}
	for (const nested of [
		rec.data,
		rec.responseBody,
		rec.info,
		rec.customer,
		rec.custList,
		rec.infoList,
		rec.itemList,
		rec.bhfList,
		rec.branchList,
		rec.taxpayerList,
		rec.taxPayerList,
	]) {
		collectTaxpayerCandidates(nested, out, depth + 1);
	}
}

function taxpayerFromRecord(raw: Record<string, unknown>): EtimsTaxpayerRow {
	return {
		tin: strField(raw, "tin", "custmTin", "custTin", "taxprTin"),
		taxprNm: strField(raw, "taxprNm", "taxpayerNm", "custmNm", "custNm", "bhfNm"),
		taxprSttsCd: strField(raw, "taxprSttsCd", "bhfSttsCd"),
		locDesc: strField(raw, "locDesc", "adrs"),
		sctrNm: strField(raw, "sctrNm"),
		dstrtNm: strField(raw, "dstrtNm"),
		prvncNm: strField(raw, "prvncNm"),
		bhfId: strField(raw, "bhfId"),
		bhfNm: strField(raw, "bhfNm"),
		bsnsActv: strField(raw, "bsnsActv"),
		mgrNm: strField(raw, "mgrNm"),
		mgrTelNo: strField(raw, "mgrTelNo", "telNo"),
		mgrEmail: strField(raw, "mgrEmail", "email"),
	};
}

/** Flatten KRA `/selectTaxpayerInfo`, `/customerPinInfo`, or branch rows into one taxpayer record. */
export function extractTaxpayerRow(root: unknown): EtimsTaxpayerRow {
	const data = unwrapKraData(root);
	const candidates: Record<string, unknown>[] = [];
	collectTaxpayerCandidates(root, candidates);
	collectTaxpayerCandidates(data, candidates);
	const info = asRecord(data.info);
	if (info) candidates.unshift(info);

	const scored = candidates
		.map((rec) => ({
			rec,
			score:
				(strField(rec, "taxprNm", "taxpayerNm", "custmNm", "custNm") ? 8 : 0) +
				(strField(rec, "bhfNm") ? 2 : 0) +
				(strField(rec, "locDesc", "prvncNm", "dstrtNm") ? 1 : 0),
		}))
		.sort((a, b) => b.score - a.score);

	if (scored[0] && scored[0].score > 0) return taxpayerFromRecord(scored[0].rec);
	return taxpayerFromRecord(data);
}

export function unwrapKraData(root: unknown): Record<string, unknown> {
	if (!root || typeof root !== "object") return {};
	const r = root as Record<string, unknown>;
	const payload =
		(nested(r, "data", "responseBody", "data") as Record<string, unknown> | undefined) ??
		(nested(r, "data", "responseBody") as Record<string, unknown> | undefined) ??
		(nested(r, "data") as Record<string, unknown> | undefined) ??
		(nested(r, "responseBody", "data") as Record<string, unknown> | undefined) ??
		r;
	const inner = payload?.data;
	if (inner && typeof inner === "object" && !Array.isArray(inner)) {
		return inner as Record<string, unknown>;
	}
	return payload && typeof payload === "object" ? payload : {};
}

export type EtimsLookupCustomer = {
	tin: string;
	name: string;
	adrs: string;
	telNo: string;
	email: string;
};

export function customerFromLookup(lookupData: unknown): EtimsLookupCustomer | null {
	if (!lookupData || typeof lookupData !== "object") return null;
	const root = lookupData as Record<string, unknown>;
	const rec =
		root.data && typeof root.data === "object" && !Array.isArray(root.data)
			? (root.data as Record<string, unknown>)
			: unwrapKraData(root);
	const name = String(rec.custmNm ?? rec.custNm ?? rec.taxprNm ?? "").trim();
	const tin = String(rec.custmTin ?? rec.custTin ?? rec.tin ?? "").trim();
	if (!name) return null;
	return {
		tin,
		name,
		adrs: String(rec.adrs ?? "").trim(),
		telNo: String(rec.telNo ?? rec.mgrTelNo ?? "").trim(),
		email: String(rec.email ?? rec.mgrEmail ?? "").trim(),
	};
}

function nested(obj: Record<string, unknown>, ...keys: string[]): unknown {
	let cur: unknown = obj;
	for (const key of keys) {
		if (!cur || typeof cur !== "object") return undefined;
		cur = (cur as Record<string, unknown>)[key];
	}
	return cur;
}

export function unwrapKraList(root: unknown, ...keys: string[]): Record<string, unknown>[] {
	const data = unwrapKraData(root);
	for (const key of keys) {
		const value = data[key];
		if (Array.isArray(value)) return value as Record<string, unknown>[];
	}
	if (Array.isArray(root)) return root as Record<string, unknown>[];
	const top = (root as { data?: unknown })?.data;
	if (Array.isArray(top)) return top as Record<string, unknown>[];
	return [];
}

export type KraCodeRow = {
	cdCls: string;
	cdClsNm: string;
	cd: string;
	cdNm: string;
	useYn: string;
};

function listOf(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

/** Flatten `/selectCodeList` `clsList` / `dtllist` into rows. */
export function flattenKraCodeList(root: unknown): KraCodeRow[] {
	const data = unwrapKraData(root);
	const rows: KraCodeRow[] = [];
	for (const cls of listOf(data.clsList)) {
		const c = asRecord(cls);
		if (!c) continue;
		const details = listOf(c.dtllist ?? c.dtlList ?? c.codeList);
		if (details.length === 0 && c.cd) {
			rows.push({
				cdCls: String(c.cdCls ?? "").trim(),
				cdClsNm: String(c.cdClsNm ?? "").trim(),
				cd: String(c.cd ?? "").trim(),
				cdNm: String(c.cdNm ?? "").trim(),
				useYn: c.useYn === "N" ? "N" : "Y",
			});
			continue;
		}
		for (const d of details) {
			const row = asRecord(d);
			if (!row) continue;
			rows.push({
				cdCls: String(c.cdCls ?? row.cdCls ?? "").trim(),
				cdClsNm: String(c.cdClsNm ?? row.cdClsNm ?? "").trim(),
				cd: String(row.cd ?? "").trim(),
				cdNm: String(row.cdNm ?? "").trim(),
				useYn: row.useYn === "N" ? "N" : "Y",
			});
		}
	}
	for (const d of listOf(data.codeList)) {
		const row = asRecord(d);
		if (!row) continue;
		rows.push({
			cdCls: String(row.cdCls ?? "").trim(),
			cdClsNm: String(row.cdClsNm ?? "").trim(),
			cd: String(row.cd ?? "").trim(),
			cdNm: String(row.cdNm ?? "").trim(),
			useYn: row.useYn === "N" ? "N" : "Y",
		});
	}
	return rows;
}

/** Active codes for a class. ItemCd packaging/qty prefixes are 2 characters. */
export function activeKraCodes(rows: KraCodeRow[], cdCls: string, length?: number): KraCodeOption[] {
	const seen = new Set<string>();
	const options: KraCodeOption[] = [];
	for (const row of rows) {
		if (row.cdCls !== cdCls || row.useYn === "N") continue;
		const code = row.cd.trim().toUpperCase();
		if (!code || seen.has(code)) continue;
		if (length != null && code.length !== length) continue;
		seen.add(code);
		options.push({ code, label: row.cdNm.trim() || code });
	}
	return options.sort((a, b) => a.code.localeCompare(b.code));
}

export function preferKraCode(
	options: KraCodeOption[],
	preferred: readonly string[],
	fallback: string,
) {
	for (const code of preferred) {
		if (options.some((row) => row.code === code)) return code;
	}
	return options[0]?.code ?? fallback;
}

export function kraMutationError(res: unknown): string | null {
	const rec = asRecord(res);
	if (!rec) return null;
	if (rec.success === false) return String(rec.errorMessage ?? "Request failed");
	const body = asRecord(rec.data) ?? rec;
	const nestedBody = asRecord(body.responseBody) ?? body;
	const resultCd = String(nestedBody.resultCd ?? body.resultCd ?? "");
	if (resultCd && resultCd !== "000" && resultCd !== "001") {
		return String(nestedBody.resultMsg ?? body.resultMsg ?? "KRA request failed");
	}
	return null;
}

export function kraNowParts(d = new Date()) {
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

export function kraDate8(d = new Date()) {
	const p = kraNowParts(d);
	return `${p.y}${p.m}${p.d}`;
}

export function kraDateTime14(d = new Date()) {
	const p = kraNowParts(d);
	return `${p.y}${p.m}${p.d}${p.hh}${p.mm}${p.ss}`;
}

export function parseKraStamp(value?: string | null): Date | null {
	if (!value) return null;
	const raw = String(value).trim();
	if (!raw) return null;
	if (/^\d{14}$/.test(raw)) {
		const parsed = new Date(
			Number(raw.slice(0, 4)),
			Number(raw.slice(4, 6)) - 1,
			Number(raw.slice(6, 8)),
			Number(raw.slice(8, 10)),
			Number(raw.slice(10, 12)),
			Number(raw.slice(12, 14)),
		);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}
	if (/^\d{8}$/.test(raw)) {
		const parsed = new Date(Number(raw.slice(0, 4)), Number(raw.slice(4, 6)) - 1, Number(raw.slice(6, 8)));
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}
	const parsed = new Date(raw);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** e.g. `1 day ago (06 October 2026, 11:32:05 AM)` */
export function formatKraHumanDateTime(value?: string | null): string {
	const date = parseKraStamp(value);
	if (!date) return "";
	return `${formatDistanceToNowStrict(date, { addSuffix: true })} (${format(date, "dd MMMM yyyy, hh:mm:ss a")})`;
}

export function kraStampMillis(value?: string | null): number {
	return parseKraStamp(value)?.getTime() ?? 0;
}

export function isoDateInNairobi(d = new Date()) {
	const p = kraNowParts(d);
	return `${p.y}-${p.m}-${p.d}`;
}

export function dateInputToKra8(value: string) {
	return value.replaceAll("-", "").slice(0, 8);
}

export function round2(n: number) {
	return Math.round((Number(n) || 0) * 100) / 100;
}

export function taxRatePct(taxTyCd: string) {
	return TAX_TYPES.find((t) => t.code === taxTyCd)?.rate ?? 0;
}

/** KRA `prc` is VAT-inclusive. Returns line amounts matching the cert Postman payload. */
export function lineAmountsFromInclusive(opts: {
	inclusiveUnitPrice: number;
	qty: number;
	taxTyCd: string;
	dcRt?: number;
}) {
	const qty = Number(opts.qty) > 0 ? Number(opts.qty) : 1;
	const prc = round2(opts.inclusiveUnitPrice);
	const splyAmt = round2(prc * qty);
	const dcRt = Number(opts.dcRt) || 0;
	const dcAmt = round2(splyAmt * (dcRt / 100));
	const netInclusive = round2(splyAmt - dcAmt);
	const rate = taxRatePct(opts.taxTyCd) / 100;
	const taxblAmt = rate > 0 ? round2(netInclusive / (1 + rate)) : netInclusive;
	const taxAmt = round2(netInclusive - taxblAmt);
	return {
		prc,
		qty,
		splyAmt,
		dcRt,
		dcAmt,
		taxblAmt,
		taxAmt,
		totAmt: netInclusive,
	};
}

export function emptyTaxBands() {
	return {
		taxblAmtA: 0,
		taxblAmtB: 0,
		taxblAmtC: 0,
		taxblAmtD: 0,
		taxblAmtE: 0,
		taxRtA: 0,
		taxRtB: 16,
		taxRtC: 0,
		taxRtD: 0,
		taxRtE: 8,
		taxAmtA: 0,
		taxAmtB: 0,
		taxAmtC: 0,
		taxAmtD: 0,
		taxAmtE: 0,
		totTaxblAmt: 0,
		totTaxAmt: 0,
		totAmt: 0,
	};
}

export function aggregateTaxBands(
	lines: Array<{ taxTyCd: string; taxblAmt: number; taxAmt: number; totAmt: number }>,
) {
	const bands = emptyTaxBands();
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

export function nextInvcNo(list: Array<{ invcNo?: unknown }>, fallback = 1) {
	let max = 0;
	for (const row of list) {
		const n = Number(row.invcNo);
		if (Number.isFinite(n) && n > max) max = n;
	}
	return max > 0 ? max + 1 : fallback;
}

export function parseExpectedInvcNo(message: string | null | undefined): number | null {
	if (!message) return null;
	const m = message.match(/Expected:\s*(\d+)\s+but\s+found/i);
	return m ? Number(m[1]) : null;
}

export function kraResultError(res: unknown): string | null {
	if (!res || typeof res !== "object") return null;
	const r = res as Record<string, unknown>;
	if (r.success === false) return String(r.errorMessage ?? "KRA request failed");
	const body = (r.data as Record<string, unknown> | undefined)?.responseBody ?? r.data ?? r;
	const rec = body as Record<string, unknown>;
	if (typeof rec.resultCd === "string" && rec.resultCd !== "000" && rec.resultCd !== "001") {
		return String(rec.resultMsg ?? `KRA ${rec.resultCd}`);
	}
	return null;
}

export const AUDITOR = {
	regrId: "Admin",
	regrNm: "Admin",
	modrId: "Admin",
	modrNm: "Admin",
} as const;
