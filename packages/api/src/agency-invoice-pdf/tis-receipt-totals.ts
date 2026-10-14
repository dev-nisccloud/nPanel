/** TIS v2.0 receipt money block (tax invoice sample p.8 / credit note p.9). */

export type TisTaxBand = "A" | "B" | "C" | "D" | "E";

export type TisTaxTableRow = {
	band: TisTaxBand;
	rateLabel: string;
	rate: number;
	taxable: number;
	vat: number;
};

export type TisReceiptTotals = {
	totalBeforeDiscount: number;
	discountAwarded: number;
	subTotal: number;
	vat: number;
	total: number;
	itemCount: number;
	taxTable: TisTaxTableRow[];
};

const TIS_TAX_BANDS = new Set<string>(["A", "B", "C", "D", "E"]);

/** Rate column text from the TIS tax table for a product tax band. */
export function tisTaxRateLabel(band: string | null | undefined): string | undefined {
	const key = (band ?? "").trim().toUpperCase();
	if (!TIS_TAX_BANDS.has(key)) return undefined;
	return TIS_TAX_TABLE_SPEC.find((row) => row.band === key)?.rateLabel;
}

export function etimsTaxBandFromLineMetadata(metadata: unknown): string | undefined {
	if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
	const meta = metadata as Record<string, unknown>;
	const raw = meta.etimsTaxTyCd ?? meta.taxTyCd;
	if (typeof raw !== "string") return undefined;
	const key = raw.trim().toUpperCase();
	return tisTaxRateLabel(key) ? key : undefined;
}

function kraSaleBody(raw: unknown): Record<string, unknown> | null {
	if (!raw || typeof raw !== "object") return null;
	const root = raw as Record<string, unknown>;
	const body = (root.data ?? root.responseBody ?? root) as Record<string, unknown>;
	if (!body || typeof body !== "object") return null;
	return body;
}

export function resolveLineEtimsTaxBand(opts: {
	metadata: unknown;
	kraPayloads?: unknown[];
	index: number;
	lineCount: number;
}): string | undefined {
	const fromMeta = etimsTaxBandFromLineMetadata(opts.metadata);
	if (fromMeta) return fromMeta;
	for (const payload of opts.kraPayloads ?? []) {
		const band = taxTyCdFromKraPayload(payload, opts.index, opts.lineCount);
		if (band) return band;
	}
	return undefined;
}

/** Tax band filed on a KRA sale line, only when the payload line list matches the invoice lines. */
export function taxTyCdFromKraPayload(raw: unknown, index: number, lineCount: number): string | undefined {
	const body = kraSaleBody(raw);
	const items = body?.itemList;
	if (!Array.isArray(items) || items.length !== lineCount || index < 0 || index >= items.length) return undefined;
	const line = items[index];
	if (!line || typeof line !== "object") return undefined;
	const taxTyCd = (line as Record<string, unknown>).taxTyCd;
	if (typeof taxTyCd !== "string") return undefined;
	const key = taxTyCd.trim().toUpperCase();
	return tisTaxRateLabel(key) ? key : undefined;
}

export const TIS_TAX_TABLE_SPEC: Array<{
	band: TisTaxBand;
	rateLabel: string;
	rate: number;
}> = [
	{ band: "A", rateLabel: "EX", rate: 0 },
	{ band: "B", rateLabel: "16%", rate: 16 },
	{ band: "C", rateLabel: "0%", rate: 0 },
	{ band: "D", rateLabel: "Non-VAT", rate: 0 },
	{ band: "E", rateLabel: "8%", rate: 8 },
];

const emptyBuckets = (): Record<TisTaxBand, { taxable: number; vat: number }> => ({
	A: { taxable: 0, vat: 0 },
	B: { taxable: 0, vat: 0 },
	C: { taxable: 0, vat: 0 },
	D: { taxable: 0, vat: 0 },
	E: { taxable: 0, vat: 0 },
});

export function roundTisMoney(n: number): number {
	return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function parseMoney(value: unknown): number {
	if (value === undefined || value === null || `${value}` === "") return 0;
	const n = typeof value === "number" ? value : Number.parseFloat(String(value));
	return Number.isFinite(n) ? n : 0;
}

function bandFromInvoiceTaxRate(taxRate: number): TisTaxBand {
	if (taxRate >= 7 && taxRate <= 9) return "E";
	if (taxRate > 0) return "B";
	return "A";
}

function lineSum(items: Array<{ amount?: number | null; qty?: number | null }>): number {
	return roundTisMoney(
		items.reduce((total, item) => {
			const quantity = item.qty ? +item.qty : 1;
			const amount = item.amount != null && `${item.amount}` !== "" ? +item.amount : 0;
			return total + quantity * amount;
		}, 0),
	);
}

/** Read A–E buckets from a KRA sales payload (what we sent or what OSCU echoed). */
export function taxBucketsFromKraPayload(
	raw: unknown,
): Record<TisTaxBand, { taxable: number; vat: number }> | null {
	if (!raw || typeof raw !== "object") return null;
	const root = raw as Record<string, unknown>;
	const body = (root.data ?? root.responseBody ?? root) as Record<string, unknown>;
	if (!body || typeof body !== "object") return null;
	const keys = ["taxblAmtA", "taxblAmtB", "taxblAmtC", "taxblAmtD", "taxblAmtE"] as const;
	if (!keys.some((k) => body[k] != null && `${body[k]}` !== "")) return null;
	return {
		A: { taxable: parseMoney(body.taxblAmtA), vat: parseMoney(body.taxAmtA) },
		B: { taxable: parseMoney(body.taxblAmtB), vat: parseMoney(body.taxAmtB) },
		C: { taxable: parseMoney(body.taxblAmtC), vat: parseMoney(body.taxAmtC) },
		D: { taxable: parseMoney(body.taxblAmtD), vat: parseMoney(body.taxAmtD) },
		E: { taxable: parseMoney(body.taxblAmtE), vat: parseMoney(body.taxAmtE) },
	};
}

export function buildTisReceiptTotals(opts: {
	items: Array<{ amount?: number | null; qty?: number | null }>;
	discount?: string | number | null;
	taxRate?: string | number | null;
	taxBuckets?: Record<TisTaxBand, { taxable: number; vat: number }> | null;
}): TisReceiptTotals {
	const totalBeforeDiscount = lineSum(opts.items);
	const discountAwarded = roundTisMoney(parseMoney(opts.discount));
	const subTotal = roundTisMoney(totalBeforeDiscount - discountAwarded);
	const taxRate = parseMoney(opts.taxRate);
	const vatFromRate = roundTisMoney(subTotal * (taxRate / 100));
	const buckets = opts.taxBuckets ?? emptyBuckets();
	const hasPayloadBuckets = Boolean(opts.taxBuckets);
	if (!hasPayloadBuckets) {
		const band = bandFromInvoiceTaxRate(taxRate);
		buckets[band] = { taxable: subTotal, vat: vatFromRate };
	}
	const vat = hasPayloadBuckets
		? roundTisMoney(TIS_TAX_TABLE_SPEC.reduce((s, r) => s + buckets[r.band].vat, 0))
		: vatFromRate;
	const total = roundTisMoney(subTotal + vat);

	return {
		totalBeforeDiscount,
		discountAwarded,
		subTotal,
		vat,
		total,
		itemCount: opts.items.length,
		taxTable: TIS_TAX_TABLE_SPEC.map((spec) => ({
			...spec,
			taxable: roundTisMoney(buckets[spec.band].taxable),
			vat: roundTisMoney(buckets[spec.band].vat),
		})),
	};
}

export function formatTisMoney(n: number): string {
	const fixed = roundTisMoney(n).toFixed(2);
	const parts = fixed.split(".");
	parts[0] = parts[0]!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return parts.join(".");
}

/** Credit-note sample: `TOTAL B-16.00%` for bands that actually have money. */
export function tisCreditNoteBandLines(totals: TisReceiptTotals): Array<{
	taxableLabel: string;
	taxLabel: string;
	taxable: number;
	vat: number;
}> {
	return totals.taxTable
		.filter((row) => row.taxable !== 0 || row.vat !== 0)
		.map((row) => ({
			taxableLabel: `Total ${row.band}-${row.rate.toFixed(2)}%`,
			taxLabel: `Total Tax ${row.band}`,
			taxable: row.taxable,
			vat: row.vat,
		}));
}
