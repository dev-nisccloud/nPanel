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
/** DB columns set when inserting a new invoice row. */
export function buildInvoiceKraInsertFields(input) {
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
/** Fields merged into invoiceDetailSchema.parse(...) from a DB invoice row. */
export function mapInvoiceKraDetailFields(invoice) {
    return {
        kraInvoiceNumber: stringOrNull(invoice.kraInvoiceNumber),
        kraReceiptNumber: stringOrNull(invoice.kraReceiptNumber),
        kraSignature: stringOrNull(invoice.kraSignature),
        kraQrCode: stringOrNull(invoice.kraQrCode),
        kraVerifiedDate: invoice.kraVerifiedDate instanceof Date
            ? invoice.kraVerifiedDate
            : invoice.kraVerifiedDate
                ? new Date(invoice.kraVerifiedDate)
                : null,
        kraStatus: invoice.kraStatus ?? null,
        kraError: stringOrNull(invoice.kraError),
        kraSubmittedAt: invoice.kraSubmittedAt instanceof Date
            ? invoice.kraSubmittedAt
            : invoice.kraSubmittedAt
                ? new Date(invoice.kraSubmittedAt)
                : null,
        kraLastAttemptAt: invoice.kraLastAttemptAt instanceof Date
            ? invoice.kraLastAttemptAt
            : invoice.kraLastAttemptAt
                ? new Date(invoice.kraLastAttemptAt)
                : null,
        kraAttemptCount: typeof invoice.kraAttemptCount === "number" ? invoice.kraAttemptCount : null,
        kraVerificationUrl: stringOrNull(invoice.kraVerificationUrl),
        kraSyncPayload: invoice.kraSyncPayload ?? null,
        kraSyncResponse: invoice.kraSyncResponse ?? null,
    };
}
/** Partial KRA columns for invoice updates (Phase 3 sync worker). */
export function buildInvoiceKraUpdateFields(input) {
    const out = {};
    if (Object.prototype.hasOwnProperty.call(input, "kraInvoiceNumber")) {
        out.kraInvoiceNumber = stringOrNull(input.kraInvoiceNumber);
    }
    if (Object.prototype.hasOwnProperty.call(input, "kraReceiptNumber")) {
        out.kraReceiptNumber = stringOrNull(input.kraReceiptNumber);
    }
    if (Object.prototype.hasOwnProperty.call(input, "kraSignature")) {
        out.kraSignature = stringOrNull(input.kraSignature);
    }
    if (Object.prototype.hasOwnProperty.call(input, "kraQrCode")) {
        out.kraQrCode = stringOrNull(input.kraQrCode);
    }
    if (Object.prototype.hasOwnProperty.call(input, "kraVerifiedDate")) {
        out.kraVerifiedDate = parseOptionalDate(input.kraVerifiedDate) ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "kraStatus")) {
        out.kraStatus = input.kraStatus ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "kraError")) {
        out.kraError = stringOrNull(input.kraError);
    }
    if (Object.prototype.hasOwnProperty.call(input, "kraSubmittedAt")) {
        out.kraSubmittedAt = parseOptionalDate(input.kraSubmittedAt) ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "kraLastAttemptAt")) {
        out.kraLastAttemptAt = parseOptionalDate(input.kraLastAttemptAt) ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "kraAttemptCount")) {
        out.kraAttemptCount = input.kraAttemptCount ?? 0;
    }
    if (Object.prototype.hasOwnProperty.call(input, "kraVerificationUrl")) {
        out.kraVerificationUrl = stringOrNull(input.kraVerificationUrl);
    }
    if (Object.prototype.hasOwnProperty.call(input, "kraSyncPayload")) {
        out.kraSyncPayload = input.kraSyncPayload ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "kraSyncResponse")) {
        out.kraSyncResponse = input.kraSyncResponse ?? null;
    }
    return out;
}
