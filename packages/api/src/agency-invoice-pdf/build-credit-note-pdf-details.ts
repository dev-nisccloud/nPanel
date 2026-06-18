import type { CreditNoteDetail, InvoiceDetail } from "../routers/invoicing/schemas";
import { extractEtimsFiscalFieldsFromInvoice } from "../lib/etims-fiscal-fields";
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
	const verificationUrl = resolveCreditNoteEtimsVerificationUrl(creditNote);

	return {
		...pdfData,
		paymentDetails: {
			...pdfData.paymentDetails,
			etimsVerificationUrl:
				verificationUrl ??
				creditNote.etimsFiscal?.verificationUrl ??
				creditNote.kraVerificationUrl ??
				undefined,
		},
		etimsFiscal: creditNote.etimsFiscal ?? extractEtimsFiscalFieldsFromInvoice(invoiceLike),
		invoiceTerms: {
			invoiceNumber: creditNote.creditNumber ?? undefined,
			issueDate: creditNote.issuedAt ?? undefined,
			dueDate: undefined,
			originalInvoiceNumber:
				creditNote.originalInvoiceNumber ?? creditNote.invoiceNumber ?? undefined,
			numberLabel: "CREDIT NOTE NO",
			showDueDate: false,
		},
		documentTitle: "Credit Note",
	};
}
