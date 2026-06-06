/**
 * Nisc customer-facing dates: dd-mm-yy and 24-hour time (not US month-first / 12h).
 */
export function formatNiscDate(value) {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = String(value.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
}
export function formatNiscDateTime(value) {
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    return `${formatNiscDate(value)} ${hours}:${minutes}`;
}
