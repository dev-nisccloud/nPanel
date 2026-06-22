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
export declare function buildCreditNoteKraInsertFields(input?: KraFieldInput): {
    kraInvoiceNumber: string | null;
    kraReceiptNumber: string | null;
    kraSignature: string | null;
    kraQrCode: string | null;
    kraVerifiedDate: Date | null;
    kraStatus: "PENDING" | "NOT_APPLICABLE" | "SUBMITTING" | "SYNCED" | "FAILED" | "SKIPPED" | "VERIFIED";
    kraError: string | null;
    kraSubmittedAt: Date | null;
    kraLastAttemptAt: Date | null;
    kraAttemptCount: number;
    kraVerificationUrl: string | null;
    kraSyncPayload: {} | null;
    kraSyncResponse: {} | null;
};
export declare function mapCreditNoteKraDetailFields(creditNote: KraFieldInput & {
    kraStatus?: string | null;
}): {
    kraInvoiceNumber: string | null;
    kraReceiptNumber: string | null;
    kraSignature: string | null;
    kraQrCode: string | null;
    kraVerifiedDate: Date | null;
    kraStatus: "PENDING" | "NOT_APPLICABLE" | "SUBMITTING" | "SYNCED" | "FAILED" | "SKIPPED" | "VERIFIED" | null;
    kraError: string | null;
    kraSubmittedAt: Date | null;
    kraLastAttemptAt: Date | null;
    kraAttemptCount: number | null;
    kraVerificationUrl: string | null;
    kraSyncPayload: {} | null;
    kraSyncResponse: {} | null;
};
export {};
