/**
 * Server-side invoice PDF - same as agency invoice details "Download Invoice" (agency.invoicing PdfDetails).
 */
import type { InvoiceDetail } from "../routers/invoicing/schemas";
import type { InvoiceForPdfData } from "./invoice-pdf-data";
export declare function generateInvoicePdfBuffer(invoice: InvoiceForPdfData | InvoiceDetail): Promise<Buffer>;
