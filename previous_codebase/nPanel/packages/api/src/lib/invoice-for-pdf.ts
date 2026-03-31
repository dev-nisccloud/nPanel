import type { PrismaClient } from "@npanel/db";
import { fetchInvoiceDetail, mapInvoiceDetail } from "../routers/invoicing";
import type { InvoiceDetail } from "../routers/invoicing/schemas";

type DbClient = PrismaClient | Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

/**
 * Fetches an invoice in the same shape as getById (InvoiceDetail).
 * For server-side use only (e.g. PDF generation in Nisc worker). Does not perform auth.
 */
export async function getInvoiceDetailForPdf(db: DbClient, invoiceId: string): Promise<InvoiceDetail> {
	const invoice = await fetchInvoiceDetail(db, invoiceId);
	return mapInvoiceDetail(invoice);
}
