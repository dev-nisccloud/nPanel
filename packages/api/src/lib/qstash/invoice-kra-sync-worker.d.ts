export type InvoiceKraSyncJobPayload = {
    invoiceId: string;
};
export type InvoiceKraSyncJobResult = {
    messageId: string;
};
/**
 * Enqueue async KRA eTIMS sync for an invoice. Never throws — logs on failure.
 */
export declare function scheduleInvoiceKraSyncAfterCreate(invoiceId: string, options?: {
    status?: string | null;
}): Promise<void>;
export declare function enqueueInvoiceKraSync(invoiceId: string): Promise<InvoiceKraSyncJobResult | null>;
