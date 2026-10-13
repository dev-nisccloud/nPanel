import { isInvoiceKraSynced } from "./invoice-kra-status";
import { kraSdcStampToCompact, parseKraSdcStamp } from "./etims-scu-print";

/** Receipt query value is PIN + branch id + receipt signature, passed as `Data`. */
const RECEIPT_PATH = "/common/link/etims/receipt/indexEtimsReceiptData";
const RECEIPT_PATH_KRA_TYPO = "/common/link/etims/receipt/indexEtimsReceptData";
/** Kenya PIN is 11 characters (`P` + 9 digits + check letter). Branch id is 2 characters. */
const KENYA_PIN_LENGTH = 11;
const BHF_ID_LENGTH = 2;

export type EtimsReceiptUrlSource = {
	kraStatus?: string | null;
	kraVerificationUrl?: string | null;
	kraQrCode?: string | null;
	kraSignature?: string | null;
	kraSyncResponse?: unknown;
	kraSyncPayload?: unknown;
	fromDetails?: unknown;
};

export type EtimsReceiptUrlOpts = {
	isSandbox?: boolean;
	tin?: string | null;
	bhfId?: string | null;
};

export type EtimsReceiptIdentity = {
	tin: string;
	bhfId: string;
	rcptSign: string;
	isSandbox?: boolean;
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
	return false;
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

function parseReceiptDataPayload(raw: string | null | undefined): Omit<EtimsReceiptIdentity, "isSandbox"> | null {
	const compact = raw?.replace(/[-\s]/g, "").trim() ?? "";
	if (compact.length < KENYA_PIN_LENGTH + BHF_ID_LENGTH + 1) return null;
	if (!/^P[A-Z0-9]{10}/i.test(compact)) return null;
	return {
		tin: compact.slice(0, KENYA_PIN_LENGTH).toUpperCase(),
		bhfId: compact.slice(KENYA_PIN_LENGTH, KENYA_PIN_LENGTH + BHF_ID_LENGTH),
		rcptSign: compact.slice(KENYA_PIN_LENGTH + BHF_ID_LENGTH),
	};
}

/** Read PIN / branch / signature / environment from a stored KRA receipt URL or bare `Data` payload. */
export function parseEtimsReceiptVerifyUrl(url: string | null | undefined): EtimsReceiptIdentity | null {
	const trimmed = url?.trim();
	if (!trimmed) return null;

	if (isEtimsReceiptVerifyUrl(trimmed)) {
		try {
			const parsed = new URL(trimmed);
			const data =
				parsed.searchParams.get("Data") ??
				(!parsed.search.includes("=") && parsed.search.startsWith("?")
					? parsed.search.slice(1)
					: null);
			const parts = parseReceiptDataPayload(data);
			if (!parts) return null;
			return {
				...parts,
				isSandbox: parsed.host.includes("etims-sbx"),
			};
		} catch {
			return null;
		}
	}

	return parseReceiptDataPayload(trimmed);
}

/** Canonical KRA receipt URL: correct path, `Data=` query, production vs sandbox host. */
export function normalizeEtimsReceiptVerifyUrl(url: string | null | undefined): string | null {
	const trimmed = url?.trim();
	if (!trimmed) return null;
	const parsed = parseEtimsReceiptVerifyUrl(trimmed);
	if (parsed) {
		return buildEtimsReceiptVerifyUrl(parsed);
	}
	if (!isEtimsReceiptVerifyUrl(trimmed)) return trimmed;
	try {
		const parsedUrl = new URL(trimmed);
		parsedUrl.pathname = parsedUrl.pathname.replace(RECEIPT_PATH_KRA_TYPO, RECEIPT_PATH);
		if (parsedUrl.searchParams.has("Data")) {
			return `${parsedUrl.origin}${RECEIPT_PATH}?Data=${parsedUrl.searchParams.get("Data")}`;
		}
		const rawQuery = parsedUrl.search.startsWith("?") ? parsedUrl.search.slice(1) : "";
		if (!rawQuery || rawQuery.includes("=")) {
			return `${parsedUrl.origin}${RECEIPT_PATH}${parsedUrl.search}`;
		}
		return `${parsedUrl.origin}${RECEIPT_PATH}?Data=${rawQuery}`;
	} catch {
		return trimmed;
	}
}

export function extractOscuIdentityForReceiptUrl(
	invoice: EtimsReceiptUrlSource,
	opts?: EtimsReceiptUrlOpts,
): { tin: string; bhfId: string; rcptSign: string } | null {
	const from = asRecord(invoice.fromDetails);
	const payload = asRecord(invoice.kraSyncPayload);
	const response = asRecord(invoice.kraSyncResponse);
	const nested =
		asRecord(response?.data) ??
		asRecord(response?.responseBody) ??
		response;
	const receipt = asRecord(nested?.receipt) ?? asRecord(payload?.receipt);
	const fromUrl = parseEtimsReceiptVerifyUrl(
		pickStr(invoice.kraVerificationUrl, invoice.kraQrCode),
	);

	const tin = pickStr(opts?.tin, payload?.tin, nested?.tin, from?.taxId, fromUrl?.tin);
	const bhfId = pickStr(opts?.bhfId, payload?.bhfId, nested?.bhfId, fromUrl?.bhfId) || "00";
	const rcptSign = pickStr(
		invoice.kraSignature,
		nested?.rcptSign,
		receipt?.rcptSign,
		extractRcptSignFromKraResponse(invoice.kraSyncResponse),
		fromUrl?.rcptSign,
	);
	if (!tin || !rcptSign) return null;
	return { tin, bhfId, rcptSign: rcptSign.replace(/-/g, "") };
}

/**
 * Invoice / credit-note QR payload. Always the same KRA receipt URL the
 * "Verify on KRA Portal" button opens:
 * `https://etims.kra.go.ke/common/link/etims/receipt/indexEtimsReceiptData?Data={PIN}{BHF}{rcptSign}`
 * (sandbox host `etims-sbx` when the device is sandbox). Payment QRs are ignored.
 */
export function resolveInvoiceEtimsVerificationUrl(
	invoice: EtimsReceiptUrlSource,
	opts?: EtimsReceiptUrlOpts,
): string | undefined {
	const stored = pickStr(invoice.kraVerificationUrl, invoice.kraQrCode) ?? undefined;
	const fromUrl = parseEtimsReceiptVerifyUrl(stored);
	const identity = extractOscuIdentityForReceiptUrl(invoice, opts);
	if (identity) {
		const rebuilt = buildEtimsReceiptVerifyUrl({
			...identity,
			isSandbox: receiptIsSandbox(stored, opts?.isSandbox ?? fromUrl?.isSandbox),
		});
		if (rebuilt) return rebuilt;
	}
	if (stored && isEtimsReceiptVerifyUrl(stored)) {
		return normalizeEtimsReceiptVerifyUrl(stored) ?? stored;
	}
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
