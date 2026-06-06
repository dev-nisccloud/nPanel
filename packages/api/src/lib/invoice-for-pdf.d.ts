import { db } from "@npanel/db";
import type { InvoiceDetail } from "../routers/invoicing/schemas";
type DbLike = typeof db;
/**
 * Fetches an invoice in the same shape as getById (InvoiceDetail).
 * For server-side use only (e.g. PDF generation in Nisc worker). Does not perform auth.
 */
export declare function getInvoiceDetailForPdf(dbClient: DbLike, invoiceId: string): Promise<InvoiceDetail>;
export {};
