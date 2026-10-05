/** Shared KRA OSCU helpers for agency eTIMS forms (service sales/purchases, not stock). */

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
