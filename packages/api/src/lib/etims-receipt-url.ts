import type { InvoiceDetail } from "../routers/invoicing/schemas";
import { isInvoiceKraSynced } from "./invoice-kra-status";

/** Only KRA eTIMS verification URLs are valid for invoice PDF QR codes. */
export function resolveInvoiceEtimsVerificationUrl(
	invoice: Pick<InvoiceDetail, "kraStatus" | "kraVerificationUrl" | "kraQrCode">,
): string | undefined {
	const url = invoice.kraVerificationUrl ?? invoice.kraQrCode;
	const trimmed = url?.trim();
	if (trimmed) return trimmed;
	if (!isInvoiceKraSynced(invoice.kraStatus)) return undefined;
	return undefined;
}

/**
 * KRA public receipt verification URL (OSCUs/VSCU spec v2.0).
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
	return `${host}/common/link/etims/receipt/indexEtimsReceiptData?${tin}${bhfId}${rcptSign}`;
}

export function extractRcptSignFromKraResponse(data: unknown): string | null {
	if (!data || typeof data !== "object") return null;
	const root = data as Record<string, unknown>;
	const body = (root.responseBody ?? root.data ?? root) as Record<string, unknown>;
	const sign = body.rcptSign ?? (body.receipt as Record<string, unknown> | undefined)?.rcptSign;
	return sign ? String(sign).trim() : null;
}

export function parseKraSdcDateTime(value: string | null | undefined): Date | null {
	if (!value) return null;
	const s = String(value).trim();
	if (s.length !== 14) return null;
	const y = Number(s.slice(0, 4));
	const m = Number(s.slice(4, 6)) - 1;
	const d = Number(s.slice(6, 8));
	const hh = Number(s.slice(8, 10));
	const mm = Number(s.slice(10, 12));
	const ss = Number(s.slice(12, 14));
	const dt = new Date(y, m, d, hh, mm, ss);
	return Number.isNaN(dt.getTime()) ? null : dt;
}
