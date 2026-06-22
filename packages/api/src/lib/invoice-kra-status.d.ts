/**
 * KRA eTIMS sync lifecycle for rows in the `invoice` table.
 * Sync is async and non-blocking; invoice creation always succeeds first.
 */
export declare const INVOICE_KRA_STATUSES: readonly ["NOT_APPLICABLE", "PENDING", "SUBMITTING", "SYNCED", "FAILED", "SKIPPED"];
export type InvoiceKraStatus = (typeof INVOICE_KRA_STATUSES)[number];
/** Set on new invoices that will be submitted to KRA when sync runs. */
export declare const INITIAL_INVOICE_KRA_STATUS: InvoiceKraStatus;
export declare function initialInvoiceKraFields(): {
    kraStatus: InvoiceKraStatus;
    kraAttemptCount: number;
};
/** KRA sale accepted; verification URL / QR available. */
export declare function isInvoiceKraSynced(status: string | null | undefined): boolean;
/** Eligible for (re)submission to KRA. */
export declare function isInvoiceKraAwaitingSync(status: string | null | undefined): boolean;
export declare function isInvoiceKraInFlight(status: string | null | undefined): boolean;
/** Fiscal invoices must be KRA-synced before customer email (except explicitly not applicable). */
export declare function invoiceRequiresKraSyncBeforeEmail(kraStatus: string | null | undefined): boolean;
export declare function kraStatusLabel(status: string | null | undefined): string;
