/** Print helpers for the TIS OSCU/VSCU receipt footer (spec v2.0 §6.23). */

export type KraSdcStampParts = {
	y: string;
	m: string;
	d: string;
	hh: string;
	mm: string;
	ss: string;
};

/**
 * Read a KRA control-unit stamp without going through `Date` (no timezone shift).
 * Accepts `yyyyMMddHHmmss` and KRA lookup form `yyyy-MM-dd HH:mm:ss[.S]`.
 */
export function parseKraSdcStamp(value: string | Date | null | undefined): KraSdcStampParts | null {
	if (value instanceof Date) {
		if (Number.isNaN(value.getTime())) return null;
		const list = new Intl.DateTimeFormat("en-GB", {
			timeZone: "Africa/Nairobi",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		}).formatToParts(value);
		const g = (t: string) => list.find((p) => p.type === t)?.value ?? "00";
		const hh = g("hour") === "24" ? "00" : g("hour");
		return { y: g("year"), m: g("month"), d: g("day"), hh, mm: g("minute"), ss: g("second") };
	}
	if (!value) return null;
	const s = String(value).trim();
	const compact = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
	if (compact) {
		return { y: compact[1]!, m: compact[2]!, d: compact[3]!, hh: compact[4]!, mm: compact[5]!, ss: compact[6]! };
	}
	const spaced = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
	if (spaced) {
		return { y: spaced[1]!, m: spaced[2]!, d: spaced[3]!, hh: spaced[4]!, mm: spaced[5]!, ss: spaced[6]! };
	}
	const dateOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (dateOnly) {
		return { y: dateOnly[1]!, m: dateOnly[2]!, d: dateOnly[3]!, hh: "00", mm: "00", ss: "00" };
	}
	return null;
}

export function kraSdcStampToCompact(parts: KraSdcStampParts): string {
	return `${parts.y}${parts.m}${parts.d}${parts.hh}${parts.mm}${parts.ss}`;
}

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

export function isKraCopySalesType(salesTyCd?: string | null): boolean {
	return (salesTyCd ?? "").trim().toUpperCase() === "C";
}

/** COPY receipt labels are CS (copy sale) and CC (copy credit note). NC is a normal credit note. */
export function isKraCopyReceiptLabel(label?: string | null): boolean {
	const value = (label ?? "").trim().toUpperCase();
	return value === "CS" || value === "CC";
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

/** Split a KRA SCU stamp into spec print date `dd/mm/yyyy` and time `hh:mm:ss` (digits as returned). */
export function formatScuDateTimeParts(value: string | Date | null | undefined): { date: string; time: string } | null {
	const p = parseKraSdcStamp(value);
	if (!p) return null;
	return {
		date: `${p.d}/${p.m}/${p.y}`,
		time: `${p.hh}:${p.mm}:${p.ss}`,
	};
}

/** Same as SCU: print the KRA stamp as-is. Do not convert through local timezone. */
export function formatTisDateTimeParts(value: string | Date | null | undefined): { date: string; time: string } | null {
	return formatScuDateTimeParts(value);
}

/** Full `dd/mm/yyyy hh:mm:ss` from the KRA stamp. */
export function formatKraSdcDateTimeFull(value: string | Date | null | undefined): string | null {
	const parts = formatScuDateTimeParts(value);
	if (!parts) return null;
	return `${parts.date} ${parts.time}`;
}

const SDC_ID_KEY = /^sdc[_-]?id$/i;

export function extractSdcIdFromKraBody(raw: unknown): string | null {
	return walkSdcId(raw, 0);
}

function walkSdcId(raw: unknown, depth: number): string | null {
	if (raw == null || depth > 8) return null;
	if (typeof raw !== "object") return null;
	if (Array.isArray(raw)) {
		for (const item of raw) {
			const hit = walkSdcId(item, depth + 1);
			if (hit) return hit;
		}
		return null;
	}
	const rec = raw as Record<string, unknown>;
	for (const [key, value] of Object.entries(rec)) {
		if (!SDC_ID_KEY.test(key) || value == null) continue;
		const text = String(value).trim();
		if (text) return text;
	}
	for (const value of Object.values(rec)) {
		if (value && typeof value === "object") {
			const hit = walkSdcId(value, depth + 1);
			if (hit) return hit;
		}
	}
	return null;
}
