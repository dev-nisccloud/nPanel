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
] as const;

export type InvoiceKraStatus = (typeof INVOICE_KRA_STATUSES)[number];

/** Set on new invoices that will be submitted to KRA when sync runs. */
export const INITIAL_INVOICE_KRA_STATUS: InvoiceKraStatus = "PENDING";

export function initialInvoiceKraFields(): {
	kraStatus: InvoiceKraStatus;
	kraAttemptCount: number;
} {
	return {
		kraStatus: INITIAL_INVOICE_KRA_STATUS,
		kraAttemptCount: 0,
	};
}

/** KRA sale accepted; verification URL / QR available. */
export function isInvoiceKraSynced(status: string | null | undefined): boolean {
	return status === "SYNCED" || status === "VERIFIED";
}

/** Eligible for (re)submission to KRA. */
export function isInvoiceKraAwaitingSync(status: string | null | undefined): boolean {
	return status === "PENDING" || status === "FAILED";
}

export function isInvoiceKraInFlight(status: string | null | undefined): boolean {
	return status === "SUBMITTING";
}

/** Fiscal invoices must be KRA-synced before customer email (except explicitly not applicable). */
export function invoiceRequiresKraSyncBeforeEmail(
	kraStatus: string | null | undefined,
): boolean {
	if (kraStatus === "NOT_APPLICABLE") return false;
	return !isInvoiceKraSynced(kraStatus);
}

export function kraStatusLabel(status: string | null | undefined): string {
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
