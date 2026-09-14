import type { CreditNoteDetail, InvoiceDetail } from "../routers/invoicing/schemas";
import { isInvoiceKraSynced } from "./invoice-kra-status";
import { extractRcptSignFromKraResponse, isEtimsReceiptVerifyUrl, resolveInvoiceEtimsVerificationUrl } from "./etims-receipt-url";
import {
	buildCuInvoiceNo,
	dashEvery4,
	extractSdcIdFromKraBody,
	formatScuDateTimeParts,
	formatTisDateTimeParts,
	kraReceiptLabel,
} from "./etims-scu-print";

export type EtimsFiscalFields = {
	rcptSign: string;
	intrlData: string | null;
	curRcptNo: string | null;
	totRcptNo: string | null;
	sdcDateTime: string | null;
	/** Human-readable control unit date-time for the PDF footer. */
	sdcDateTimeDisplay: string | null;
	verificationUrl: string | null;
	sdcId: string | null;
	receiptLabel: string | null;
	cuInvoiceNo: string | null;
	intrlDataDashed: string | null;
	rcptSignDashed: string | null;
	scuDate: string | null;
	scuTime: string | null;
	tisReceiptNumber: string | null;
	tisDate: string | null;
	tisTime: string | null;
	originalCuInvoiceNo: string | null;
	itemCount: number | null;
};

export type EtimsFiscalExtractExtras = {
	isCreditNote?: boolean;
	tisReceiptNumber?: string | null;
	tisIssuedAt?: string | Date | null;
	originalCuInvoiceNo?: string | null;
	itemCount?: number | null;
	sdcId?: string | null;
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
	const parts = formatScuDateTimeParts(value);
	if (!parts) return value ? String(value) : null;
	return `${parts.date} ${parts.time}`;
}

function assembleFiscalFields(
	base: {
		rcptSign: string;
		intrlData: string | null;
		curRcptNo: string | null;
		totRcptNo: string | null;
		sdcDateTime: string | null;
		verificationUrl: string | null;
		sdcId: string | null;
	},
	extras?: EtimsFiscalExtractExtras,
): EtimsFiscalFields {
	const receiptLabel = kraReceiptLabel({ isCreditNote: extras?.isCreditNote });
	const scu = formatScuDateTimeParts(base.sdcDateTime);
	const tis = formatTisDateTimeParts(extras?.tisIssuedAt ?? null);
	return {
		...base,
		sdcDateTimeDisplay: formatKraSdcDateTimeDisplay(base.sdcDateTime),
		receiptLabel,
		cuInvoiceNo: buildCuInvoiceNo({
			sdcId: base.sdcId,
			curRcptNo: base.curRcptNo,
			receiptLabel,
		}),
		intrlDataDashed: dashEvery4(base.intrlData),
		rcptSignDashed: dashEvery4(base.rcptSign),
		scuDate: scu?.date ?? null,
		scuTime: scu?.time ?? null,
		tisReceiptNumber: extras?.tisReceiptNumber?.trim() || null,
		tisDate: tis?.date ?? null,
		tisTime: tis?.time ?? null,
		originalCuInvoiceNo: extras?.originalCuInvoiceNo?.trim() || null,
		itemCount: extras?.itemCount ?? null,
	};
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
	> & {
		kraSyncPayload?: unknown;
		fromDetails?: unknown;
		invoiceNumber?: string | null;
		issueDate?: string | Date | null;
		lineItems?: unknown[] | null;
	},
	extras?: EtimsFiscalExtractExtras,
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

	const itemCount =
		extras?.itemCount ??
		(Array.isArray(invoice.lineItems) ? invoice.lineItems.length : null);

	return assembleFiscalFields(
		{
			rcptSign,
			intrlData,
			curRcptNo,
			totRcptNo,
			sdcDateTime,
			verificationUrl: resolveInvoiceEtimsVerificationUrl(invoice) ?? null,
			sdcId: extras?.sdcId ?? extractSdcIdFromKraBody(invoice.kraSyncResponse),
		},
		{
			...extras,
			tisReceiptNumber: extras?.tisReceiptNumber ?? invoice.invoiceNumber ?? null,
			tisIssuedAt: extras?.tisIssuedAt ?? invoice.issueDate ?? invoice.kraVerifiedDate ?? null,
			itemCount,
		},
	);
}

/** Fill dashed CU/TIS print fields when a stored fiscal payload is missing them. */
export function ensureEtimsPrintFields(
	fields: EtimsFiscalFields | null | undefined,
	extras?: EtimsFiscalExtractExtras,
): EtimsFiscalFields | null {
	if (!fields?.rcptSign) return null;
	const next = assembleFiscalFields(
		{
			rcptSign: fields.rcptSign,
			intrlData: fields.intrlData,
			curRcptNo: fields.curRcptNo,
			totRcptNo: fields.totRcptNo,
			sdcDateTime: fields.sdcDateTime,
			verificationUrl:
				fields.verificationUrl && isEtimsReceiptVerifyUrl(fields.verificationUrl)
					? fields.verificationUrl
					: null,
			sdcId: extras?.sdcId ?? fields.sdcId,
		},
		{
			isCreditNote: extras?.isCreditNote,
			tisReceiptNumber: extras?.tisReceiptNumber ?? fields.tisReceiptNumber,
			tisIssuedAt: extras?.tisIssuedAt ?? null,
			originalCuInvoiceNo: extras?.originalCuInvoiceNo ?? fields.originalCuInvoiceNo,
			itemCount: extras?.itemCount ?? fields.itemCount,
			sdcId: extras?.sdcId ?? fields.sdcId,
		},
	);
	return {
		...next,
		tisDate: next.tisDate ?? fields.tisDate,
		tisTime: next.tisTime ?? fields.tisTime,
		scuDate: next.scuDate ?? fields.scuDate,
		scuTime: next.scuTime ?? fields.scuTime,
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
	> & {
		kraSyncPayload?: unknown;
		fromDetails?: unknown;
		creditNumber?: string | null;
		issuedAt?: string | Date | null;
		lineItems?: unknown[] | null;
		originalCuInvoiceNo?: string | null;
	},
	extras?: EtimsFiscalExtractExtras,
): EtimsFiscalFields | null {
	return extractEtimsFiscalFieldsFromInvoice(
		creditNote as Pick<
			InvoiceDetail,
			| "kraStatus"
			| "kraSignature"
			| "kraReceiptNumber"
			| "kraVerificationUrl"
			| "kraQrCode"
			| "kraSyncResponse"
			| "kraVerifiedDate"
		> & {
			kraSyncPayload?: unknown;
			fromDetails?: unknown;
			invoiceNumber?: string | null;
			issueDate?: string | Date | null;
			lineItems?: unknown[] | null;
		},
		{
			isCreditNote: true,
			tisReceiptNumber: extras?.tisReceiptNumber ?? creditNote.creditNumber ?? null,
			tisIssuedAt: extras?.tisIssuedAt ?? creditNote.issuedAt ?? null,
			originalCuInvoiceNo: extras?.originalCuInvoiceNo ?? creditNote.originalCuInvoiceNo ?? null,
			itemCount: extras?.itemCount ?? (Array.isArray(creditNote.lineItems) ? creditNote.lineItems.length : null),
			sdcId: extras?.sdcId,
		},
	);
}

export type EtimsFiscalFooterField = {
	label: string;
	value: string;
};

/** Fiscal footer fields in display order (labels rendered bold with a colon). */
export function getEtimsFiscalFooterFields(
	fields: Pick<EtimsFiscalFields, "sdcDateTime" | "sdcDateTimeDisplay" | "intrlData" | "rcptSign" | "intrlDataDashed" | "rcptSignDashed">,
): EtimsFiscalFooterField[] {
	const rows: EtimsFiscalFooterField[] = [];
	const sdc = fields.sdcDateTimeDisplay ?? fields.sdcDateTime;
	if (sdc) {
		rows.push({ label: "SDC Date-Time", value: sdc });
	}
	const internal = fields.intrlDataDashed ?? fields.intrlData;
	if (internal) {
		rows.push({ label: "Internal Data", value: internal });
	}
	const sign = fields.rcptSignDashed ?? fields.rcptSign;
	if (sign) {
		rows.push({ label: "Receipt Signature", value: sign });
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
