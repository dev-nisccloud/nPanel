import { extractEtimsFiscalFieldsFromCreditNote } from "./etims-fiscal-fields";
import { isInvoiceKraSynced } from "./invoice-kra-status";
export function resolveCreditNoteEtimsVerificationUrl(creditNote) {
    const url = creditNote.kraVerificationUrl ?? creditNote.kraQrCode;
    const trimmed = url?.trim();
    if (trimmed)
        return trimmed;
    if (!isInvoiceKraSynced(creditNote.kraStatus))
        return undefined;
    return undefined;
}
/** Strip KRA admin fields from credit note payloads embedded on invoices. */
export function sanitizeCreditNoteForCustomer(creditNote) {
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
/** Customer-facing credit note detail — no KRA admin fields. */
export function sanitizeCreditNoteDetailForCustomer(creditNote) {
    return sanitizeCreditNoteForCustomer(creditNote);
}
