import { db } from "@npanel/db";
import { fetchInvoiceDetail, mapInvoiceDetail } from "../routers/invoicing";
/**
 * Fetches an invoice in the same shape as getById (InvoiceDetail).
 * For server-side use only (e.g. PDF generation in Nisc worker). Does not perform auth.
 */
export async function getInvoiceDetailForPdf(dbClient, invoiceId) {
    const invoice = await fetchInvoiceDetail(dbClient, invoiceId);
    return mapInvoiceDetail(invoice);
}
