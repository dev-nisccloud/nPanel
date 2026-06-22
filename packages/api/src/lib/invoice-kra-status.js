/**
 * KRA eTIMS sync lifecycle for rows in the `invoice` table.
 * Sync is async and non-blocking; invoice creation always succeeds first.
 */
export const INVOICE_KRA_STATUSES = [
    "NOT_APPLICABLE",
    "PENDING",
    "SUBMITTING",
    "SYNCED",
    "FAILED",
    "SKIPPED",
];
/** Set on new invoices that will be submitted to KRA when sync runs. */
export const INITIAL_INVOICE_KRA_STATUS = "PENDING";
export function initialInvoiceKraFields() {
    return {
        kraStatus: INITIAL_INVOICE_KRA_STATUS,
        kraAttemptCount: 0,
    };
}
/** KRA sale accepted; verification URL / QR available. */
export function isInvoiceKraSynced(status) {
    return status === "SYNCED" || status === "VERIFIED";
}
/** Eligible for (re)submission to KRA. */
export function isInvoiceKraAwaitingSync(status) {
    return status === "PENDING" || status === "FAILED";
}
export function isInvoiceKraInFlight(status) {
    return status === "SUBMITTING";
}
/** Fiscal invoices must be KRA-synced before customer email (except explicitly not applicable). */
export function invoiceRequiresKraSyncBeforeEmail(kraStatus) {
    if (kraStatus === "NOT_APPLICABLE")
        return false;
    return !isInvoiceKraSynced(kraStatus);
}
export function kraStatusLabel(status) {
    switch (status) {
        case "SYNCED":
        case "VERIFIED":
            return "Synced";
        case "PENDING":
            return "Pending";
        case "SUBMITTING":
            return "Submitting";
        case "FAILED":
            return "Failed";
        case "SKIPPED":
            return "Skipped";
        case "NOT_APPLICABLE":
            return "Not applicable";
        default:
            return status ? String(status) : "Pending";
    }
}
