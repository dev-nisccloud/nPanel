import type { InvoiceDetail } from "../routers/invoicing/schemas";
export declare function generateAgencyInvoicePdfBuffer(invoice: InvoiceDetail): Promise<Buffer>;
