/**
 * Map a KRA eTIMS sales-list row into InvoiceDetail / CreditNoteDetail
 * so the TIS agency PDF template can render unsigned-from-nPanel receipts.
 */
import { COMPANY_LOGO_URL } from "../lib/company-branding";
import { buildEtimsReceiptVerifyUrl } from "../lib/etims-receipt-url";
import { buildCuInvoiceNo, extractSdcIdFromKraBody } from "../lib/etims-scu-print";
import { extractEtimsFiscalFieldsFromCreditNote, extractEtimsFiscalFieldsFromInvoice } from "../lib/etims-fiscal-fields";
import type { CreditNoteDetail, InvoiceDetail } from "../routers/invoicing/schemas";

const SELLER_FROM_DETAILS = {
	name: "Nisc Cloud Limited",
	email: "accounts@nisccloud.com",
	address: "P.O BOX 21615 - 00505",
	city: "Nairobi",
	country: "Kenya",
	taxId: "P052377334H",
	logoUrl: COMPANY_LOGO_URL,
};

const CREDIT_NOTE_REASON_LABELS: Record<string, string> = {
	"01": "Missing Quantity",
	"02": "Missing Data",
	"03": "Damaged",
	"04": "Wasted",
	"05": "Raw Material Shortage",
	"06": "Refund",
};

function creditNoteReasonLabel(code?: string | null) {
	if (!code) return null;
	return CREDIT_NOTE_REASON_LABELS[code] ?? code;
}

export type EtimsSalePdfContext = {
	kraPin?: string | null;
	branchId?: string | null;
	isSandbox?: boolean;
	originalSale?: Record<string, unknown> | null;
	/** Device CU ID from initialize (`info.sdcId`), used when the sale row omits it. */
	sdcId?: string | null;
};

function receiptUrlExtras(ctx: EtimsSalePdfContext) {
	return {
		tin: ctx.kraPin,
		bhfId: ctx.branchId,
		isSandbox: ctx.isSandbox,
	};
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value as Record<string, unknown>;
}

function stringOrNull(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const s = String(value).trim();
	return s.length > 0 ? s : null;
}

function moneyString(value: unknown): string {
	const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? 0));
	return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function newPdfId(): string {
	const webCrypto = globalThis.crypto as
		| { randomUUID?: () => string; getRandomValues?: (array: Uint8Array) => Uint8Array }
		| undefined;
	if (typeof webCrypto?.randomUUID === "function") {
		return webCrypto.randomUUID();
	}
	if (typeof webCrypto?.getRandomValues === "function") {
		const bytes = webCrypto.getRandomValues(new Uint8Array(16));
		bytes[6] = (bytes[6] & 0x0f) | 0x40;
		bytes[8] = (bytes[8] & 0x3f) | 0x80;
		const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
	}
	return `etims-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseKraDate(salesDt?: unknown, cfmDt?: unknown): Date {
	const cfm = stringOrNull(cfmDt);
	if (cfm && /^\d{14}$/.test(cfm)) {
		return new Date(
			Number(cfm.slice(0, 4)),
			Number(cfm.slice(4, 6)) - 1,
			Number(cfm.slice(6, 8)),
			Number(cfm.slice(8, 10)),
			Number(cfm.slice(10, 12)),
			Number(cfm.slice(12, 14)),
		);
	}
	const sales = stringOrNull(salesDt);
	if (sales && /^\d{8}$/.test(sales)) {
		return new Date(Number(sales.slice(0, 4)), Number(sales.slice(4, 6)) - 1, Number(sales.slice(6, 8)));
	}
	const parsed = cfm ? new Date(cfm) : sales ? new Date(sales) : new Date();
	return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/** Flatten nested `receipt` so fiscal extractors can read rcptSign / curRcptNo / sdcDateTime. */
export function flattenEtimsSaleForKraBody(sale: Record<string, unknown>): Record<string, unknown> {
	const receipt = asRecord(sale.receipt) ?? {};
	return {
		...sale,
		...receipt,
		rcptSign: receipt.rcptSign ?? sale.rcptSign,
		intrlData: receipt.intrlData ?? sale.intrlData,
		curRcptNo: receipt.curRcptNo ?? sale.curRcptNo,
		totRcptNo: receipt.totRcptNo ?? sale.totRcptNo,
		sdcDateTime: receipt.sdcDateTime ?? sale.sdcDateTime ?? sale.cfmDt,
		sdcId: extractSdcIdFromKraBody(receipt) ?? extractSdcIdFromKraBody(sale) ?? receipt.sdcId ?? sale.sdcId,
		receipt,
	};
}

export function unwrapEtimsInvoiceDetails(raw: unknown): Record<string, unknown> | null {
	const root = asRecord(raw);
	if (!root) return null;
	const payload =
		asRecord(asRecord(asRecord(root.data)?.responseBody)?.data) ??
		asRecord(root.data) ??
		asRecord(asRecord(root.responseBody)?.data) ??
		root;
	const data = asRecord(payload?.data) ?? payload;
	if (!data) return null;
	if (Array.isArray(data.salesList) && asRecord(data.salesList[0])) {
		return asRecord(data.salesList[0]);
	}
	if (Array.isArray(data.saleList) && asRecord(data.saleList[0])) {
		return asRecord(data.saleList[0]);
	}
	if (data.invcNo != null || data.itemList != null || data.receipt != null) return data;
	return null;
}

export function mergeEtimsSaleWithDetails(
	sale: Record<string, unknown>,
	details: Record<string, unknown> | null,
): Record<string, unknown> {
	if (!details) return sale;
	const saleItems = Array.isArray(sale.itemList) ? sale.itemList : [];
	const detailItems = Array.isArray(details.itemList) ? details.itemList : [];
	const receipt = {
		...(asRecord(details.receipt) ?? {}),
		...(asRecord(sale.receipt) ?? {}),
	};
	const sdcId =
		extractSdcIdFromKraBody(sale) ??
		extractSdcIdFromKraBody(details) ??
		extractSdcIdFromKraBody(receipt);
	return {
		...details,
		...sale,
		itemList: saleItems.length > 0 ? saleItems : detailItems,
		receipt,
		...(sdcId ? { sdcId } : {}),
	};
}

function lineItemsFromSale(sale: Record<string, unknown>, now: Date) {
	const items = Array.isArray(sale.itemList) ? sale.itemList : [];
	return items.map((raw, index) => {
		const line = asRecord(raw) ?? {};
		const qty = Number(line.qty ?? 1) || 1;
		const prc = Number(line.prc ?? 0);
		const taxbl = Number(line.taxblAmt ?? 0);
		const unit = prc > 0 ? prc : taxbl > 0 ? taxbl / qty : Number(line.splyAmt ?? 0) / qty;
		const total = Number(line.totAmt ?? line.taxblAmt ?? unit * qty);
		return {
			id: newPdfId(),
			position: Number(line.itemSeq ?? index + 1) || index,
			name: stringOrNull(line.itemNm) ?? "Item",
			description: null,
			quantity: qty,
			unit: stringOrNull(line.qtyUnitCd),
			price: moneyString(unit),
			discount: Number(line.dcAmt ?? 0) > 0 ? moneyString(line.dcAmt) : null,
			total: moneyString(total),
			metadata: stringOrNull(line.taxTyCd) ? { etimsTaxTyCd: stringOrNull(line.taxTyCd) } : null,
			createdAt: now,
			updatedAt: now,
		};
	});
}

function taxPercentageFromSale(sale: Record<string, unknown>): number {
	const taxblB = Number(sale.taxblAmtB ?? 0);
	const taxblE = Number(sale.taxblAmtE ?? 0);
	if (taxblB > 0) return Number(sale.taxRtB ?? 16) || 16;
	if (taxblE > 0) return Number(sale.taxRtE ?? 8) || 8;
	const items = Array.isArray(sale.itemList) ? sale.itemList : [];
	const first = asRecord(items[0]);
	const ty = stringOrNull(first?.taxTyCd);
	if (ty === "B") return 16;
	if (ty === "E") return 8;
	return Number(sale.taxRtB ?? 0) || 0;
}

function discountFromSale(sale: Record<string, unknown>): string | null {
	const items = Array.isArray(sale.itemList) ? sale.itemList : [];
	const sum = items.reduce((acc, raw) => acc + Number((asRecord(raw) ?? {}).dcAmt ?? 0), 0);
	return sum > 0 ? moneyString(sum) : null;
}

function documentNumber(sale: Record<string, unknown>): string {
	return stringOrNull(sale.trdInvcNo) ?? String(sale.invcNo ?? "receipt");
}

function originalCuInvoiceNo(originalSale: Record<string, unknown> | null | undefined): string | null {
	if (!originalSale) return null;
	const body = flattenEtimsSaleForKraBody(originalSale);
	return buildCuInvoiceNo({
		sdcId: extractSdcIdFromKraBody(body) ?? stringOrNull(body.sdcId),
		curRcptNo: stringOrNull(body.curRcptNo),
		receiptLabel: "NS",
	});
}

export function buildInvoiceDetailFromEtimsSale(
	sale: Record<string, unknown>,
	ctx: EtimsSalePdfContext = {},
): InvoiceDetail {
	const now = new Date();
	const issuedAt = parseKraDate(sale.salesDt, sale.cfmDt ?? sale.stockRlsDt);
	const body = flattenEtimsSaleForKraBody(sale);
	const rcptSign = stringOrNull(body.rcptSign);
	const verificationUrl = rcptSign
		? buildEtimsReceiptVerifyUrl({
				tin: ctx.kraPin ?? "",
				bhfId: ctx.branchId ?? "",
				rcptSign,
				isSandbox: ctx.isSandbox,
			})
		: null;
	const taxbl = Number(sale.totTaxblAmt ?? 0);
	const tax = Number(sale.totTaxAmt ?? 0);
	const tot = Number(sale.totAmt ?? 0);
	const amount = tot > taxbl ? tot : taxbl + tax || tot;
	const lineItems = lineItemsFromSale(sale, issuedAt);
	const sdcId = stringOrNull(ctx.sdcId) ?? extractSdcIdFromKraBody(body);
	const fromDetails = {
		...SELLER_FROM_DETAILS,
		taxId: ctx.kraPin?.trim() || SELLER_FROM_DETAILS.taxId,
	};
	const customerName = stringOrNull(sale.custNm) ?? "Cash Sale";
	const customerTin = stringOrNull(sale.custTin);

	const detail = {
		id: newPdfId(),
		invoiceNumber: documentNumber(sale),
		customerName,
		customerEmail: null,
		status: "SENT" as const,
		amount: moneyString(amount),
		currency: "KES",
		dueDate: issuedAt,
		createdAt: issuedAt,
		updatedAt: now,
		teamId: null,
		teamName: null,
		kraStatus: "SYNCED" as const,
		customerId: null,
		subtotal: moneyString(taxbl || amount - tax),
		tax: moneyString(tax),
		taxPercentage: taxPercentageFromSale(sale),
		vat: moneyString(tax),
		discount: discountFromSale(sale),
		creditedAmount: null,
		creditBalance: null,
		amountPaid: moneyString(amount),
		amountRemaining: "0.00",
		issueDate: issuedAt,
		paidAt: issuedAt,
		sentAt: issuedAt,
		reminderSentAt: null,
		viewedAt: null,
		note: stringOrNull(sale.remark),
		internalNote: null,
		lineItems,
		transactions: [],
		creditNote: null,
		fromDetails,
		customerDetails: {
			name: customerName,
			taxId: customerTin,
		},
		paymentDetails: null,
		kraInvoiceNumber: stringOrNull(sale.invcNo),
		kraReceiptNumber: stringOrNull(body.curRcptNo),
		kraSignature: rcptSign,
		kraQrCode: verificationUrl,
		kraVerifiedDate: issuedAt,
		kraError: null,
		kraSubmittedAt: issuedAt,
		kraLastAttemptAt: issuedAt,
		kraAttemptCount: 1,
		kraVerificationUrl: verificationUrl,
		kraSyncPayload: sale,
		kraSyncResponse: sdcId ? { ...body, sdcId } : body,
	} satisfies Partial<InvoiceDetail> as InvoiceDetail;

	detail.etimsFiscal = extractEtimsFiscalFieldsFromInvoice(detail, {
		tisReceiptNumber: detail.invoiceNumber,
		tisIssuedAt: issuedAt,
		itemCount: lineItems.length,
		sdcId,
		...receiptUrlExtras(ctx),
	});

	return detail;
}

export function overlayEtimsSaleFiscalOnInvoice(
	invoice: InvoiceDetail,
	sale: Record<string, unknown>,
	ctx: EtimsSalePdfContext = {},
): InvoiceDetail {
	const mapped = buildInvoiceDetailFromEtimsSale(sale, ctx);
	const merged = {
		...invoice,
		kraStatus: invoice.kraStatus === "SYNCED" || invoice.kraStatus === "VERIFIED" ? invoice.kraStatus : "SYNCED",
		kraSignature: invoice.kraSignature ?? mapped.kraSignature,
		kraReceiptNumber: invoice.kraReceiptNumber ?? mapped.kraReceiptNumber,
		kraVerificationUrl: mapped.kraVerificationUrl ?? invoice.kraVerificationUrl,
		kraQrCode: mapped.kraQrCode ?? invoice.kraQrCode,
		kraSyncPayload: invoice.kraSyncPayload ?? mapped.kraSyncPayload,
		kraSyncResponse: invoice.kraSyncResponse ?? mapped.kraSyncResponse,
		fromDetails: invoice.fromDetails ?? mapped.fromDetails,
	} as InvoiceDetail;
	const etimsFiscal =
		extractEtimsFiscalFieldsFromInvoice(merged, {
			tisReceiptNumber: merged.invoiceNumber,
			tisIssuedAt: merged.issueDate,
			itemCount: Array.isArray(merged.lineItems) ? merged.lineItems.length : null,
			sdcId:
				stringOrNull(ctx.sdcId) ??
				extractSdcIdFromKraBody(flattenEtimsSaleForKraBody(sale)) ??
				extractSdcIdFromKraBody(merged.kraSyncResponse),
			...receiptUrlExtras(ctx),
		}) ??
		mapped.etimsFiscal ??
		(invoice.etimsFiscal?.rcptSign ? invoice.etimsFiscal : null);
	return {
		...merged,
		etimsFiscal,
	};
}

export function buildCreditNoteDetailFromEtimsSale(
	sale: Record<string, unknown>,
	ctx: EtimsSalePdfContext = {},
): CreditNoteDetail {
	const invoiceLike = overlayEtimsSaleFiscalOnInvoice(buildInvoiceDetailFromEtimsSale(sale, ctx), sale, ctx);
	const issuedAt = invoiceLike.issueDate ?? new Date();
	const originalNo = stringOrNull(sale.orgInvcNo);
	const reasonCode = stringOrNull(sale.rfdRsnCd);

	return {
		id: invoiceLike.id,
		invoiceId: newPdfId(),
		teamId: null,
		creditNumber: documentNumber(sale),
		status: "ISSUED",
		amount: invoiceLike.amount ?? "0.00",
		currency: "KES",
		reason: reasonCode ? creditNoteReasonLabel(reasonCode) : stringOrNull(sale.remark),
		note: stringOrNull(sale.remark),
		issuedAt,
		appliedAt: issuedAt,
		createdBy: "etims",
		updatedBy: null,
		createdAt: issuedAt,
		updatedAt: new Date(),
		kraRefundReasonCode: reasonCode,
		originalInvoiceNumber: originalNo,
		kraInvoiceNumber: invoiceLike.kraInvoiceNumber,
		kraReceiptNumber: invoiceLike.kraReceiptNumber,
		kraSignature: invoiceLike.kraSignature,
		kraQrCode: invoiceLike.kraQrCode,
		kraVerifiedDate: invoiceLike.kraVerifiedDate,
		kraStatus: "SYNCED",
		kraError: null,
		kraSubmittedAt: invoiceLike.kraSubmittedAt,
		kraLastAttemptAt: invoiceLike.kraLastAttemptAt,
		kraAttemptCount: 1,
		kraVerificationUrl: invoiceLike.kraVerificationUrl,
		kraSyncPayload: sale,
		kraSyncResponse: invoiceLike.kraSyncResponse,
		invoiceNumber: originalNo,
		customerName: invoiceLike.customerName,
		customerEmail: invoiceLike.customerEmail,
		fromDetails: invoiceLike.fromDetails,
		customerDetails: invoiceLike.customerDetails,
		paymentDetails: invoiceLike.paymentDetails,
		lineItems: invoiceLike.lineItems,
		subtotal: invoiceLike.subtotal,
		tax: invoiceLike.tax,
		taxPercentage: invoiceLike.taxPercentage,
		etimsFiscal: extractEtimsFiscalFieldsFromInvoice(invoiceLike, {
			isCreditNote: true,
			tisReceiptNumber: documentNumber(sale),
			tisIssuedAt: issuedAt,
			originalCuInvoiceNo: originalCuInvoiceNo(ctx.originalSale),
			itemCount: invoiceLike.lineItems.length,
			sdcId:
				stringOrNull(ctx.sdcId) ??
				extractSdcIdFromKraBody(flattenEtimsSaleForKraBody(sale)),
			...receiptUrlExtras(ctx),
		}),
		originalCuInvoiceNo: originalCuInvoiceNo(ctx.originalSale),
	} as CreditNoteDetail;
}

export function overlayEtimsSaleFiscalOnCreditNote(
	creditNote: CreditNoteDetail,
	sale: Record<string, unknown>,
	ctx: EtimsSalePdfContext = {},
): CreditNoteDetail {
	const mapped = buildCreditNoteDetailFromEtimsSale(sale, ctx);
	const merged = {
		...creditNote,
		kraStatus: creditNote.kraStatus === "SYNCED" || creditNote.kraStatus === "VERIFIED" ? creditNote.kraStatus : "SYNCED",
		kraSignature: creditNote.kraSignature ?? mapped.kraSignature,
		kraReceiptNumber: creditNote.kraReceiptNumber ?? mapped.kraReceiptNumber,
		kraVerificationUrl: mapped.kraVerificationUrl ?? creditNote.kraVerificationUrl,
		kraQrCode: mapped.kraQrCode ?? creditNote.kraQrCode,
		kraSyncPayload: creditNote.kraSyncPayload ?? mapped.kraSyncPayload,
		kraSyncResponse: creditNote.kraSyncResponse ?? mapped.kraSyncResponse,
		fromDetails: creditNote.fromDetails ?? mapped.fromDetails,
		originalCuInvoiceNo: creditNote.originalCuInvoiceNo ?? mapped.originalCuInvoiceNo,
	};
	const etimsFiscal =
		extractEtimsFiscalFieldsFromCreditNote(merged, {
			tisReceiptNumber: merged.creditNumber,
			tisIssuedAt: merged.issuedAt,
			originalCuInvoiceNo: merged.originalCuInvoiceNo,
			itemCount: Array.isArray(merged.lineItems) ? merged.lineItems.length : null,
			sdcId:
				stringOrNull(ctx.sdcId) ??
				extractSdcIdFromKraBody(flattenEtimsSaleForKraBody(sale)) ??
				extractSdcIdFromKraBody(merged.kraSyncResponse),
			...receiptUrlExtras(ctx),
		}) ??
		mapped.etimsFiscal ??
		(creditNote.etimsFiscal?.rcptSign ? creditNote.etimsFiscal : null);
	return {
		...merged,
		etimsFiscal,
	};
}
