import { isInvoiceKraSynced } from "./invoice-kra-status";
import { extractRcptSignFromKraResponse, resolveInvoiceEtimsVerificationUrl } from "./etims-receipt-url";
function readKraResponseBody(kraSyncResponse) {
    if (!kraSyncResponse || typeof kraSyncResponse !== "object")
        return null;
    const root = kraSyncResponse;
    const nested = root.data ?? root.responseBody;
    if (nested && typeof nested === "object") {
        return nested;
    }
    return root;
}
function stringOrNull(value) {
    if (value === undefined || value === null)
        return null;
    const s = String(value).trim();
    return s.length > 0 ? s : null;
}
/** Format KRA `yyyyMMddHHmmss` for display on the invoice footer. */
export function formatKraSdcDateTimeDisplay(value) {
    if (!value)
        return null;
    const s = String(value).trim();
    if (s.length === 14) {
        return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} ${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}`;
    }
    return s;
}
/**
 * Mandatory KRA eTIMS receipt fields for printing on customer invoices.
 * Returns null when the invoice is not KRA-synced or fiscal data is missing.
 */
export function extractEtimsFiscalFieldsFromInvoice(invoice) {
    if (!isInvoiceKraSynced(invoice.kraStatus)) {
        return null;
    }
    const body = readKraResponseBody(invoice.kraSyncResponse);
    const rcptSign = stringOrNull(invoice.kraSignature) ??
        extractRcptSignFromKraResponse(invoice.kraSyncResponse);
    if (!rcptSign) {
        return null;
    }
    const intrlData = stringOrNull(body?.intrlData);
    const curRcptNo = stringOrNull(body?.curRcptNo) ?? stringOrNull(invoice.kraReceiptNumber);
    const totRcptNo = stringOrNull(body?.totRcptNo);
    const sdcRaw = stringOrNull(body?.sdcDateTime);
    const sdcDateTime = sdcRaw ??
        (invoice.kraVerifiedDate instanceof Date
            ? formatKraVerifiedDateToKraString(invoice.kraVerifiedDate)
            : invoice.kraVerifiedDate
                ? formatKraVerifiedDateToKraString(new Date(invoice.kraVerifiedDate))
                : null);
    return {
        rcptSign,
        intrlData,
        curRcptNo,
        totRcptNo,
        sdcDateTime,
        sdcDateTimeDisplay: formatKraSdcDateTimeDisplay(sdcDateTime),
        verificationUrl: resolveInvoiceEtimsVerificationUrl(invoice) ?? null,
    };
}
/** KRA fiscal footer fields for credit notes (same shape as invoices). */
export function extractEtimsFiscalFieldsFromCreditNote(creditNote) {
    return extractEtimsFiscalFieldsFromInvoice(creditNote);
}
/** Fiscal footer fields in display order (labels rendered bold with a colon). */
export function getEtimsFiscalFooterFields(fields) {
    const rows = [];
    const sdc = fields.sdcDateTimeDisplay ?? fields.sdcDateTime;
    if (sdc) {
        rows.push({ label: "SDC Date-Time", value: sdc });
    }
    if (fields.intrlData) {
        rows.push({ label: "Internal Data", value: fields.intrlData });
    }
    if (fields.rcptSign) {
        rows.push({ label: "Receipt Signature", value: fields.rcptSign });
    }
    return rows;
}
/** @deprecated Use {@link getEtimsFiscalFooterFields} for styled rendering. */
export function formatEtimsFiscalFooterPrimaryLine(fields) {
    return getEtimsFiscalFooterFields(fields)
        .map(({ label, value }) => `${label}: ${value}`)
        .join(" | ");
}
function formatKraVerifiedDateToKraString(date) {
    if (Number.isNaN(date.getTime()))
        return null;
    const pad = (n) => String(n).padStart(2, "0");
    return (`${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
        `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`);
}
