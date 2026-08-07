import type { InvoiceKraStatus } from "./invoice-kra-status";
type KraFieldInput = {
    kraInvoiceNumber?: string | null;
    kraReceiptNumber?: string | null;
    kraSignature?: string | null;
    kraQrCode?: string | null;
    kraVerifiedDate?: Date | string | null;
    kraStatus?: InvoiceKraStatus | "VERIFIED" | null;
    kraError?: string | null;
    kraSubmittedAt?: Date | string | null;
    kraLastAttemptAt?: Date | string | null;
    kraAttemptCount?: number | null;
    kraVerificationUrl?: string | null;
    kraSyncPayload?: unknown;
    kraSyncResponse?: unknown;
};
/** DB columns set when inserting a new invoice row. */
export declare function buildInvoiceKraInsertFields(input?: KraFieldInput): {
    kraInvoiceNumber: string | null;
    kraReceiptNumber: string | null;
    kraSignature: string | null;
    kraQrCode: string | null;
    kraVerifiedDate: Date | null;
    kraStatus: "PENDING" | "NOT_APPLICABLE" | "FAILED" | "SKIPPED" | "SUBMITTING" | "SYNCED" | "VERIFIED";
    kraError: string | null;
    kraSubmittedAt: Date | null;
    kraLastAttemptAt: Date | null;
    kraAttemptCount: number;
    kraVerificationUrl: string | null;
    kraSyncPayload: {} | null;
    kraSyncResponse: {} | null;
};
/** Fields merged into invoiceDetailSchema.parse(...) from a DB invoice row. */
export declare function mapInvoiceKraDetailFields(invoice: KraFieldInput & {
    kraStatus?: string | null;
}): {
    kraInvoiceNumber: string | null;
    kraReceiptNumber: string | null;
    kraSignature: string | null;
    kraQrCode: string | null;
    kraVerifiedDate: Date | null;
    kraStatus: "PENDING" | "NOT_APPLICABLE" | "FAILED" | "SKIPPED" | "SUBMITTING" | "SYNCED" | "VERIFIED" | null;
    kraError: string | null;
    kraSubmittedAt: Date | null;
    kraLastAttemptAt: Date | null;
    kraAttemptCount: number | null;
    kraVerificationUrl: string | null;
    kraSyncPayload: {} | null;
    kraSyncResponse: {} | null;
};
/** Partial KRA columns for invoice updates (Phase 3 sync worker). */
export declare function buildInvoiceKraUpdateFields(input: KraFieldInput): Record<string, unknown>;
export {};
