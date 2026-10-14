import type { CreditNoteDetail, InvoiceDetail } from "../routers/invoicing/schemas";
import type { InvoiceKraStatus } from "./invoice-kra-status";
import {
	buildEtimsReceiptVerifyUrl,
	extractRcptSignFromKraResponse,
	isEtimsReceiptVerifyUrl,
	normalizeEtimsReceiptVerifyUrl,
	parseKraSdcDateTime,
	resolveInvoiceEtimsVerificationUrl,
} from "./etims-receipt-url";
import {
	buildCuInvoiceNo,
	dashEvery4,
	extractSdcIdFromKraBody,
	formatKraSdcDateTimeFull,
	formatScuDateTimeParts,
	formatTisDateTimeParts,
	kraReceiptLabel,
	kraSdcStampToCompact,
	parseKraSdcStamp,
} from "./etims-scu-print";

export type EtimsFiscalFields = {
	rcptSign: string | null;
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
	/** OSCU sales type: N normal, C copy, P proforma, T training. */
	salesTyCd: string | null;
};

export type EtimsFiscalExtractExtras = {
	isCreditNote?: boolean;
	tisReceiptNumber?: string | null;
	tisIssuedAt?: string | Date | null;
	originalCuInvoiceNo?: string | null;
	itemCount?: number | null;
	sdcId?: string | null;
	/** OSCU identity for the QR / verify URL (same values as "Verify on KRA Portal"). */
	tin?: string | null;
	bhfId?: string | null;
	isSandbox?: boolean;
	/** OSCU `salesTyCd` (N/C/P/T). Copy receipts are `C`. */
	salesTyCd?: string | null;
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

/** Format KRA stamp for display: `dd/mm/yyyy hh:mm:ss` using returned digits. */
export function formatKraSdcDateTimeDisplay(value: string | Date | null | undefined): string | null {
	return formatKraSdcDateTimeFull(value);
}

export type ManualScuParts = {
	sdcId?: string | null;
	sdcDate?: string | Date | null;
	sdcTime?: string | null;
	sdcDateTime?: string | null;
	curRcptNo?: string | null;
	totRcptNo?: string | null;
	intrlData?: string | null;
	rcptSign?: string | null;
	verificationUrl?: string | null;
	tin?: string | null;
	bhfId?: string | null;
	isSandbox?: boolean;
};

/** Combine a calendar date + clock into KRA `yyyyMMddHHmmss`. */
export function combineScuDateTime(
	date?: string | Date | null,
	time?: string | null,
): string | null {
	if (typeof date === "string" && /^\d{14}$/.test(date.trim())) return date.trim();
	const stamp = parseKraSdcStamp(date);
	if (stamp && !time?.trim()) return kraSdcStampToCompact(stamp);
	let year = "";
	let month = "";
	let day = "";
	if (stamp) {
		year = stamp.y;
		month = stamp.m;
		day = stamp.d;
	} else {
		return null;
	}
	let hh = "00";
	let mm = "00";
	let ss = "00";
	const clock = time?.trim();
	if (clock) {
		const parts = clock.split(":");
		hh = (parts[0] ?? "00").padStart(2, "0").slice(0, 2);
		mm = (parts[1] ?? "00").padStart(2, "0").slice(0, 2);
		ss = (parts[2] ?? "00").padStart(2, "0").slice(0, 2);
	}
	return `${year}${month}${day}${hh}${mm}${ss}`;
}

export function hasManualScuInput(parts: ManualScuParts | null | undefined): boolean {
	if (!parts) return false;
	return Boolean(
		stringOrNull(parts.sdcId) ||
			stringOrNull(parts.sdcDateTime) ||
			parts.sdcDate ||
			stringOrNull(parts.sdcTime) ||
			stringOrNull(parts.curRcptNo) ||
			stringOrNull(parts.totRcptNo) ||
			stringOrNull(parts.intrlData) ||
			stringOrNull(parts.rcptSign) ||
			stringOrNull(parts.verificationUrl),
	);
}

export function salesTyCdFromKraPayload(...payloads: unknown[]): string | null {
	for (const payload of payloads) {
		if (!payload || typeof payload !== "object") continue;
		const rec = payload as Record<string, unknown>;
		const nested =
			rec.data && typeof rec.data === "object" && !Array.isArray(rec.data)
				? (rec.data as Record<string, unknown>)
				: rec;
		const raw = nested.salesTyCd ?? rec.salesTyCd;
		const value = String(raw ?? "").trim().toUpperCase();
		if (value) return value;
	}
	return null;
}

function assembleFiscalFields(
	base: {
		rcptSign: string | null;
		intrlData: string | null;
		curRcptNo: string | null;
		totRcptNo: string | null;
		sdcDateTime: string | null;
		verificationUrl: string | null;
		sdcId: string | null;
	},
	extras?: EtimsFiscalExtractExtras,
): EtimsFiscalFields {
	const salesTyCd = extras?.salesTyCd?.trim().toUpperCase() || null;
	const receiptLabel = kraReceiptLabel({
		isCreditNote: extras?.isCreditNote,
		salesTyCd,
	});
	const scu = formatScuDateTimeParts(base.sdcDateTime);
	const tis = formatTisDateTimeParts(base.sdcDateTime ?? extras?.tisIssuedAt ?? null);
	const tisReceiptNumber = extras?.tisReceiptNumber?.trim() || null;
	const sdcId = base.sdcId?.trim() || null;
	return {
		...base,
		sdcId,
		sdcDateTimeDisplay: formatKraSdcDateTimeDisplay(base.sdcDateTime),
		receiptLabel,
		cuInvoiceNo:
			sdcId && tisReceiptNumber
				? `${sdcId}/${tisReceiptNumber}`
				: sdcId || tisReceiptNumber,
		intrlDataDashed: dashEvery4(base.intrlData),
		rcptSignDashed: dashEvery4(base.rcptSign),
		rcptSign: stringOrNull(base.rcptSign),
		scuDate: scu?.date ?? null,
		scuTime: scu?.time ?? null,
		tisReceiptNumber,
		tisDate: tis?.date ?? null,
		tisTime: tis?.time ?? null,
		originalCuInvoiceNo: extras?.originalCuInvoiceNo?.trim() || null,
		itemCount: extras?.itemCount ?? null,
		salesTyCd,
	};
}

export function emptyEtimsFiscalFields(extras?: EtimsFiscalExtractExtras): EtimsFiscalFields {
	return assembleFiscalFields(
		{
			rcptSign: null,
			intrlData: null,
			curRcptNo: null,
			totRcptNo: null,
			sdcDateTime: null,
			verificationUrl: null,
			sdcId: extras?.sdcId ?? null,
		},
		extras,
	);
}

/** Build SCU/TIS print fields from typed manual entry (backdated invoices). */
export function buildEtimsFiscalFieldsFromManual(
	parts: ManualScuParts,
	extras?: EtimsFiscalExtractExtras,
): EtimsFiscalFields {
	const rcptSign = stringOrNull(parts.rcptSign)?.replace(/[-\s]/g, "") ?? null;
	const sdcDateTime =
		stringOrNull(parts.sdcDateTime) ?? combineScuDateTime(parts.sdcDate ?? null, parts.sdcTime);
	const tin = stringOrNull(parts.tin);
	const verificationUrl =
		stringOrNull(parts.verificationUrl) ??
		(rcptSign && tin
			? buildEtimsReceiptVerifyUrl({
					tin,
					bhfId: stringOrNull(parts.bhfId) || "00",
					rcptSign,
					isSandbox: parts.isSandbox,
				})
			: null);
	return assembleFiscalFields(
		{
			rcptSign,
			intrlData: stringOrNull(parts.intrlData),
			curRcptNo: stringOrNull(parts.curRcptNo),
			totRcptNo: stringOrNull(parts.totRcptNo),
			sdcDateTime,
			verificationUrl: verificationUrl ?? null,
			sdcId: stringOrNull(parts.sdcId) ?? extras?.sdcId ?? null,
		},
		extras,
	);
}

export function buildKraPersistFieldsFromManual(parts: ManualScuParts): {
	kraSignature: string | null;
	kraReceiptNumber: string | null;
	kraVerificationUrl: string | null;
	kraQrCode: string | null;
	kraVerifiedDate: Date | null;
	kraStatus?: InvoiceKraStatus;
	kraSyncResponse: Record<string, string | null>;
} | null {
	if (!hasManualScuInput(parts)) return null;
	const fiscal = buildEtimsFiscalFieldsFromManual(parts);
	return {
		kraSignature: fiscal.rcptSign,
		kraReceiptNumber: fiscal.curRcptNo,
		kraVerificationUrl: fiscal.verificationUrl,
		kraQrCode: fiscal.verificationUrl,
		kraVerifiedDate: parseKraSdcDateTime(fiscal.sdcDateTime),
		...(fiscal.rcptSign ? { kraStatus: "SYNCED" as const } : {}),
		kraSyncResponse: {
			sdcId: fiscal.sdcId,
			sdcDateTime: fiscal.sdcDateTime,
			intrlData: fiscal.intrlData,
			curRcptNo: fiscal.curRcptNo,
			totRcptNo: fiscal.totRcptNo,
			rcptSign: fiscal.rcptSign,
		},
	};
}

/**
 * KRA eTIMS receipt fields for printing. Always returns a TIS/SCU block;
 * SCU values are null when they were not captured yet (preview / backdated).
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
		etimsFiscal?: { sdcId?: string | null } | null;
	},
	extras?: EtimsFiscalExtractExtras,
): EtimsFiscalFields {
	const body = readKraResponseBody(invoice.kraSyncResponse);
	const rcptSign =
		stringOrNull(invoice.kraSignature) ??
		extractRcptSignFromKraResponse(invoice.kraSyncResponse) ??
		stringOrNull(body?.rcptSign);

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
			verificationUrl:
				resolveInvoiceEtimsVerificationUrl(invoice, {
					tin: extras?.tin,
					bhfId: extras?.bhfId,
					isSandbox: extras?.isSandbox,
				}) ?? null,
			sdcId:
				stringOrNull(extras?.sdcId) ??
				stringOrNull(invoice.etimsFiscal?.sdcId) ??
				extractSdcIdFromKraBody(invoice.kraSyncResponse) ??
				stringOrNull(body?.sdcId),
		},
		{
			...extras,
			salesTyCd:
				extras?.salesTyCd ??
				salesTyCdFromKraPayload(invoice.kraSyncPayload, invoice.kraSyncResponse),
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
): EtimsFiscalFields {
	if (!fields) return emptyEtimsFiscalFields(extras);
	const next = assembleFiscalFields(
		{
			rcptSign: fields.rcptSign,
			intrlData: fields.intrlData,
			curRcptNo: fields.curRcptNo,
			totRcptNo: fields.totRcptNo,
			sdcDateTime: fields.sdcDateTime,
			verificationUrl:
				fields.verificationUrl && isEtimsReceiptVerifyUrl(fields.verificationUrl)
					? normalizeEtimsReceiptVerifyUrl(fields.verificationUrl)
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
			salesTyCd: extras?.salesTyCd ?? fields.salesTyCd,
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
		etimsFiscal?: { sdcId?: string | null } | null;
	},
	extras?: EtimsFiscalExtractExtras,
): EtimsFiscalFields {
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
			etimsFiscal?: { sdcId?: string | null } | null;
		},
		{
			isCreditNote: true,
			tisReceiptNumber: extras?.tisReceiptNumber ?? creditNote.creditNumber ?? null,
			tisIssuedAt: extras?.tisIssuedAt ?? creditNote.issuedAt ?? null,
			originalCuInvoiceNo: extras?.originalCuInvoiceNo ?? creditNote.originalCuInvoiceNo ?? null,
			itemCount: extras?.itemCount ?? (Array.isArray(creditNote.lineItems) ? creditNote.lineItems.length : null),
			sdcId: extras?.sdcId ?? creditNote.etimsFiscal?.sdcId,
			tin: extras?.tin,
			bhfId: extras?.bhfId,
			isSandbox: extras?.isSandbox,
			salesTyCd:
				extras?.salesTyCd ??
				salesTyCdFromKraPayload(creditNote.kraSyncPayload, creditNote.kraSyncResponse),
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
	const p = parseKraSdcStamp(date);
	return p ? kraSdcStampToCompact(p) : null;
}
