/** Print helpers for the TIS OSCU/VSCU receipt footer (spec v2.0 §6.23). */

export function dashEvery4(value: string | null | undefined): string | null {
	if (!value) return null;
	const compact = String(value).replace(/[-\s]/g, "").trim();
	if (!compact) return null;
	return compact.match(/.{1,4}/g)?.join("-") ?? compact;
}

export function kraReceiptLabel(opts: { isCreditNote?: boolean; salesTyCd?: string | null }): string {
	const sales = (opts.salesTyCd ?? "N").trim().toUpperCase() || "N";
	const txn = opts.isCreditNote ? "C" : "S";
	return `${sales}${txn}`;
}

export function buildCuInvoiceNo(opts: {
	sdcId?: string | null;
	curRcptNo?: string | null;
	receiptLabel?: string | null;
}): string | null {
	const id = opts.sdcId?.trim();
	const no = opts.curRcptNo != null ? String(opts.curRcptNo).trim() : "";
	if (!id && !no) return null;
	const base = id && no ? `${id}/${no}` : id || no;
	const label = opts.receiptLabel?.trim();
	return label ? `${base} ${label}` : base;
}

/** Split KRA `yyyyMMddHHmmss` into spec print date `dd/mm/yyyy` and time `hh:mm:ss`. */
export function formatScuDateTimeParts(value: string | null | undefined): { date: string; time: string } | null {
	if (!value) return null;
	const s = String(value).trim();
	if (/^\d{14}$/.test(s)) {
		return {
			date: `${s.slice(6, 8)}/${s.slice(4, 6)}/${s.slice(0, 4)}`,
			time: `${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}`,
		};
	}
	const d = new Date(s);
	if (Number.isNaN(d.getTime())) return null;
	const pad = (n: number) => String(n).padStart(2, "0");
	return {
		date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
		time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
	};
}

export function formatTisDateTimeParts(value: string | Date | null | undefined): { date: string; time: string } | null {
	if (!value) return null;
	if (typeof value === "string" && /^\d{14}$/.test(value.trim())) {
		return formatScuDateTimeParts(value);
	}
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return null;
	const pad = (n: number) => String(n).padStart(2, "0");
	return {
		date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
		time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
	};
}

export function extractSdcIdFromKraBody(raw: unknown): string | null {
	if (!raw || typeof raw !== "object") return null;
	const root = raw as Record<string, unknown>;
	const body = (root.responseBody ?? root.data ?? root) as Record<string, unknown>;
	const info = (body.info ?? (body.data as Record<string, unknown> | undefined)?.info) as
		| Record<string, unknown>
		| undefined;
	const candidates = [body.sdcId, body.sdcID, info?.sdcId, info?.sdcID, root.sdcId];
	for (const c of candidates) {
		if (c != null && String(c).trim()) return String(c).trim();
	}
	return null;
}
