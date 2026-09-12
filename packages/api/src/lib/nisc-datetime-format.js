/**
 * Nisc customer-facing dates: day-month-year and 24-hour time (not US month-first / 12h).
 */
export const INVOICE_DATE_FORMAT = "dd-MM-yyyy";
function pad2(n) {
    return String(n).padStart(2, "0");
}
export function formatInvoiceDate(value) {
    if (value == null || value === "")
        return "";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime()))
        return "";
    return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
}
/** Compact dd-mm-yy for non-invoice Nisc customer surfaces. */
export function formatNiscDate(value) {
    return `${pad2(value.getDate())}-${pad2(value.getMonth() + 1)}-${String(value.getFullYear()).slice(-2)}`;
}
export function formatNiscDateTime(value) {
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    return `${formatNiscDate(value)} ${hours}:${minutes}`;
}
