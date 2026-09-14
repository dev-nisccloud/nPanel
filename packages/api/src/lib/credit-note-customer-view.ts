import type { CreditNoteDetail, CreditNote } from "../routers/invoicing/schemas";
import { extractEtimsFiscalFieldsFromCreditNote } from "./etims-fiscal-fields";
import {
	resolveInvoiceEtimsVerificationUrl,
	type EtimsReceiptUrlSource,
} from "./etims-receipt-url";

export function resolveCreditNoteEtimsVerificationUrl(
	creditNote: EtimsReceiptUrlSource,
): string | undefined {
	return resolveInvoiceEtimsVerificationUrl(creditNote);
}

/** Strip KRA admin fields from credit note payloads embedded on invoices. */
export function sanitizeCreditNoteForCustomer(
	creditNote: CreditNote,
): CreditNote & { etimsFiscal?: ReturnType<typeof extractEtimsFiscalFieldsFromCreditNote> } {
	const verificationUrl = resolveCreditNoteEtimsVerificationUrl(creditNote) ?? null;
	const etimsFiscal = extractEtimsFiscalFieldsFromCreditNote(creditNote);
	return {
		...creditNote,
		etimsFiscal: etimsFiscal ?? undefined,
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
	};
}

/** Customer-facing credit note detail  no KRA admin fields. */
export function sanitizeCreditNoteDetailForCustomer(
	creditNote: CreditNoteDetail,
): CreditNoteDetail {
	return sanitizeCreditNoteForCustomer(creditNote) as CreditNoteDetail;
}
