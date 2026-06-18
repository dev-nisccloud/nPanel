import type { InvoiceDetail } from "../routers/invoicing/schemas";
import { extractEtimsFiscalFieldsFromInvoice } from "./etims-fiscal-fields";
import { resolveInvoiceEtimsVerificationUrl } from "./etims-receipt-url";
import { sanitizeCreditNoteForCustomer } from "./credit-note-customer-view";

/**
 * Customer-facing invoice detail: no KRA lifecycle/admin fields.
 * Verification URL is kept only when the invoice is synced (for QR display).
 */
export function sanitizeInvoiceDetailForCustomer(invoice: InvoiceDetail): InvoiceDetail {
	const verificationUrl = resolveInvoiceEtimsVerificationUrl(invoice) ?? null;
	const etimsFiscal = extractEtimsFiscalFieldsFromInvoice(invoice);

	return {
		...invoice,
		etimsFiscal,
		kraStatus: undefined,
		kraError: null,
		kraSyncPayload: null,
		kraSyncResponse: null,
		kraSignature: null,
		kraReceiptNumber: null,
		kraInvoiceNumber: null,
		kraVerifiedDate: null,
		kraSubmittedAt: null,
		kraLastAttemptAt: null,
		kraAttemptCount: null,
		kraVerificationUrl: verificationUrl,
		kraQrCode: verificationUrl,
		creditNote: invoice.creditNote
			? sanitizeCreditNoteForCustomer(invoice.creditNote)
			: invoice.creditNote,
	};
}
