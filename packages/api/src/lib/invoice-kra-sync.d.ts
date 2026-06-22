export type InvoiceKraSyncResult = {
    ok: true;
    invoiceId: string;
    kraStatus: "SYNCED";
} | {
    ok: false;
    invoiceId: string;
    kraStatus: "FAILED" | "SKIPPED";
    reason: string;
} | {
    ok: false;
    invoiceId: string;
    skipped: true;
    reason: string;
};
/**
 * Submit one invoice to KRA eTIMS (saveTrnsSalesOsdc). Called by the QStash worker.
 */
export declare function processInvoiceKraSync(invoiceId: string): Promise<InvoiceKraSyncResult>;
export type EnsureInvoiceKraSyncedResult = {
    ok: true;
    invoiceId: string;
    alreadySynced: boolean;
} | {
    ok: false;
    invoiceId: string;
    kraStatus: string;
    reason: string;
};
/**
 * Blocks invoice delivery until KRA accepts the sale. Safe to call when invoice already SYNCED.
 */
export declare function ensureInvoiceKraSyncedForDelivery(invoiceId: string): Promise<EnsureInvoiceKraSyncedResult>;
