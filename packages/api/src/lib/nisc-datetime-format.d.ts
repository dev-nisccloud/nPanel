/**
 * Nisc customer-facing dates: day-month-year and 24-hour time (not US month-first / 12h).
 */
/** Invoice documents, lists, and invoice emails: dd-mm-yyyy. */
export declare const INVOICE_DATE_FORMAT = "dd-MM-yyyy";
export declare function formatInvoiceDate(value: Date | string | null | undefined): string;
/** Compact dd-mm-yy for non-invoice Nisc customer surfaces. */
export declare function formatNiscDate(value: Date): string;
export declare function formatNiscDateTime(value: Date): string;
