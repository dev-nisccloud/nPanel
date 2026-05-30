/**
 * Server-side invoice PDF - same as agency invoice details "Download Invoice" (agency.invoicing PdfDetails).
 */
import type { InvoiceDetail } from "../routers/invoicing/schemas";
import type { InvoiceForPdfData } from "./invoice-pdf-data";
import { generateAgencyInvoicePdfBuffer } from "../agency-invoice-pdf/generate-invoice-pdf-buffer";

export async function generateInvoicePdfBuffer(invoice: InvoiceForPdfData | InvoiceDetail): Promise<Buffer> {
	return generateAgencyInvoicePdfBuffer(invoice as InvoiceDetail);
}
