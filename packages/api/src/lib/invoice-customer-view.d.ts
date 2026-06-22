import type { InvoiceDetail } from "../routers/invoicing/schemas";
/**
 * Customer-facing invoice detail: no KRA lifecycle/admin fields.
 * Verification URL is kept only when the invoice is synced (for QR display).
 */
export declare function sanitizeInvoiceDetailForCustomer(invoice: InvoiceDetail): InvoiceDetail;
