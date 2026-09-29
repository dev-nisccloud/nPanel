/**
 * KRA public receipt verification URL.
 *
 * Live receipts use `?Data=` plus PIN + branch + receipt signature. Sandbox uses etims-sbx.
 */
export function buildEtimsReceiptVerifyUrl(params: {
    tin: string;
    bhfId: string;
    rcptSign: string;
    isSandbox?: boolean;
}): string | null {
    const tin = params.tin?.trim();
    const bhfId = params.bhfId?.trim();
    const rcptSign = params.rcptSign?.trim().replace(/-/g, "");
    if (!tin || !bhfId || !rcptSign) return null;

    const host = params.isSandbox ? "https://etims-sbx.kra.go.ke" : "https://etims.kra.go.ke";
    return `${host}/common/link/etims/receipt/indexEtimsReceiptData?Data=${tin}${bhfId}${rcptSign}`;
}

export function extractRcptSign(invoice: Record<string, unknown>): string | null {
    const receipt = (invoice.receipt ?? {}) as Record<string, unknown>;
    const sign = receipt.rcptSign ?? invoice.rcptSign;
    return sign ? String(sign).trim() : null;
}
