/**
 * Server-only invoice PDF generation (delegates to @npanel/api for Nisc worker and other routes).
 */
export { generateInvoicePdfBuffer } from "@npanel/api/lib/generate-invoice-pdf";
export type { InvoiceForPdfData } from "@npanel/api/lib/invoice-pdf-data";

