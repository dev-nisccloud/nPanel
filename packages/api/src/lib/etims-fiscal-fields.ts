import type { CreditNoteDetail, InvoiceDetail } from "../routers/invoicing/schemas";
import { isInvoiceKraSynced } from "./invoice-kra-status";
import { extractRcptSignFromKraResponse, resolveInvoiceEtimsVerificationUrl } from "./etims-receipt-url";

export type EtimsFiscalFields = {
	rcptSign: string;
	intrlData: string | null;
	curRcptNo: string | null;
	totRcptNo: string | null;
	sdcDateTime: string | null;
	/** Human-readable control unit date-time for the PDF footer. */
	sdcDateTimeDisplay: string | null;
	verificationUrl: string | null;
};

function readKraResponseBody(kraSyncResponse: unknown): Record<string, unknown> | null {
	if (!kraSyncResponse || typeof kraSyncResponse !== "object") return null;
	const root = kraSyncResponse as Record<string, unknown>;
	const nested = root.data ?? root.responseBody;
	if (nested && typeof nested === "object") {
		return nested as Record<string, unknown>;
	}
	return root;
}

function stringOrNull(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const s = String(value).trim();
	return s.length > 0 ? s : null;
}

/** Format KRA `yyyyMMddHHmmss` for display on the invoice footer. */
export function formatKraSdcDateTimeDisplay(value: string | null | undefined): string | null {
	if (!value) return null;
	const s = String(value).trim();
	if (s.length === 14) {
		return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} ${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}`;
	}
	return s;
}

/**
 * Mandatory KRA eTIMS receipt fields for printing on customer invoices.
 * Returns null when the invoice is not KRA-synced or fiscal data is missing.
 */
export function extractEtimsFiscalFieldsFromInvoice(
	invoice: Pick<
		InvoiceDetail,
		| "kraStatus"
		| "kraSignature"
		| "kraReceiptNumber"
		| "kraVerificationUrl"
		| "kraQrCode"
		| "kraSyncResponse"
		| "kraVerifiedDate"
	>,
): EtimsFiscalFields | null {
	if (!isInvoiceKraSynced(invoice.kraStatus)) {
		return null;
	}

	const body = readKraResponseBody(invoice.kraSyncResponse);
	const rcptSign =
		stringOrNull(invoice.kraSignature) ??
		extractRcptSignFromKraResponse(invoice.kraSyncResponse);

	if (!rcptSign) {
		return null;
	}

	const intrlData = stringOrNull(body?.intrlData);
	const curRcptNo = stringOrNull(body?.curRcptNo) ?? stringOrNull(invoice.kraReceiptNumber);
	const totRcptNo = stringOrNull(body?.totRcptNo);
	const sdcRaw = stringOrNull(body?.sdcDateTime);
	const sdcDateTime =
		sdcRaw ??
		(invoice.kraVerifiedDate instanceof Date
			? formatKraVerifiedDateToKraString(invoice.kraVerifiedDate)
			: invoice.kraVerifiedDate
				? formatKraVerifiedDateToKraString(new Date(invoice.kraVerifiedDate))
				: null);

	return {
		rcptSign,
		intrlData,
		curRcptNo,
		totRcptNo,
		sdcDateTime,
		sdcDateTimeDisplay: formatKraSdcDateTimeDisplay(sdcDateTime),
		verificationUrl: resolveInvoiceEtimsVerificationUrl(invoice) ?? null,
	};
}

/** KRA fiscal footer fields for credit notes (same shape as invoices). */
export function extractEtimsFiscalFieldsFromCreditNote(
	creditNote: Pick<
		CreditNoteDetail,
		| "kraStatus"
		| "kraSignature"
		| "kraReceiptNumber"
		| "kraVerificationUrl"
		| "kraQrCode"
		| "kraSyncResponse"
		| "kraVerifiedDate"
	>,
): EtimsFiscalFields | null {
	return extractEtimsFiscalFieldsFromInvoice(creditNote as Pick<
		InvoiceDetail,
		| "kraStatus"
		| "kraSignature"
		| "kraReceiptNumber"
		| "kraVerificationUrl"
		| "kraQrCode"
		| "kraSyncResponse"
		| "kraVerifiedDate"
	>);
}

export type EtimsFiscalFooterField = {
	label: string;
	value: string;
};

/** Fiscal footer fields in display order (labels rendered bold with a colon). */
export function getEtimsFiscalFooterFields(
	fields: Pick<EtimsFiscalFields, "sdcDateTime" | "sdcDateTimeDisplay" | "intrlData" | "rcptSign">,
): EtimsFiscalFooterField[] {
	const rows: EtimsFiscalFooterField[] = [];
	const sdc = fields.sdcDateTimeDisplay ?? fields.sdcDateTime;
	if (sdc) {
		rows.push({ label: "SDC Date-Time", value: sdc });
	}
	if (fields.intrlData) {
		rows.push({ label: "Internal Data", value: fields.intrlData });
	}
	if (fields.rcptSign) {
		rows.push({ label: "Receipt Signature", value: fields.rcptSign });
	}
	return rows;
}

/** @deprecated Use {@link getEtimsFiscalFooterFields} for styled rendering. */
export function formatEtimsFiscalFooterPrimaryLine(fields: Pick<
	EtimsFiscalFields,
	"sdcDateTime" | "sdcDateTimeDisplay" | "intrlData" | "rcptSign"
>): string {
	return getEtimsFiscalFooterFields(fields)
		.map(({ label, value }) => `${label}: ${value}`)
		.join(" | ");
}

function formatKraVerifiedDateToKraString(date: Date): string | null {
	if (Number.isNaN(date.getTime())) return null;
	const pad = (n: number) => String(n).padStart(2, "0");
	return (
		`${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
		`${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
	);
}
