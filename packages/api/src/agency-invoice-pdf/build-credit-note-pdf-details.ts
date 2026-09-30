import type { CreditNoteDetail, InvoiceDetail } from "../routers/invoicing/schemas";
import { extractEtimsFiscalFieldsFromCreditNote, ensureEtimsPrintFields, formatKraSdcDateTimeDisplay } from "../lib/etims-fiscal-fields";
import { resolveCreditNoteEtimsVerificationUrl } from "../lib/credit-note-customer-view";
import { buildInvoicePdfDetails } from "./build-invoice-pdf-details";
import type {
	YourDetails,
	CompanyDetails,
	InvoiceItemDetails,
	PaymentDetails,
	InvoiceTerms,
} from "./types";
import type { EtimsFiscalFields } from "../lib/etims-fiscal-fields";

export function buildCreditNotePdfDetails(creditNote: CreditNoteDetail): {
	yourDetails: YourDetails;
	companyDetails: CompanyDetails;
	invoiceDetails: InvoiceItemDetails;
	paymentDetails: PaymentDetails;
	invoiceTerms: InvoiceTerms;
	etimsFiscal: EtimsFiscalFields | null;
	documentTitle: string;
} {
	const invoiceLike = {
		...creditNote,
		invoiceNumber: creditNote.creditNumber,
		issueDate: creditNote.issuedAt,
		dueDate: null,
		kraStatus: creditNote.kraStatus,
		kraSignature: creditNote.kraSignature,
		kraReceiptNumber: creditNote.kraReceiptNumber,
		kraVerificationUrl: creditNote.kraVerificationUrl,
		kraQrCode: creditNote.kraQrCode,
		kraSyncResponse: creditNote.kraSyncResponse,
		kraVerifiedDate: creditNote.kraVerifiedDate,
	} as unknown as InvoiceDetail;

	const pdfData = buildInvoicePdfDetails(invoiceLike);
	const buyerPin =
		pdfData.invoiceTerms.buyerPin ??
		((creditNote.customerDetails as Record<string, unknown> | null)?.taxId as string | undefined);
	const originalCuInvoiceNo =
		creditNote.originalCuInvoiceNo ?? creditNote.etimsFiscal?.originalCuInvoiceNo ?? null;
	const verificationUrl =
		resolveCreditNoteEtimsVerificationUrl(creditNote) ??
		creditNote.etimsFiscal?.verificationUrl ??
		creditNote.kraVerificationUrl ??
		undefined;

	const etimsFiscal =
		extractEtimsFiscalFieldsFromCreditNote(creditNote, {
			tisReceiptNumber: creditNote.creditNumber,
			tisIssuedAt: creditNote.issuedAt,
			originalCuInvoiceNo,
			itemCount: pdfData.invoiceDetails.items.length,
		}) ??
		ensureEtimsPrintFields(creditNote.etimsFiscal, {
			isCreditNote: true,
			tisReceiptNumber: creditNote.creditNumber,
			tisIssuedAt: creditNote.issuedAt,
			originalCuInvoiceNo,
			itemCount: pdfData.invoiceDetails.items.length,
		});

	return {
		...pdfData,
		invoiceDetails: {
			...pdfData.invoiceDetails,
			negateAmounts: true,
		},
		paymentDetails: {
			etimsVerificationUrl: etimsFiscal?.verificationUrl ?? verificationUrl,
		},
		etimsFiscal,
		invoiceTerms: {
			invoiceNumber: creditNote.creditNumber ?? undefined,
			issueDate: creditNote.issuedAt ?? undefined,
			issuedAtDisplay:
				formatKraSdcDateTimeDisplay(etimsFiscal.sdcDateTime) ??
				formatKraSdcDateTimeDisplay(creditNote.issuedAt) ??
				undefined,
			dueDate: undefined,
			originalInvoiceNumber:
				creditNote.originalInvoiceNumber ?? creditNote.invoiceNumber ?? undefined,
			numberLabel: "CREDIT NOTE NO",
			showDueDate: false,
			originalCuInvoiceNo: originalCuInvoiceNo ?? undefined,
			buyerPin,
			status: creditNote.status ?? undefined,
		},
		documentTitle: "Credit Note",
	};
}
