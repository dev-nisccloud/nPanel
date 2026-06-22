import { initialInvoiceKraFields } from "./invoice-kra-status";
function parseOptionalDate(value) {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    return value instanceof Date ? value : new Date(value);
}
function stringOrNull(value) {
    if (value === undefined || value === null)
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
export function buildCreditNoteKraInsertFields(input) {
    const initial = initialInvoiceKraFields();
    return {
        kraInvoiceNumber: stringOrNull(input?.kraInvoiceNumber),
        kraReceiptNumber: stringOrNull(input?.kraReceiptNumber),
        kraSignature: stringOrNull(input?.kraSignature),
        kraQrCode: stringOrNull(input?.kraQrCode),
        kraVerifiedDate: parseOptionalDate(input?.kraVerifiedDate) ?? null,
        kraStatus: input?.kraStatus ?? initial.kraStatus,
        kraError: stringOrNull(input?.kraError),
        kraSubmittedAt: parseOptionalDate(input?.kraSubmittedAt) ?? null,
        kraLastAttemptAt: parseOptionalDate(input?.kraLastAttemptAt) ?? null,
        kraAttemptCount: input?.kraAttemptCount ?? initial.kraAttemptCount,
        kraVerificationUrl: stringOrNull(input?.kraVerificationUrl),
        kraSyncPayload: input?.kraSyncPayload !== undefined && input.kraSyncPayload !== null
            ? input.kraSyncPayload
            : null,
        kraSyncResponse: input?.kraSyncResponse !== undefined && input.kraSyncResponse !== null
            ? input.kraSyncResponse
            : null,
    };
}
export function mapCreditNoteKraDetailFields(creditNote) {
    return {
        kraInvoiceNumber: stringOrNull(creditNote.kraInvoiceNumber),
        kraReceiptNumber: stringOrNull(creditNote.kraReceiptNumber),
        kraSignature: stringOrNull(creditNote.kraSignature),
        kraQrCode: stringOrNull(creditNote.kraQrCode),
        kraVerifiedDate: creditNote.kraVerifiedDate instanceof Date
            ? creditNote.kraVerifiedDate
            : creditNote.kraVerifiedDate
                ? new Date(creditNote.kraVerifiedDate)
                : null,
        kraStatus: creditNote.kraStatus ?? null,
        kraError: stringOrNull(creditNote.kraError),
        kraSubmittedAt: creditNote.kraSubmittedAt instanceof Date
            ? creditNote.kraSubmittedAt
            : creditNote.kraSubmittedAt
                ? new Date(creditNote.kraSubmittedAt)
                : null,
        kraLastAttemptAt: creditNote.kraLastAttemptAt instanceof Date
            ? creditNote.kraLastAttemptAt
            : creditNote.kraLastAttemptAt
                ? new Date(creditNote.kraLastAttemptAt)
                : null,
        kraAttemptCount: typeof creditNote.kraAttemptCount === "number" ? creditNote.kraAttemptCount : null,
        kraVerificationUrl: stringOrNull(creditNote.kraVerificationUrl),
        kraSyncPayload: creditNote.kraSyncPayload ?? null,
        kraSyncResponse: creditNote.kraSyncResponse ?? null,
    };
}
