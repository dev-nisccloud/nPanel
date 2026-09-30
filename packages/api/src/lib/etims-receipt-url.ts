import { isInvoiceKraSynced } from "./invoice-kra-status";
import { kraSdcStampToCompact, parseKraSdcStamp } from "./etims-scu-print";

/** Receipt query value is PIN + branch id + receipt signature, passed as `Data`. */
const RECEIPT_PATH = "/common/link/etims/receipt/indexEtimsReceiptData";
const RECEIPT_PATH_KRA_TYPO = "/common/link/etims/receipt/indexEtimsReceptData";

export type EtimsReceiptUrlSource = {
	kraStatus?: string | null;
	kraVerificationUrl?: string | null;
	kraQrCode?: string | null;
	kraSignature?: string | null;
	kraSyncResponse?: unknown;
	kraSyncPayload?: unknown;
	fromDetails?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value as Record<string, unknown>;
}

function pickStr(...values: unknown[]): string | null {
	for (const value of values) {
		if (typeof value === "string" && value.trim()) return value.trim();
	}
	return null;
}

/** True when the value is a KRA public receipt URL (Receipt or the spec typo Recept). */
export function isEtimsReceiptVerifyUrl(url: string | null | undefined): boolean {
	const trimmed = url?.trim();
	if (!trimmed) return false;
	if (!trimmed.startsWith("https://etims") || !trimmed.includes("kra.go.ke")) return false;
	return trimmed.includes(RECEIPT_PATH) || trimmed.includes(RECEIPT_PATH_KRA_TYPO);
}

function receiptIsSandbox(storedUrl: string | undefined, explicit?: boolean): boolean {
	if (typeof explicit === "boolean") return explicit;
	if (storedUrl?.includes("etims-sbx.kra.go.ke")) return true;
	if (storedUrl?.includes("etims.kra.go.ke")) return false;
	return true;
}

/**
 * KRA public receipt verification URL.
 * Live receipts use `?Data=` plus PIN + branch + receipt signature, no separators.
 * Example: `...?Data=P052377334H00LAY45GBO54KOEF4U`
 */
export function buildEtimsReceiptVerifyUrl(params: {
	tin: string;
	bhfId: string;
	rcptSign: string;
	isSandbox?: boolean;
}): string | null {
	const tin = params.tin?.trim();
	const bhfId = params.bhfId?.trim();
	const rcptSign = params.rcptSign?.trim().replace(/-/g, "");
	if (!tin || !bhfId || !rcptSign) return null;

	const host = params.isSandbox ? "https://etims-sbx.kra.go.ke" : "https://etims.kra.go.ke";
	return `${host}${RECEIPT_PATH}?Data=${tin}${bhfId}${rcptSign}`;
}

/** Insert the `Data` query name when an older URL stored only `?{PIN}{bhfId}{rcptSign}`. */
export function normalizeEtimsReceiptVerifyUrl(url: string | null | undefined): string | null {
	const trimmed = url?.trim();
	if (!trimmed) return null;
	if (!isEtimsReceiptVerifyUrl(trimmed)) return trimmed;
	try {
		const parsed = new URL(trimmed);
		if (parsed.searchParams.has("Data")) return trimmed;
		const rawQuery = parsed.search.startsWith("?") ? parsed.search.slice(1) : "";
		if (!rawQuery || rawQuery.includes("=")) return trimmed;
		return `${parsed.origin}${parsed.pathname}?Data=${rawQuery}`;
	} catch {
		return trimmed;
	}
}

export function extractOscuIdentityForReceiptUrl(invoice: EtimsReceiptUrlSource): {
	tin: string;
	bhfId: string;
	rcptSign: string;
} | null {
	const from = asRecord(invoice.fromDetails);
	const payload = asRecord(invoice.kraSyncPayload);
	const response = asRecord(invoice.kraSyncResponse);
	const nested =
		asRecord(response?.data) ??
		asRecord(response?.responseBody) ??
		response;
	const receipt = asRecord(nested?.receipt) ?? asRecord(payload?.receipt);

	const tin = pickStr(payload?.tin, nested?.tin, from?.taxId);
	const bhfId = pickStr(payload?.bhfId, nested?.bhfId) || "00";
	const rcptSign = pickStr(
		invoice.kraSignature,
		nested?.rcptSign,
		receipt?.rcptSign,
		extractRcptSignFromKraResponse(invoice.kraSyncResponse),
	);
	if (!tin || !rcptSign) return null;
	return { tin, bhfId, rcptSign: rcptSign.replace(/-/g, "") };
}

/**
 * Invoice / credit-note QR payload. Always the KRA receipt URL
 * `https://etims.kra.go.ke/common/link/etims/receipt/indexEtimsReceiptData?Data={PIN}{BHF}{rcptSign}`
 * (sandbox host `etims-sbx` when the device is sandbox). Payment QRs are ignored.
 */
export function resolveInvoiceEtimsVerificationUrl(
	invoice: EtimsReceiptUrlSource,
	opts?: { isSandbox?: boolean },
): string | undefined {
	const stored = pickStr(invoice.kraVerificationUrl, invoice.kraQrCode) ?? undefined;
	const identity = extractOscuIdentityForReceiptUrl(invoice);
	if (identity) {
		const rebuilt = buildEtimsReceiptVerifyUrl({
			...identity,
			isSandbox: receiptIsSandbox(stored, opts?.isSandbox),
		});
		if (rebuilt) return rebuilt;
	}
	if (stored && isEtimsReceiptVerifyUrl(stored)) return normalizeEtimsReceiptVerifyUrl(stored) ?? stored;
	if (!isInvoiceKraSynced(invoice.kraStatus)) return undefined;
	return undefined;
}

export function extractRcptSignFromKraResponse(data: unknown): string | null {
	if (!data || typeof data !== "object") return null;
	const root = data as Record<string, unknown>;
	const body = (root.responseBody ?? root.data ?? root) as Record<string, unknown>;
	const nested = asRecord(body.data) ?? body;
	const sign =
		nested.rcptSign ??
		body.rcptSign ??
		(body.receipt as Record<string, unknown> | undefined)?.rcptSign;
	return sign ? String(sign).trim() : null;
}

/** Interpret a KRA SCU stamp as Africa/Nairobi (`+03:00`), including spaced lookup form. */
export function parseKraSdcDateTime(value: string | Date | null | undefined): Date | null {
	const p = parseKraSdcStamp(value);
	if (!p) return null;
	const dt = new Date(`${p.y}-${p.m}-${p.d}T${p.hh}:${p.mm}:${p.ss}+03:00`);
	return Number.isNaN(dt.getTime()) ? null : dt;
}

export function kraSdcDateTimeToCompact(value: string | Date | null | undefined): string | null {
	const p = parseKraSdcStamp(value);
	return p ? kraSdcStampToCompact(p) : null;
}
