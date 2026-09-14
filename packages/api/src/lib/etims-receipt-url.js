import { isInvoiceKraSynced } from "./invoice-kra-status";

const RECEIPT_PATH = "/common/link/etims/receipt/indexEtimsReceiptData";
const RECEIPT_PATH_KRA_TYPO = "/common/link/etims/receipt/indexEtimsReceptData";

function asRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value;
}

function pickStr(...values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
}

export function isEtimsReceiptVerifyUrl(url) {
    const trimmed = url?.trim();
    if (!trimmed) return false;
    if (!trimmed.startsWith("https://etims") || !trimmed.includes("kra.go.ke")) return false;
    return trimmed.includes(RECEIPT_PATH) || trimmed.includes(RECEIPT_PATH_KRA_TYPO);
}

function receiptIsSandbox(storedUrl, explicit) {
    if (typeof explicit === "boolean") return explicit;
    if (storedUrl?.includes("etims-sbx.kra.go.ke")) return true;
    if (storedUrl?.includes("etims.kra.go.ke")) return false;
    return true;
}

export function buildEtimsReceiptVerifyUrl(params) {
    const tin = params.tin?.trim();
    const bhfId = params.bhfId?.trim();
    const rcptSign = params.rcptSign?.trim().replace(/-/g, "");
    if (!tin || !bhfId || !rcptSign) return null;
    const host = params.isSandbox ? "https://etims-sbx.kra.go.ke" : "https://etims.kra.go.ke";
    return `${host}${RECEIPT_PATH}?${tin}${bhfId}${rcptSign}`;
}

export function extractOscuIdentityForReceiptUrl(invoice) {
    const from = asRecord(invoice.fromDetails);
    const payload = asRecord(invoice.kraSyncPayload);
    const response = asRecord(invoice.kraSyncResponse);
    const nested = asRecord(response?.data) ?? asRecord(response?.responseBody) ?? response;
    const receipt = asRecord(nested?.receipt) ?? asRecord(payload?.receipt);
    const tin = pickStr(payload?.tin, nested?.tin, from?.taxId);
    const bhfId = pickStr(payload?.bhfId, nested?.bhfId) || "00";
    const rcptSign = pickStr(
        invoice.kraSignature,
        nested?.rcptSign,
        receipt?.rcptSign,
        extractRcptSignFromKraResponse(invoice.kraSyncResponse),
    );
    if (!tin || !rcptSign) return null;
    return { tin, bhfId, rcptSign: rcptSign.replace(/-/g, "") };
}

export function resolveInvoiceEtimsVerificationUrl(invoice, opts) {
    const stored = pickStr(invoice.kraVerificationUrl, invoice.kraQrCode) ?? undefined;
    const identity = extractOscuIdentityForReceiptUrl(invoice);
    if (identity) {
        const rebuilt = buildEtimsReceiptVerifyUrl({
            ...identity,
            isSandbox: receiptIsSandbox(stored, opts?.isSandbox),
        });
        if (rebuilt) return rebuilt;
    }
    if (stored && isEtimsReceiptVerifyUrl(stored)) return stored;
    if (!isInvoiceKraSynced(invoice.kraStatus)) return undefined;
    return undefined;
}

export function extractRcptSignFromKraResponse(data) {
    if (!data || typeof data !== "object") return null;
    const root = data;
    const body = (root.responseBody ?? root.data ?? root);
    const nested = asRecord(body.data) ?? body;
    const sign = nested.rcptSign ?? body.rcptSign ?? body.receipt?.rcptSign;
    return sign ? String(sign).trim() : null;
}

export function parseKraSdcDateTime(value) {
    if (!value) return null;
    const s = String(value).trim();
    if (s.length !== 14) return null;
    const y = Number(s.slice(0, 4));
    const m = Number(s.slice(4, 6)) - 1;
    const d = Number(s.slice(6, 8));
    const hh = Number(s.slice(8, 10));
    const mm = Number(s.slice(10, 12));
    const ss = Number(s.slice(12, 14));
    const dt = new Date(y, m, d, hh, mm, ss);
    return Number.isNaN(dt.getTime()) ? null : dt;
}
